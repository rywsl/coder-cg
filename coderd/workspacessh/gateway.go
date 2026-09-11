// Package workspacessh exposes workspace agents through a deployment-managed
// OpenSSH endpoint.
package workspacessh

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/netip"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/prometheus/client_golang/prometheus"
	"golang.org/x/crypto/ssh"
	"golang.org/x/time/rate"
	"golang.org/x/xerrors"

	"cdr.dev/slog/v3"
)

const (
	defaultExternalHandshakeTimeout = 30 * time.Second
	defaultAuthenticationTimeout    = 10 * time.Second
	defaultAgentDialTimeout         = 30 * time.Second
	defaultAgentHandshakeTimeout    = 10 * time.Second
	defaultRecordTimeout            = 5 * time.Second
	defaultRecordQueueSize          = 256
	maximumAuthLimiterEntries       = 4096
)

// Limits bounds resources consumed by SSH connections before and after
// authentication.
type Limits struct {
	MaxConnections             int
	MaxPendingConnections      int
	MaxPendingConnectionsPerIP int
	MaxConnectionsPerUser      int
	MaxChannelsPerConnection   int
	AuthAttemptsPerMinute      int
	AuthAttemptsBurst          int
}

// DefaultLimits returns the deployment defaults for a public gateway.
func DefaultLimits() Limits {
	return Limits{
		MaxConnections:             1024,
		MaxPendingConnections:      128,
		MaxPendingConnectionsPerIP: 16,
		MaxConnectionsPerUser:      32,
		MaxChannelsPerConnection:   64,
		AuthAttemptsPerMinute:      120,
		AuthAttemptsBurst:          20,
	}
}

// Timeouts bounds external work performed for one SSH connection. Zero values
// use package defaults.
type Timeouts struct {
	ExternalHandshake time.Duration
	Authentication    time.Duration
	AgentDial         time.Duration
	AgentHandshake    time.Duration
	Record            time.Duration
}

// Target identifies the user and workspace agent selected during public key
// authentication. It contains no credentials.
type Target struct {
	WorkspaceSSHKeyID uuid.UUID
	UserID            uuid.UUID
	Username          string
	OrganizationID    uuid.UUID
	OrganizationName  string
	WorkspaceOwnerID  uuid.UUID
	WorkspaceID       uuid.UUID
	WorkspaceName     string
	AgentID           uuid.UUID
	AgentName         string
	ExpandedDirectory string
}

// ConnectionEvent describes one authenticated gateway connection.
type ConnectionEvent struct {
	ConnectionID   uuid.UUID
	Target         Target
	RemoteAddr     net.Addr
	ConnectedAt    time.Time
	DisconnectedAt time.Time
	Result         string
}

// Config configures a Gateway.
type Config struct {
	ListenAddress string
	HostSigner    ssh.Signer
	Logger        slog.Logger
	Registerer    prometheus.Registerer
	Metrics       *Metrics
	Codex         CodexConfig
	Limits        Limits
	Timeouts      Timeouts
	Authenticate  func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error)
	Verified      func(context.Context, Target) error
	DialAgent     func(context.Context, Target) (net.Conn, func(), error)
	Record        func(context.Context, ConnectionEvent)
}

// TargetUnavailableError marks an authentication or dial failure caused by a
// workspace agent that cannot accept an SSH connection.
type TargetUnavailableError struct {
	Reason string
	Err    error
}

func (e *TargetUnavailableError) Error() string {
	if e.Err == nil {
		return e.Reason
	}
	return fmt.Sprintf("%s: %v", e.Reason, e.Err)
}

func (e *TargetUnavailableError) Unwrap() error { return e.Err }

// Gateway terminates external SSH and proxies authenticated connections to
// workspace agent SSH servers.
type Gateway struct {
	config   Config
	listener net.Listener
	metrics  *Metrics
	ctx      context.Context
	cancel   context.CancelFunc

	mu           sync.Mutex
	connections  map[*connectionState]struct{}
	pending      int
	pendingByIP  map[string]int
	activeByUser map[uuid.UUID]int
	authLimiters map[string]*authLimiter
	wg           sync.WaitGroup
	records      chan ConnectionEvent
	recordWG     sync.WaitGroup
	closeOnce    sync.Once
	forceOnce    sync.Once
	closed       chan struct{}
}

