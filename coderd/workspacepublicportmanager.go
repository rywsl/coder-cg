package coderd

import (
	"context"
	"crypto/subtle"
	"crypto/tls"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/prometheus/client_golang/prometheus"
	"golang.org/x/crypto/ssh"
	"golang.org/x/xerrors"

	"cdr.dev/slog/v3"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/httpapi"
	"github.com/coder/coder/v2/coderd/workspaceapps"
	"github.com/coder/coder/v2/codersdk"
)

// workspacePublicPortManager owns loopback HTTP listeners behind TLS ingress.
// Its handlers never dispatch to the Coder management router.
type workspacePublicPortManager struct {
	provider       workspaceapps.AgentProvider
	logger         slog.Logger
	validate       func(context.Context, database.WorkspacePublicPortMapping) error
	externalHost   string
	externalScheme string
	healthToken    string
	// Serialize database mutations with reconciliation to avoid stale snapshots.
	operations  sync.Mutex
	dial        func(context.Context, database.WorkspacePublicPortMapping) (net.Conn, error)
	listen      func(string, string) (net.Listener, error)
	mu          sync.Mutex
	servers     map[int32]*workspacePublicPortServer
	closed      bool
	capacity    chan struct{}
	cancel      context.CancelFunc
	done        chan struct{}
	rejections  *prometheus.CounterVec
	connections prometheus.Gauge
}

type workspacePublicPortServer struct {
	mapping     database.WorkspacePublicPortMapping
	server      *http.Server
	listener    net.Listener
	cancel      context.CancelFunc
	mu          sync.Mutex
	connections map[net.Conn]struct{}
	closed      bool
	done        chan struct{}
}

func newWorkspacePublicPortManager(provider workspaceapps.AgentProvider, logger slog.Logger, validate func(context.Context, database.WorkspacePublicPortMapping) error) *workspacePublicPortManager {
	m := &workspacePublicPortManager{
		provider: provider, logger: logger, validate: validate,
		servers: make(map[int32]*workspacePublicPortServer), capacity: make(chan struct{}, 1024), listen: net.Listen,
		externalScheme: "https", healthToken: uuid.NewString(),
	}
	m.dial = m.dialAgent
	m.rejections = prometheus.NewCounterVec(prometheus.CounterOpts{Namespace: "coderd", Subsystem: "workspace_public_ports", Name: "rejections_total", Help: "Number of public workspace requests rejected by capacity, authorization, or upstream availability."}, []string{"reason"})
	m.connections = prometheus.NewGauge(prometheus.GaugeOpts{Namespace: "coderd", Subsystem: "workspace_public_ports", Name: "connections", Help: "Number of active connections to public workspace port listeners."})
	return m
}

func (m *workspacePublicPortManager) registerMetrics(registry *prometheus.Registry) {
	registry.MustRegister(m.rejections, m.connections)
}

func (m *workspacePublicPortManager) Add(_ context.Context, row database.WorkspacePublicPortMapping) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.closed {
		return context.Canceled
	}
	if row.PublicPort < publicPortFirst || row.PublicPort > publicPortLast {
		return xerrors.New("invalid public port")
	}
	if existing := m.servers[row.PublicPort]; existing != nil {
		if existing.mapping.ID == row.ID {
			return nil
		}
		existing.close()
		delete(m.servers, row.PublicPort)
	}
	listener, err := m.listen("tcp", net.JoinHostPort("127.0.0.1", strconv.Itoa(int(row.PublicPort))))
	if err != nil {
		return err
	}
	serverCtx, cancel := context.WithCancel(context.Background())
	s := &workspacePublicPortServer{
		mapping: row, listener: listener, cancel: cancel,
		connections: make(map[net.Conn]struct{}), done: make(chan struct{}),
	}
	s.server = &http.Server{
		Handler: m.handler(row), ReadHeaderTimeout: 10 * time.Second, IdleTimeout: time.Minute,
		MaxHeaderBytes: 64 << 10, BaseContext: func(net.Listener) context.Context { return serverCtx },
		ErrorLog: log.New(io.Discard, "", 0),
	}
	m.servers[row.PublicPort] = s
	go func() {
		defer close(s.done)
		_ = s.server.Serve(&workspacePublicListener{Listener: listener, server: s, capacity: m.capacity, rejections: m.rejections, connections: m.connections})
	}()
	return nil
}

func (s *workspacePublicPortServer) close() {
	s.cancel()
	_ = s.listener.Close()
	_ = s.server.Close()
	s.mu.Lock()
	s.closed = true
	connections := make([]net.Conn, 0, len(s.connections))
	for connection := range s.connections {
		connections = append(connections, connection)
	}
	s.mu.Unlock()
	// HTTP Server.Close does not own hijacked WebSocket connections.
	for _, connection := range connections {
		_ = connection.Close()
	}
	<-s.done
}

func (m *workspacePublicPortManager) Remove(port int32) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if s := m.servers[port]; s != nil {
		delete(m.servers, port)
		s.close()
	}
}

func (m *workspacePublicPortManager) Running(row database.WorkspacePublicPortMapping) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	s := m.servers[row.PublicPort]
	return s != nil && s.mapping.ID == row.ID
}

func (m *workspacePublicPortManager) Start(ctx context.Context, load func(context.Context) ([]database.WorkspacePublicPortMapping, error)) {
	ctx, m.cancel = context.WithCancel(ctx)
	m.done = make(chan struct{})
	go func() {
		defer close(m.done)
		ticker := time.NewTicker(2 * time.Second)
		defer ticker.Stop()
		for {
			m.reconcile(ctx, load)
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
}

func (m *workspacePublicPortManager) reconcile(ctx context.Context, load func(context.Context) ([]database.WorkspacePublicPortMapping, error)) {
	m.operations.Lock()
	defer m.operations.Unlock()
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	rows, err := load(ctx)
	active := make(map[int32]bool)
	if err == nil {
		for _, row := range rows {
			if m.validate != nil && m.validate(ctx, row) != nil {
				continue
			}
			active[row.PublicPort] = true
			if err := m.Add(ctx, row); err != nil {
				m.logger.Debug(ctx, "public port listener unavailable", slog.F("mapping_id", row.ID), slog.F("public_port", row.PublicPort))
			}
		}
	}
	// Database failure is fail closed, including upgraded connections.
	m.mu.Lock()
	defer m.mu.Unlock()
	for port, s := range m.servers {
		if !active[port] {
			delete(m.servers, port)
			s.close()
		}
	}
}

func (m *workspacePublicPortManager) Close(ctx context.Context) error {
	if m.cancel != nil {
		m.cancel()
	}
	m.mu.Lock()
	m.closed = true
	for port, s := range m.servers {
		delete(m.servers, port)
		s.close()
	}
	m.mu.Unlock()
	if m.done != nil {
		select {
		case <-m.done:
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return nil
}

func (m *workspacePublicPortManager) transport(row database.WorkspacePublicPortMapping) *http.Transport {
	return &http.Transport{
		Proxy: nil, DisableKeepAlives: true, MaxConnsPerHost: 64,
		TLSClientConfig:     &tls.Config{MinVersion: tls.VersionTLS12},
		TLSHandshakeTimeout: 10 * time.Second, ResponseHeaderTimeout: 30 * time.Second,
		DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
			ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
			defer cancel()
			return m.dial(ctx, row)
		},
	}
}

func (m *workspacePublicPortManager) probe(ctx context.Context, row database.WorkspacePublicPortMapping) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	transport := m.transport(row)
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	request, err := http.NewRequestWithContext(ctx, http.MethodHead, row.Protocol+"://"+net.JoinHostPort("127.0.0.1", strconv.Itoa(int(row.RemotePort))), nil)
	if err != nil {
		return err
	}
	response, err := client.Do(request)
	if err != nil {
		return err
	}
	return response.Body.Close()
}

func (m *workspacePublicPortManager) probeIngress(ctx context.Context, row database.WorkspacePublicPortMapping) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	transport := &http.Transport{Proxy: nil, DisableKeepAlives: true, TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12}}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	target := m.externalScheme + "://" + net.JoinHostPort(m.externalHost, strconv.Itoa(int(row.PublicPort))) + "/"
	request, err := http.NewRequestWithContext(ctx, http.MethodHead, target, nil)
	if err != nil {
		return err
	}
	request.Header.Set("Coder-Public-Port-Probe", m.healthToken)
	response, err := client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusNoContent || response.Header.Get("Coder-Public-Port-Probe") != m.healthToken {
		return xerrors.New("public ingress unavailable")
	}
	return nil
}