type connectionState struct {
	external      net.Conn
	agent         net.Conn
	remoteIP      string
	pending       bool
	authenticated bool
	userID        uuid.UUID
	shutdown      bool
}

type authLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// Metrics contains the process-wide workspace SSH gateway collectors. Reuse
// one instance when a listener may be stopped and started again.
type Metrics struct {
	active            prometheus.Gauge
	pending           prometheus.Gauge
	authFailures      *prometheus.CounterVec
	authRateLimited   prometheus.Counter
	capacityRejected  *prometheus.CounterVec
	targetUnreachable *prometheus.CounterVec
	timeouts          *prometheus.CounterVec
	eventsDropped     *prometheus.CounterVec
	duration          *prometheus.HistogramVec
}

// LoadHostSigner reads an OpenSSH private key and requires an Ed25519 host key
// with owner-only permissions.
func LoadHostSigner(path string) (ssh.Signer, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, xerrors.Errorf("stat workspace SSH gateway host key: %w", err)
	}
	if info.Mode().Perm()&0o077 != 0 {
		return nil, xerrors.New("workspace SSH gateway host key must not be accessible by group or others")
	}
	key, err := os.ReadFile(path)
	if err != nil {
		return nil, xerrors.Errorf("read workspace SSH gateway host key: %w", err)
	}
	return ParseHostSigner(key)
}

// ParseHostSigner parses an Ed25519 OpenSSH private host key.
func ParseHostSigner(key []byte) (ssh.Signer, error) {
	signer, err := ssh.ParsePrivateKey(key)
	if err != nil {
		return nil, xerrors.Errorf("parse workspace SSH gateway host key: %w", err)
	}
	if signer.PublicKey().Type() != ssh.KeyAlgoED25519 {
		return nil, xerrors.Errorf("workspace SSH gateway host key must be Ed25519, got %q", signer.PublicKey().Type())
	}
	return signer, nil
}

// New starts a Gateway listener. A successful return means the configured
// address is already bound and ready to accept connections.
func New(config Config) (*Gateway, error) {
	if config.HostSigner == nil {
		return nil, xerrors.New("workspace SSH gateway host signer is required")
	}
	if config.HostSigner.PublicKey().Type() != ssh.KeyAlgoED25519 {
		return nil, xerrors.Errorf("workspace SSH gateway host key must be Ed25519, got %q", config.HostSigner.PublicKey().Type())
	}
	if config.Authenticate == nil || config.DialAgent == nil {
		return nil, xerrors.New("workspace SSH gateway authentication and agent dial callbacks are required")
	}
	if config.Limits == (Limits{}) {
		config.Limits = DefaultLimits()
	}
	if err := validateLimits(config.Limits); err != nil {
		return nil, err
	}
	config.Timeouts = withDefaultTimeouts(config.Timeouts)

	listener, err := net.Listen("tcp", config.ListenAddress)
	if err != nil {
		return nil, xerrors.Errorf("listen for workspace SSH gateway: %w", err)
	}
	gateway := &Gateway{
		config:       config,
		listener:     listener,
		metrics:      config.Metrics,
		connections:  make(map[*connectionState]struct{}),
		pendingByIP:  make(map[string]int),
		activeByUser: make(map[uuid.UUID]int),
		authLimiters: make(map[string]*authLimiter),
		records:      make(chan ConnectionEvent, defaultRecordQueueSize),
		closed:       make(chan struct{}),
	}
	if gateway.metrics == nil {
		gateway.metrics = newGatewayMetrics()
	}
	if config.Metrics == nil && config.Registerer != nil {
		if err := gateway.metrics.register(config.Registerer); err != nil {
			_ = listener.Close()
			return nil, xerrors.Errorf("register workspace SSH gateway metrics: %w", err)
		}
	}
	gateway.ctx, gateway.cancel = context.WithCancel(context.Background())

	gateway.recordWG.Go(gateway.recordEvents)
	gateway.wg.Add(1)
	go gateway.serve()
	return gateway, nil
}

func validateLimits(limits Limits) error {
	values := []struct {
		name  string
		value int
	}{
		{"maximum connections", limits.MaxConnections},
		{"maximum pending connections", limits.MaxPendingConnections},
		{"maximum pending connections per IP", limits.MaxPendingConnectionsPerIP},
		{"maximum connections per user", limits.MaxConnectionsPerUser},
		{"maximum channels per connection", limits.MaxChannelsPerConnection},
		{"authentication attempts per minute", limits.AuthAttemptsPerMinute},
		{"authentication attempt burst", limits.AuthAttemptsBurst},
	}
	for _, value := range values {
		if value.value <= 0 {
			return xerrors.Errorf("workspace SSH gateway %s must be positive", value.name)
		}
	}
	if limits.MaxPendingConnections > limits.MaxConnections {
		return xerrors.New("workspace SSH gateway maximum pending connections must not exceed maximum connections")
	}
	return nil
}

func withDefaultTimeouts(timeouts Timeouts) Timeouts {
	if timeouts.ExternalHandshake <= 0 {
		timeouts.ExternalHandshake = defaultExternalHandshakeTimeout
	}
	if timeouts.Authentication <= 0 {
		timeouts.Authentication = defaultAuthenticationTimeout
	}
	if timeouts.AgentDial <= 0 {
		timeouts.AgentDial = defaultAgentDialTimeout
	}
	if timeouts.AgentHandshake <= 0 {
		timeouts.AgentHandshake = defaultAgentHandshakeTimeout
	}
	if timeouts.Record <= 0 {
		timeouts.Record = defaultRecordTimeout
	}
	return timeouts
}

// Addr returns the bound listener address.
func (g *Gateway) Addr() net.Addr { return g.listener.Addr() }

func newGatewayMetrics() *Metrics {
	return &Metrics{
		active: prometheus.NewGauge(prometheus.GaugeOpts{
			Namespace: "coder",
			Subsystem: "workspace_ssh_gateway",
			Name:      "connections",
			Help:      "Number of active authenticated workspace SSH gateway connections.",
		}),
		pending: prometheus.NewGauge(prometheus.GaugeOpts{
			Namespace: "coder",
			Subsystem: "workspace_ssh_gateway",
			Name:      "pending_connections",
			Help:      "Number of workspace SSH gateway connections awaiting authentication.",
		}),
		authFailures: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: "coder",
			Subsystem: "workspace_ssh_gateway",
			Name:      "authentication_failures_total",
			Help:      "Number of workspace SSH gateway authentication failures.",
		}, []string{"reason"}),
		authRateLimited: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: "coder",
			Subsystem: "workspace_ssh_gateway",
			Name:      "authentication_rate_limited_total",
			Help:      "Number of workspace SSH gateway authentication attempts rejected by source IP rate limits.",
		}),
		capacityRejected: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: "coder",
			Subsystem: "workspace_ssh_gateway",
			Name:      "capacity_rejections_total",
			Help:      "Number of workspace SSH gateway operations rejected by a configured capacity limit.",
		}, []string{"reason"}),
		targetUnreachable: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: "coder",
			Subsystem: "workspace_ssh_gateway",
			Name:      "target_unreachable_total",
			Help:      "Number of workspace SSH gateway connections rejected because the target was unavailable.",
		}, []string{"reason"}),
		timeouts: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: "coder",
			Subsystem: "workspace_ssh_gateway",
			Name:      "timeouts_total",
			Help:      "Number of workspace SSH gateway operations that reached their deadline.",
		}, []string{"operation"}),
		eventsDropped: prometheus.NewCounterVec(prometheus.CounterOpts{
			Namespace: "coder",
			Subsystem: "workspace_ssh_gateway",
			Name:      "events_dropped_total",
			Help:      "Number of workspace SSH gateway events dropped before recording.",
		}, []string{"event"}),
		duration: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Namespace: "coder",
			Subsystem: "workspace_ssh_gateway",
			Name:      "connection_duration_seconds",
			Help:      "Duration of authenticated workspace SSH gateway connections.",
			Buckets:   prometheus.DefBuckets,
		}, []string{"result"}),
	}
}