func (m *workspacePublicPortManager) handler(row database.WorkspacePublicPortMapping) http.Handler {
	target := net.JoinHostPort("127.0.0.1", strconv.Itoa(int(row.RemotePort)))
	proxy := &httputil.ReverseProxy{
		Transport: m.transport(row), ErrorLog: log.New(io.Discard, "", 0),
		Rewrite: func(p *httputil.ProxyRequest) {
			p.Out.URL.Scheme, p.Out.URL.Host, p.Out.Host = row.Protocol, target, target
			p.Out.Header.Del("Forwarded")
			for name := range p.Out.Header {
				if strings.HasPrefix(strings.ToLower(name), "x-forwarded-") {
					p.Out.Header.Del(name)
				}
			}
			p.Out.Header.Del(codersdk.SessionTokenHeader)
			p.Out.Header.Set("Cookie", publicPortCookies(p.Out.Header.Get("Cookie")))
			p.Out.Header.Set("X-Forwarded-Proto", "https")
		},
		ModifyResponse: func(response *http.Response) error {
			// Absolute loopback redirects must remain on the public origin.
			if location, err := url.Parse(response.Header.Get("Location")); err == nil && location.IsAbs() && m.externalHost != "" {
				host := location.Hostname()
				if (host == "localhost" || host == "127.0.0.1" || host == "::1") && location.Port() == strconv.Itoa(int(row.RemotePort)) {
					location.Scheme = "https"
					location.Host = net.JoinHostPort(m.externalHost, strconv.Itoa(int(row.PublicPort)))
					response.Header.Set("Location", location.String())
				}
			}
			cookies := response.Header.Values("Set-Cookie")
			response.Header.Del("Set-Cookie")
			for _, cookie := range cookies {
				pair, _, _ := strings.Cut(cookie, ";")
				if publicPortCookies(pair) != "" {
					response.Header.Add("Set-Cookie", cookie)
				}
			}
			return nil
		},
		ErrorHandler: func(w http.ResponseWriter, _ *http.Request, _ error) {
			m.rejections.WithLabelValues("upstream").Inc()
			http.Error(w, "工作区服务当前不可用，请检查服务监听地址和 HTTPS 证书。", http.StatusBadGateway)
		},
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodHead && subtle.ConstantTimeCompare([]byte(r.Header.Get("Coder-Public-Port-Probe")), []byte(m.healthToken)) == 1 {
			w.Header().Set("Cache-Control", "no-store")
			w.Header().Set("Coder-Public-Port-Probe", m.healthToken)
			w.WriteHeader(http.StatusNoContent)
			return
		}
		r.Header.Del("Coder-Public-Port-Probe")
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		if m.validate != nil && m.validate(ctx, row) != nil {
			m.rejections.WithLabelValues("authorization").Inc()
			http.Error(w, "工作区已停止、Agent 未就绪或公开映射已失效。", http.StatusServiceUnavailable)
			return
		}
		proxy.ServeHTTP(w, r)
	})
}

func publicPortCookies(header string) string {
	header = httpapi.StripCoderCookies(header)
	parts := strings.Split(header, ";")
	filtered := parts[:0]
	for _, part := range parts {
		name, _, _ := strings.Cut(strings.TrimSpace(part), "=")
		if name != "csrf_token" {
			filtered = append(filtered, part)
		}
	}
	return strings.TrimSpace(strings.Join(filtered, ";"))
}

func (m *workspacePublicPortManager) dialAgent(ctx context.Context, row database.WorkspacePublicPortMapping) (net.Conn, error) {
	agent, release, err := m.provider.AgentConn(ctx, row.WorkspaceAgentID)
	if err != nil {
		return nil, err
	}
	raw, err := agent.SSH(ctx)
	if err != nil {
		release()
		return nil, err
	}
	stop := context.AfterFunc(ctx, func() { _ = raw.Close() })
	defer stop()
	if deadline, ok := ctx.Deadline(); ok {
		_ = raw.SetDeadline(deadline)
	}
	// Tailnet has already authenticated the agent identity.
	connection, channels, requests, err := ssh.NewClientConn(raw, "workspace", &ssh.ClientConfig{HostKeyCallback: ssh.InsecureIgnoreHostKey()}) //nolint:gosec
	if err != nil {
		_ = raw.Close()
		release()
		return nil, err
	}
	client := ssh.NewClient(connection, channels, requests)
	var downstream net.Conn
	for _, host := range []string{"127.0.0.1", "::1"} {
		downstream, err = client.DialContext(ctx, "tcp", net.JoinHostPort(host, strconv.Itoa(int(row.RemotePort))))
		if err == nil {
			break
		}
	}
	if err != nil {
		_ = client.Close()
		release()
		return nil, err
	}
	if !stop() || ctx.Err() != nil {
		_ = downstream.Close()
		_ = client.Close()
		release()
		return nil, context.Canceled
	}
	_ = raw.SetDeadline(time.Time{})
	return &workspacePublicConn{Conn: downstream, release: func() { _ = client.Close(); release() }}, nil
}

type workspacePublicConn struct {
	net.Conn
	release func()
	once    sync.Once
}

func (c *workspacePublicConn) Close() error {
	err := c.Conn.Close()
	c.once.Do(c.release)
	return err
}

type workspacePublicListener struct {
	net.Listener
	server      *workspacePublicPortServer
	capacity    chan struct{}
	rejections  *prometheus.CounterVec
	connections prometheus.Gauge
}

func (l *workspacePublicListener) Accept() (net.Conn, error) {
	for {
		conn, err := l.Listener.Accept()
		if err != nil {
			return nil, err
		}
		select {
		case l.capacity <- struct{}{}:
		default:
			l.rejections.WithLabelValues("total_capacity").Inc()
			_ = conn.Close()
			continue
		}
		l.server.mu.Lock()
		if l.server.closed || len(l.server.connections) >= 64 {
			l.rejections.WithLabelValues("mapping_capacity").Inc()
			l.server.mu.Unlock()
			<-l.capacity
			_ = conn.Close()
			continue
		}
		wrapped := &workspacePublicConn{Conn: conn}
		wrapped.release = func() {
			l.server.mu.Lock()
			delete(l.server.connections, wrapped)
			l.server.mu.Unlock()
			<-l.capacity
			l.connections.Dec()
		}
		l.server.connections[wrapped] = struct{}{}
		l.connections.Inc()
		l.server.mu.Unlock()
		return wrapped, nil
	}
}