// NewMetrics registers and returns a reusable set of gateway metrics.
func NewMetrics(registerer prometheus.Registerer) (*Metrics, error) {
	metrics := newGatewayMetrics()
	if registerer == nil {
		return metrics, nil
	}
	if err := metrics.register(registerer); err != nil {
		return nil, err
	}
	return metrics, nil
}

func (m *Metrics) register(registerer prometheus.Registerer) error {
	for _, collector := range []prometheus.Collector{
		m.active,
		m.pending,
		m.authFailures,
		m.authRateLimited,
		m.capacityRejected,
		m.targetUnreachable,
		m.timeouts,
		m.eventsDropped,
		m.duration,
	} {
		if err := registerer.Register(collector); err != nil {
			return err
		}
	}
	return nil
}

func (g *Gateway) serve() {
	defer g.wg.Done()
	var retryDelay time.Duration
	for {
		conn, err := g.listener.Accept()
		if err != nil {
			if errors.Is(err, net.ErrClosed) {
				return
			}
			g.config.Logger.Warn(context.Background(), "workspace SSH gateway accept failed", slog.Error(err))
			if retryDelay == 0 {
				retryDelay = 5 * time.Millisecond
			} else {
				retryDelay = min(2*retryDelay, time.Second)
			}
			timer := time.NewTimer(retryDelay)
			select {
			case <-g.ctx.Done():
				timer.Stop()
				return
			case <-timer.C:
			}
			continue
		}
		retryDelay = 0
		state, reason := g.admit(conn)
		if state == nil {
			g.metrics.capacityRejected.WithLabelValues(reason).Inc()
			_ = conn.Close()
			continue
		}
		g.wg.Add(1)
		go func() {
			defer g.wg.Done()
			defer g.release(state)
			g.handle(g.ctx, state)
		}()
	}
}

func (g *Gateway) admit(conn net.Conn) (*connectionState, string) {
	remoteIP := connectionIP(conn.RemoteAddr())
	g.mu.Lock()
	defer g.mu.Unlock()
	limits := g.config.Limits
	if len(g.connections) >= limits.MaxConnections {
		return nil, "connections"
	}
	if g.pending >= limits.MaxPendingConnections {
		return nil, "pending"
	}
	if g.pendingByIP[remoteIP] >= limits.MaxPendingConnectionsPerIP {
		return nil, "pending_ip"
	}
	state := &connectionState{external: conn, remoteIP: remoteIP, pending: true}
	g.connections[state] = struct{}{}
	g.pending++
	g.pendingByIP[remoteIP]++
	g.metrics.pending.Inc()
	return state, ""
}

func (g *Gateway) release(state *connectionState) {
	g.mu.Lock()
	defer g.mu.Unlock()
	if _, ok := g.connections[state]; !ok {
		return
	}
	delete(g.connections, state)
	if state.pending {
		g.pending--
		g.pendingByIP[state.remoteIP]--
		if g.pendingByIP[state.remoteIP] == 0 {
			delete(g.pendingByIP, state.remoteIP)
		}
		g.metrics.pending.Dec()
	}
	if state.authenticated {
		g.activeByUser[state.userID]--
		if g.activeByUser[state.userID] == 0 {
			delete(g.activeByUser, state.userID)
		}
		g.metrics.active.Dec()
	}
}

func (g *Gateway) allowAuthentication(remoteIP string) bool {
	g.mu.Lock()
	defer g.mu.Unlock()
	now := time.Now()
	entry := g.authLimiters[remoteIP]
	if entry == nil {
		if len(g.authLimiters) >= maximumAuthLimiterEntries {
			oldestIP := ""
			oldest := now
			for ip, candidate := range g.authLimiters {
				if !candidate.lastSeen.After(oldest) {
					oldestIP = ip
					oldest = candidate.lastSeen
				}
			}
			delete(g.authLimiters, oldestIP)
		}
		entry = &authLimiter{
			limiter: rate.NewLimiter(rate.Limit(float64(g.config.Limits.AuthAttemptsPerMinute)/60), g.config.Limits.AuthAttemptsBurst),
		}
		g.authLimiters[remoteIP] = entry
	}
	entry.lastSeen = now
	return entry.limiter.Allow()
}

func (g *Gateway) authenticate(state *connectionState, target Target) bool {
	g.mu.Lock()
	defer g.mu.Unlock()
	if state.shutdown || !state.pending || g.activeByUser[target.UserID] >= g.config.Limits.MaxConnectionsPerUser {
		return false
	}
	state.pending = false
	state.authenticated = true
	state.userID = target.UserID
	g.pending--
	g.pendingByIP[state.remoteIP]--
	if g.pendingByIP[state.remoteIP] == 0 {
		delete(g.pendingByIP, state.remoteIP)
	}
	g.activeByUser[target.UserID]++
	g.metrics.pending.Dec()
	g.metrics.active.Inc()
	return true
}

func (g *Gateway) rollbackAuthentication(state *connectionState) {
	g.mu.Lock()
	defer g.mu.Unlock()
	if !state.authenticated {
		return
	}
	g.activeByUser[state.userID]--
	if g.activeByUser[state.userID] == 0 {
		delete(g.activeByUser, state.userID)
	}
	state.authenticated = false
	state.userID = uuid.Nil
	state.pending = true
	g.pending++
	g.pendingByIP[state.remoteIP]++
	g.metrics.active.Dec()
	g.metrics.pending.Inc()
}

func (g *Gateway) trackAgent(state *connectionState, conn net.Conn) bool {
	g.mu.Lock()
	defer g.mu.Unlock()
	if state.shutdown {
		return false
	}
	state.agent = conn
	return true
}

func (g *Gateway) isShutdown(state *connectionState) bool {
	g.mu.Lock()
	defer g.mu.Unlock()
	return state.shutdown
}

func (g *Gateway) handle(ctx context.Context, state *connectionState) {
	raw := state.external
	defer raw.Close()
	connectionID := uuid.New()
	connectedAt := time.Now()
	var target Target
	authenticationRejected := false
	serverConfig := &ssh.ServerConfig{
		MaxAuthTries: 3,
		PublicKeyCallback: func(metadata ssh.ConnMetadata, key ssh.PublicKey) (*ssh.Permissions, error) {
			if !g.allowAuthentication(state.remoteIP) {
				authenticationRejected = true
				g.metrics.authRateLimited.Inc()
				return nil, xerrors.New("public key authentication failed")
			}
			authCtx, cancel := context.WithTimeout(ctx, g.config.Timeouts.Authentication)
			resolved, err := g.config.Authenticate(authCtx, metadata, key)
			cancel()
			if err != nil {
				authenticationRejected = true
				if errors.Is(err, context.DeadlineExceeded) || errors.Is(authCtx.Err(), context.DeadlineExceeded) {
					g.metrics.timeouts.WithLabelValues("authentication").Inc()
				}
				var unavailable *TargetUnavailableError
				if errors.As(err, &unavailable) {
					g.metrics.targetUnreachable.WithLabelValues(metricReason(unavailable.Reason)).Inc()
				} else {
					g.metrics.authFailures.WithLabelValues("rejected").Inc()
				}
				return nil, err
			}
			target = resolved
			return &ssh.Permissions{Extensions: map[string]string{
				"workspace_ssh_key_id": resolved.WorkspaceSSHKeyID.String(),
			}}, nil
		},
		VerifiedPublicKeyCallback: func(_ ssh.ConnMetadata, _ ssh.PublicKey, permissions *ssh.Permissions, _ string) (*ssh.Permissions, error) {
			if permissions == nil || permissions.Extensions["workspace_ssh_key_id"] != target.WorkspaceSSHKeyID.String() {
				authenticationRejected = true
				return nil, xerrors.New("public key authentication failed")
			}
			if !g.authenticate(state, target) {
				authenticationRejected = true
				g.metrics.capacityRejected.WithLabelValues("user").Inc()
				return nil, xerrors.New("public key authentication failed")
			}
			if g.config.Verified != nil {
				verifyCtx, cancel := context.WithTimeout(ctx, g.config.Timeouts.Authentication)
				err := g.config.Verified(verifyCtx, target)
				cancel()
				if err != nil {
					g.rollbackAuthentication(state)
					authenticationRejected = true
					if errors.Is(err, context.DeadlineExceeded) || errors.Is(verifyCtx.Err(), context.DeadlineExceeded) {
						g.metrics.timeouts.WithLabelValues("authentication").Inc()
					}
					return nil, xerrors.New("public key authentication failed")
				}
			}
			return permissions, nil
		},
	}
	serverConfig.AddHostKey(g.config.HostSigner)
	_ = raw.SetDeadline(time.Now().Add(g.config.Timeouts.ExternalHandshake))
	external, externalChannels, externalRequests, err := ssh.NewServerConn(raw, serverConfig)
	if err != nil {
		if timeoutError(err) {
			g.metrics.timeouts.WithLabelValues("external_handshake").Inc()
		}
		if !authenticationRejected {
			g.metrics.authFailures.WithLabelValues("handshake").Inc()
		}
		return
	}
	_ = raw.SetDeadline(time.Time{})
	defer external.Close()
	result := "closed"
	defer func() {
		disconnectedAt := time.Now()
		g.metrics.duration.WithLabelValues(result).Observe(disconnectedAt.Sub(connectedAt).Seconds())
		g.config.Logger.Info(context.Background(), "workspace SSH gateway connection closed",
			slog.F("connection_id", connectionID),
			slog.F("user", target.Username),
			slog.F("organization", target.OrganizationName),
			slog.F("workspace", target.WorkspaceName),
			slog.F("agent", target.AgentName),
			slog.F("result", result),
		)
		g.record(ConnectionEvent{
			ConnectionID:   connectionID,
			Target:         target,
			RemoteAddr:     raw.RemoteAddr(),
			ConnectedAt:    connectedAt,
			DisconnectedAt: disconnectedAt,
			Result:         result,
		})
	}()

	dialCtx, cancelDial := context.WithTimeout(ctx, g.config.Timeouts.AgentDial)
	agentRaw, release, err := g.config.DialAgent(dialCtx, target)
	cancelDial()
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(dialCtx.Err(), context.DeadlineExceeded) {
			g.metrics.timeouts.WithLabelValues("agent_dial").Inc()
		}
		if g.isShutdown(state) {
			result = "shutdown"
			return
		}
		result = "target_unreachable"
		g.metrics.targetUnreachable.WithLabelValues("dial").Inc()
		return
	}
	defer release()
	defer agentRaw.Close()
	if !g.trackAgent(state, agentRaw) {
		result = "shutdown"
		return
	}

	_ = agentRaw.SetDeadline(time.Now().Add(g.config.Timeouts.AgentHandshake))
	agentConn, agentChannels, agentRequests, err := ssh.NewClientConn(agentRaw, "workspace-agent:22", &ssh.ClientConfig{
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // #nosec G106 -- tailnet AgentConn authenticates the target.
	})
	if err != nil {
		if timeoutError(err) {
			g.metrics.timeouts.WithLabelValues("agent_handshake").Inc()
		}
		if g.isShutdown(state) {
			result = "shutdown"
			return
		}
		result = "target_unreachable"
		g.metrics.targetUnreachable.WithLabelValues("ssh_handshake").Inc()
		return
	}
	_ = agentRaw.SetDeadline(time.Time{})
	defer agentConn.Close()

	g.config.Logger.Info(context.Background(), "workspace SSH gateway connection established",
		slog.F("connection_id", connectionID),
		slog.F("user", target.Username),
		slog.F("organization", target.OrganizationName),
		slog.F("workspace", target.WorkspaceName),
		slog.F("agent", target.AgentName),
		slog.F("result", "connected"),
	)
	g.record(ConnectionEvent{
		ConnectionID: connectionID,
		Target:       target,
		RemoteAddr:   raw.RemoteAddr(),
		ConnectedAt:  connectedAt,
		Result:       "connected",
	})

	proxyRequests(externalRequests, agentConn, nil)
	proxyRequests(agentRequests, external, nil)
	quota := newChannelQuota(g.config.Limits.MaxChannelsPerConnection)
	rejected := func() { g.metrics.capacityRejected.WithLabelValues("channel").Inc() }
	externalChannelsDone := proxyChannels(externalChannels, agentConn, &g.config.Codex, quota, rejected)
	agentChannelsDone := proxyChannels(agentChannels, external, nil, quota, rejected)

	err = waitForConnection(external, agentConn)
	<-externalChannelsDone
	<-agentChannelsDone
	switch {
	case g.isShutdown(state):
		result = "shutdown"
	case !isCompletedConnection(err):
		result = "protocol_error"
	default:
		result = "completed"
	}
}

func timeoutError(err error) bool {
	var netError net.Error
	return errors.As(err, &netError) && netError.Timeout()
}

func connectionIP(addr net.Addr) string {
	if addr == nil {
		return "unknown"
	}
	host, _, err := net.SplitHostPort(addr.String())
	if err != nil {
		return "unknown"
	}
	parsed, err := netip.ParseAddr(host)
	if err != nil {
		return "unknown"
	}
	return parsed.Unmap().String()
}

func (g *Gateway) record(event ConnectionEvent) {
	if g.config.Record == nil {
		return
	}
	eventType := "connected"
	if !event.DisconnectedAt.IsZero() {
		eventType = "disconnected"
	}
	select {
	case g.records <- event:
	default:
		g.metrics.eventsDropped.WithLabelValues(eventType).Inc()
	}
}

func (g *Gateway) recordEvents() {
	for event := range g.records {
		ctx, cancel := context.WithTimeout(context.Background(), g.config.Timeouts.Record)
		g.config.Record(ctx, event)
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			g.metrics.timeouts.WithLabelValues("event_record").Inc()
		}
		cancel()
	}
}

func isCompletedConnection(err error) bool {
	if err == nil || errors.Is(err, io.EOF) || errors.Is(err, net.ErrClosed) {
		return true
	}
	// x/crypto/ssh does not export disconnectMsg. OpenSSH sends reason 11,
	// SSH_DISCONNECT_BY_APPLICATION, when a client exits normally.
	return strings.HasPrefix(err.Error(), "ssh: disconnect, reason 11: ")
}

func waitForConnection(first, second ssh.Conn) error {
	result := make(chan error, 2)
	go func() { result <- first.Wait() }()
	go func() { result <- second.Wait() }()
	err := <-result
	_ = first.Close()
	_ = second.Close()
	<-result
	return err
}

func metricReason(reason string) string {
	switch reason {
	case "agent_disconnected", "agent_not_ready", "agent_not_linux", "workspace_stopped", "not_found":
		return reason
	default:
		return "other"
	}
}

// Close stops accepting connections and waits for active connections until
// ctx expires. On timeout, remaining connections are closed.
func (g *Gateway) Close(ctx context.Context) error {
	g.closeOnce.Do(func() {
		_ = g.listener.Close()
		go func() {
			g.wg.Wait()
			close(g.records)
			g.recordWG.Wait()
			g.cancel()
			close(g.closed)
		}()
	})
	if err := ctx.Err(); err != nil {
		g.forceClose()
		<-g.closed
		return err
	}
	select {
	case <-g.closed:
		return nil
	case <-ctx.Done():
		err := ctx.Err()
		g.forceClose()
		<-g.closed
		return err
	}
}

func (g *Gateway) forceClose() {
	g.forceOnce.Do(func() {
		g.cancel()
		g.mu.Lock()
		connections := make([]net.Conn, 0, 2*len(g.connections))
		for state := range g.connections {
			state.shutdown = true
			connections = append(connections, state.external)
			if state.agent != nil {
				connections = append(connections, state.agent)
			}
		}
		g.mu.Unlock()
		for _, conn := range connections {
			_ = conn.Close()
		}
	})
}
