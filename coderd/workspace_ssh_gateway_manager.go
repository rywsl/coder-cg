package coderd

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/json"
	"encoding/pem"
	"errors"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"golang.org/x/crypto/ssh"
	"golang.org/x/xerrors"

	"cdr.dev/slog/v3"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbauthz"
	"github.com/coder/coder/v2/coderd/workspacessh"
	"github.com/coder/coder/v2/codersdk"
)

const (
	workspaceSSHGatewayConfigEvent = "workspace_ssh_gateway_config"
	workspaceSSHGatewayConfigKey   = "workspace_ssh_gateway_config"
	workspaceSSHGatewayDrainTime   = 10 * time.Second
	workspaceSSHGatewaySyncPeriod  = 30 * time.Second
)

var (
	errWorkspaceSSHGatewayRunning     = xerrors.New("workspace SSH gateway must be stopped before updating configuration")
	errWorkspaceSSHGatewayCannotStart = xerrors.New("workspace SSH gateway cannot start")
)

type workspaceSSHGatewayStoredConfig struct {
	Config         codersdk.WorkspaceSSHGatewayRuntimeConfig `json:"config"`
	DesiredEnabled bool                                      `json:"desired_enabled"`
}

type workspaceSSHGatewayManager struct {
	api     *API
	metrics *workspacessh.Metrics

	operationMu       sync.Mutex
	mu                sync.Mutex
	gateway           *workspacessh.Gateway
	state             codersdk.WorkspaceSSHGatewayState
	errorCode         string
	closed            bool
	activeConfig      codersdk.WorkspaceSSHGatewayRuntimeConfig
	activeAPIKeyHash  [sha256.Size]byte
	activeHostKeyHash [sha256.Size]byte

	info atomic.Pointer[codersdk.WorkspaceSSHGatewayInfo]

	updates     chan struct{}
	cancel      context.CancelFunc
	unsubscribe func()
	wg          sync.WaitGroup
	closeOnce   sync.Once
	closeErr    error
}

func newWorkspaceSSHGatewayManager(api *API) (*workspaceSSHGatewayManager, error) {
	metrics, err := workspacessh.NewMetrics(api.PrometheusRegistry)
	if err != nil {
		return nil, xerrors.Errorf("register workspace SSH gateway metrics: %w", err)
	}
	m := &workspaceSSHGatewayManager{
		api:     api,
		metrics: metrics,
		state:   codersdk.WorkspaceSSHGatewayStateStopped,
		updates: make(chan struct{}, 1),
	}
	m.info.Store(m.disabledInfo())
	return m, nil
}

func (m *workspaceSSHGatewayManager) initialize(ctx context.Context) {
	if err := m.bootstrapDeploymentConfig(ctx); err != nil {
		m.setError("persistence_failed")
		m.api.Logger.Error(ctx, "initialize workspace SSH gateway configuration", slog.F("error_code", "persistence_failed"))
	}
	if m.api.ReplicaSyncPubsub != nil {
		unsubscribe, err := m.api.ReplicaSyncPubsub.Subscribe(workspaceSSHGatewayConfigEvent, func(context.Context, []byte) {
			m.notify()
		})
		if err != nil {
			m.api.Logger.Warn(ctx, "subscribe to workspace SSH gateway updates", slog.Error(err))
		} else {
			m.unsubscribe = unsubscribe
		}
	}

	workerCtx, cancel := context.WithCancel(m.api.ctx)
	m.cancel = cancel
	m.wg.Go(func() { m.run(workerCtx) })
	m.notify()
}

func (m *workspaceSSHGatewayManager) run(ctx context.Context) {
	ticker := time.NewTicker(workspaceSSHGatewaySyncPeriod)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-m.updates:
		case <-ticker.C:
		}
		reconcileCtx, cancel := context.WithTimeout(ctx, workspaceSSHGatewayDrainTime)
		if err := m.reconcile(reconcileCtx); err != nil && !xerrors.Is(err, context.Canceled) {
			m.mu.Lock()
			code := m.errorCode
			m.mu.Unlock()
			m.api.Logger.Warn(ctx, "reconcile workspace SSH gateway", slog.F("error_code", code))
		}
		cancel()
	}
}

func (m *workspaceSSHGatewayManager) notify() {
	select {
	case m.updates <- struct{}{}:
	default:
	}
}

func (m *workspaceSSHGatewayManager) publish() {
	if m.api.ReplicaSyncPubsub == nil {
		return
	}
	if err := m.api.ReplicaSyncPubsub.Publish(workspaceSSHGatewayConfigEvent, nil); err != nil {
		m.api.Logger.Warn(context.Background(), "publish workspace SSH gateway update", slog.Error(err))
	}
}

func (m *workspaceSSHGatewayManager) reconcile(ctx context.Context) error {
	m.operationMu.Lock()
	defer m.operationMu.Unlock()

	row, stored, err := m.load(ctx)
	if err != nil {
		m.setError("stored_config_invalid")
		return err
	}
	if !row.ConfigExists || !stored.DesiredEnabled {
		return m.stopLocal(ctx)
	}
	return m.startLocal(ctx, row, stored)
}

func (m *workspaceSSHGatewayManager) update(ctx context.Context, req codersdk.UpdateWorkspaceSSHGatewayRequest) error {
	if err := req.Config.Validate(); err != nil {
		return err
	}
	if req.ClearCodexAPIKey && req.CodexAPIKey != "" {
		return xerrors.New("codex_api_key and clear_codex_api_key cannot both be set")
	}

	m.operationMu.Lock()
	defer m.operationMu.Unlock()

	m.mu.Lock()
	if m.gateway != nil || m.state == codersdk.WorkspaceSSHGatewayStateStarting || m.state == codersdk.WorkspaceSSHGatewayStateStopping {
		m.mu.Unlock()
		return errWorkspaceSSHGatewayRunning
	}
	if m.closed {
		m.mu.Unlock()
		return xerrors.New("workspace SSH gateway manager is closed")
	}
	m.mu.Unlock()

	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic // The HTTP handler has already authorized the deployment update.
	err := m.api.Database.InTx(func(tx database.Store) error {
		if err := tx.AcquireLock(systemCtx, database.GenLockID(workspaceSSHGatewayConfigKey)); err != nil {
			return xerrors.Errorf("lock workspace SSH gateway configuration: %w", err)
		}
		row, err := tx.GetWorkspaceSSHGatewayConfig(systemCtx)
		if err != nil {
			return xerrors.Errorf("read workspace SSH gateway configuration: %w", err)
		}
		if row.ConfigExists {
			stored, err := parseWorkspaceSSHGatewayStoredConfig(row.Config)
			if err != nil {
				return err
			}
			if stored.DesiredEnabled {
				return errWorkspaceSSHGatewayRunning
			}
		}
		encoded, err := json.Marshal(workspaceSSHGatewayStoredConfig{Config: req.Config})
		if err != nil {
			return xerrors.Errorf("encode workspace SSH gateway configuration: %w", err)
		}
		if err := tx.UpsertWorkspaceSSHGatewayConfig(systemCtx, string(encoded)); err != nil {
			return xerrors.Errorf("save workspace SSH gateway configuration: %w", err)
		}
		switch {
		case req.ClearCodexAPIKey:
			if err := tx.DeleteWorkspaceSSHGatewayCodexAPIKey(systemCtx); err != nil {
				return xerrors.Errorf("clear workspace SSH gateway Codex API key: %w", err)
			}
		case req.CodexAPIKey != "":
			if err := tx.UpsertWorkspaceSSHGatewayCodexAPIKey(systemCtx, req.CodexAPIKey); err != nil {
				return xerrors.Errorf("save workspace SSH gateway Codex API key: %w", err)
			}
		}
		if !row.HostPrivateKeyExists {
			privateKey, err := generateWorkspaceSSHHostKey()
			if err != nil {
				return err
			}
			if err := tx.UpsertWorkspaceSSHGatewayHostPrivateKey(systemCtx, privateKey); err != nil {
				return xerrors.Errorf("save workspace SSH gateway host key: %w", err)
			}
		}
		return nil
	}, nil)
	if err != nil {
		return err
	}
	m.mu.Lock()
	m.state = codersdk.WorkspaceSSHGatewayStateStopped
	m.errorCode = ""
	m.info.Store(m.disabledInfo())
	m.mu.Unlock()
	m.publish()
	return nil
}

func (m *workspaceSSHGatewayManager) start(ctx context.Context) error {
	m.operationMu.Lock()
	defer m.operationMu.Unlock()

	var rollbackOnError bool
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic // The HTTP handler has already authorized the deployment update.
	err := m.api.Database.InTx(func(tx database.Store) error {
		if err := tx.AcquireLock(systemCtx, database.GenLockID(workspaceSSHGatewayConfigKey)); err != nil {
			return xerrors.Errorf("lock workspace SSH gateway configuration: %w", err)
		}
		row, stored, err := loadWorkspaceSSHGatewayConfig(systemCtx, tx)
		if err != nil {
			return err
		}
		if !row.ConfigExists {
			return xerrors.Errorf("%w: configuration has not been saved", errWorkspaceSSHGatewayCannotStart)
		}

		m.mu.Lock()
		wasRunning := m.gateway != nil
		m.mu.Unlock()
		if err := m.startLocal(ctx, row, stored); err != nil {
			return err
		}
		rollbackOnError = !wasRunning || !stored.DesiredEnabled
		if stored.DesiredEnabled {
			return nil
		}
		stored.DesiredEnabled = true
		return upsertWorkspaceSSHGatewayStoredConfig(systemCtx, tx, stored)
	}, nil)
	if err != nil && rollbackOnError {
		rollbackCtx, cancel := context.WithTimeout(context.Background(), workspaceSSHGatewayDrainTime)
		_ = m.stopLocal(rollbackCtx)
		cancel()
		m.setError("persistence_failed")
	}
	if err != nil {
		return err
	}
	m.publish()
	return nil
}

func (m *workspaceSSHGatewayManager) startLocal(ctx context.Context, row database.GetWorkspaceSSHGatewayConfigRow, stored workspaceSSHGatewayStoredConfig) error {
	apiKeyHash := sha256.Sum256([]byte(row.CodexApiKey))
	hostKeyHash := sha256.Sum256([]byte(row.HostPrivateKey))
	m.mu.Lock()
	if m.closed {
		m.mu.Unlock()
		return xerrors.New("workspace SSH gateway manager is closed")
	}
	unchanged := m.activeConfig == stored.Config && m.activeAPIKeyHash == apiKeyHash && m.activeHostKeyHash == hostKeyHash
	if m.gateway != nil && !unchanged {
		m.mu.Unlock()
		if err := m.stopLocal(ctx); err != nil {
			return err
		}
		m.mu.Lock()
	}
	defer m.mu.Unlock()
	if m.gateway != nil {
		return nil
	}
	m.state = codersdk.WorkspaceSSHGatewayStateStarting
	m.errorCode = ""
	if m.api.AccessURL == nil || m.api.AccessURL.Scheme != "https" {
		return m.cannotStart("https_required", xerrors.New("workspace SSH gateway requires an HTTPS access URL"))
	}
	if err := stored.Config.Validate(); err != nil {
		return m.cannotStart("configuration_invalid", err)
	}
	if !row.CodexApiKeyExists || row.CodexApiKey == "" {
		return m.cannotStart("api_key_missing", xerrors.New("workspace SSH gateway Codex API key is required"))
	}
	if !row.HostPrivateKeyExists {
		return m.cannotStart("host_key_missing", xerrors.New("workspace SSH gateway host key is missing"))
	}
	signer, err := workspacessh.ParseHostSigner([]byte(row.HostPrivateKey))
	if err != nil {
		return m.cannotStart("host_key_invalid", err)
	}
	gateway, err := workspacessh.New(workspacessh.Config{
		ListenAddress: stored.Config.ListenAddress,
		HostSigner:    signer,
		Logger:        m.api.Logger.Named("workspace-ssh-gateway"),
		Metrics:       m.metrics,
		Codex: workspacessh.CodexConfig{
			Model:     stored.Config.CodexModel,
			BaseURL:   stored.Config.CodexBaseURL,
			APIKey:    row.CodexApiKey,
			APIKeyEnv: "CODER_CODEX_API_KEY",
		},
		Limits: workspacessh.Limits{
			MaxConnections:             int(stored.Config.MaxConnections),
			MaxPendingConnections:      int(stored.Config.MaxPendingConnections),
			MaxPendingConnectionsPerIP: int(stored.Config.MaxPendingConnectionsPerIP),
			MaxConnectionsPerUser:      int(stored.Config.MaxConnectionsPerUser),
			MaxChannelsPerConnection:   int(stored.Config.MaxChannelsPerConnection),
			AuthAttemptsPerMinute:      int(stored.Config.AuthAttemptsPerMinute),
			AuthAttemptsBurst:          int(stored.Config.AuthAttemptsBurst),
		},
		Authenticate: m.api.authenticateWorkspaceSSH,
		Verified:     m.api.verifiedWorkspaceSSHKey,
		DialAgent:    m.api.dialWorkspaceSSHAgent,
		Record:       m.api.recordWorkspaceSSHConnection,
	})
	if err != nil {
		return m.cannotStart("listen_failed", err)
	}
	m.gateway = gateway
	m.activeConfig = stored.Config
	m.activeAPIKeyHash = apiKeyHash
	m.activeHostKeyHash = hostKeyHash
	m.state = codersdk.WorkspaceSSHGatewayStateRunning
	m.errorCode = ""
	m.info.Store(m.enabledInfo(stored.Config, signer))
	m.api.Logger.Info(ctx, "workspace SSH gateway listening",
		slog.F("listen_address", gateway.Addr().String()),
		slog.F("advertise_host", stored.Config.AdvertiseHost),
		slog.F("advertise_port", stored.Config.AdvertisePort),
	)
	return nil
}

// cannotStart records an administrator-actionable startup failure. The caller
// must hold m.mu.
func (m *workspaceSSHGatewayManager) cannotStart(code string, err error) error {
	m.state = codersdk.WorkspaceSSHGatewayStateError
	m.errorCode = code
	return xerrors.Errorf("%w: %v", errWorkspaceSSHGatewayCannotStart, err)
}

func (m *workspaceSSHGatewayManager) stop(ctx context.Context) error {
	m.operationMu.Lock()
	defer m.operationMu.Unlock()

	var changed bool
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic // The HTTP handler has already authorized the deployment update.
	err := m.api.Database.InTx(func(tx database.Store) error {
		if err := tx.AcquireLock(systemCtx, database.GenLockID(workspaceSSHGatewayConfigKey)); err != nil {
			return xerrors.Errorf("lock workspace SSH gateway configuration: %w", err)
		}
		row, stored, err := loadWorkspaceSSHGatewayConfig(systemCtx, tx)
		if err != nil {
			return err
		}
		if !row.ConfigExists || !stored.DesiredEnabled {
			return nil
		}
		stored.DesiredEnabled = false
		changed = true
		return upsertWorkspaceSSHGatewayStoredConfig(systemCtx, tx, stored)
	}, nil)
	if err != nil {
		return err
	}
	if changed {
		m.publish()
	}
	return m.stopLocal(ctx)
}

func (m *workspaceSSHGatewayManager) stopLocal(ctx context.Context) error {
	m.mu.Lock()
	if m.gateway == nil {
		m.state = codersdk.WorkspaceSSHGatewayStateStopped
		m.errorCode = ""
		m.info.Store(m.disabledInfo())
		m.mu.Unlock()
		return nil
	}
	m.state = codersdk.WorkspaceSSHGatewayStateStopping
	m.info.Store(m.disabledInfo())
	gateway := m.gateway
	m.gateway = nil
	m.mu.Unlock()

	drainCtx, cancel := context.WithTimeout(ctx, workspaceSSHGatewayDrainTime)
	defer cancel()
	err := gateway.Close(drainCtx)
	m.mu.Lock()
	m.state = codersdk.WorkspaceSSHGatewayStateStopped
	m.errorCode = ""
	m.mu.Unlock()
	// Close waits for both sockets and the event queue even after its deadline.
	// A forced drain has therefore completed the requested stop successfully.
	if errors.Is(err, context.DeadlineExceeded) && ctx.Err() == nil {
		return nil
	}
	return err
}

func (m *workspaceSSHGatewayManager) close(ctx context.Context) error {
	m.closeOnce.Do(func() {
		if m.cancel != nil {
			m.cancel()
		}
		if m.unsubscribe != nil {
			m.unsubscribe()
		}
		m.operationMu.Lock()
		m.mu.Lock()
		m.closed = true
		m.mu.Unlock()
		m.closeErr = m.stopLocal(ctx)
		m.operationMu.Unlock()
		m.wg.Wait()
	})
	return m.closeErr
}

func (m *workspaceSSHGatewayManager) status(ctx context.Context) (codersdk.WorkspaceSSHGatewayStatus, error) {
	row, stored, err := m.load(ctx)
	if err != nil {
		return codersdk.WorkspaceSSHGatewayStatus{}, err
	}
	m.mu.Lock()
	status := codersdk.WorkspaceSSHGatewayStatus{
		Config:           stored.Config,
		Configured:       row.ConfigExists,
		DesiredEnabled:   stored.DesiredEnabled,
		State:            m.state,
		APIKeyConfigured: row.CodexApiKeyExists && row.CodexApiKey != "",
		ErrorCode:        m.errorCode,
	}
	if m.gateway != nil {
		status.BoundAddress = m.gateway.Addr().String()
	}
	m.mu.Unlock()
	if row.HostPrivateKeyExists {
		signer, err := workspacessh.ParseHostSigner([]byte(row.HostPrivateKey))
		if err != nil {
			status.State = codersdk.WorkspaceSSHGatewayStateError
			status.ErrorCode = "host_key_invalid"
			return status, nil
		}
		status.HostPublicKey = strings.TrimSpace(string(ssh.MarshalAuthorizedKey(signer.PublicKey())))
		status.HostKeyFingerprint = ssh.FingerprintSHA256(signer.PublicKey())
	}
	return status, nil
}

func (m *workspaceSSHGatewayManager) load(ctx context.Context) (database.GetWorkspaceSSHGatewayConfigRow, workspaceSSHGatewayStoredConfig, error) {
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic // Runtime state is deployment-scoped and contains no user-owned resources.
	row, stored, err := loadWorkspaceSSHGatewayConfig(systemCtx, m.api.Database)
	if err == nil && !row.ConfigExists {
		stored.Config = runtimeWorkspaceSSHGatewayConfig(m.api.DeploymentValues.WorkspaceSSHGateway)
	}
	return row, stored, err
}

func loadWorkspaceSSHGatewayConfig(ctx context.Context, store database.Store) (database.GetWorkspaceSSHGatewayConfigRow, workspaceSSHGatewayStoredConfig, error) {
	row, err := store.GetWorkspaceSSHGatewayConfig(ctx)
	if err != nil {
		return row, workspaceSSHGatewayStoredConfig{}, xerrors.Errorf("read workspace SSH gateway configuration: %w", err)
	}
	if !row.ConfigExists {
		return row, workspaceSSHGatewayStoredConfig{}, nil
	}
	stored, err := parseWorkspaceSSHGatewayStoredConfig(row.Config)
	return row, stored, err
}

func parseWorkspaceSSHGatewayStoredConfig(value string) (workspaceSSHGatewayStoredConfig, error) {
	var stored workspaceSSHGatewayStoredConfig
	if err := json.Unmarshal([]byte(value), &stored); err != nil {
		return stored, xerrors.Errorf("decode workspace SSH gateway configuration: %w", err)
	}
	return stored, nil
}

func upsertWorkspaceSSHGatewayStoredConfig(ctx context.Context, store database.Store, stored workspaceSSHGatewayStoredConfig) error {
	encoded, err := json.Marshal(stored)
	if err != nil {
		return xerrors.Errorf("encode workspace SSH gateway configuration: %w", err)
	}
	if err := store.UpsertWorkspaceSSHGatewayConfig(ctx, string(encoded)); err != nil {
		return xerrors.Errorf("save workspace SSH gateway configuration: %w", err)
	}
	return nil
}

func (m *workspaceSSHGatewayManager) bootstrapDeploymentConfig(ctx context.Context) error {
	legacy := m.api.DeploymentValues.WorkspaceSSHGateway
	if !legacy.Enabled.Value() && legacy.AdvertiseHost.Value() == "" && legacy.CodexBaseURL.Value() == "" && legacy.CodexAPIKey.Value() == "" && legacy.CodexModel.Value() == "" && legacy.HostKeyFile.Value() == "" {
		return nil
	}
	systemCtx := dbauthz.AsSystemRestricted(ctx) //nolint:gocritic // Startup imports deployment-scoped configuration.
	return m.api.Database.InTx(func(tx database.Store) error {
		if err := tx.AcquireLock(systemCtx, database.GenLockID(workspaceSSHGatewayConfigKey)); err != nil {
			return xerrors.Errorf("lock workspace SSH gateway configuration: %w", err)
		}
		row, err := tx.GetWorkspaceSSHGatewayConfig(systemCtx)
		if err != nil {
			return err
		}
		if row.ConfigExists {
			return nil
		}
		stored := workspaceSSHGatewayStoredConfig{
			Config:         runtimeWorkspaceSSHGatewayConfig(m.api.DeploymentValues.WorkspaceSSHGateway),
			DesiredEnabled: legacy.Enabled.Value(),
		}
		encoded, err := json.Marshal(stored)
		if err != nil {
			return err
		}
		if err := tx.UpsertWorkspaceSSHGatewayConfig(systemCtx, string(encoded)); err != nil {
			return err
		}
		if apiKey := m.api.DeploymentValues.WorkspaceSSHGateway.CodexAPIKey.Value(); apiKey != "" {
			if err := tx.UpsertWorkspaceSSHGatewayCodexAPIKey(systemCtx, apiKey); err != nil {
				return err
			}
		}
		privateKey, err := m.legacyOrGeneratedHostKey()
		if err != nil {
			return err
		}
		return tx.UpsertWorkspaceSSHGatewayHostPrivateKey(systemCtx, privateKey)
	}, nil)
}

func (m *workspaceSSHGatewayManager) legacyOrGeneratedHostKey() (string, error) {
	path := strings.TrimSpace(m.api.DeploymentValues.WorkspaceSSHGateway.HostKeyFile.Value())
	if path == "" {
		return generateWorkspaceSSHHostKey()
	}
	key, err := os.ReadFile(path)
	if err != nil {
		return "", xerrors.Errorf("read workspace SSH gateway host key: %w", err)
	}
	if _, err := workspacessh.ParseHostSigner(key); err != nil {
		return "", err
	}
	return string(key), nil
}

func generateWorkspaceSSHHostKey() (string, error) {
	_, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return "", xerrors.Errorf("generate workspace SSH gateway host key: %w", err)
	}
	block, err := ssh.MarshalPrivateKey(privateKey, "")
	if err != nil {
		return "", xerrors.Errorf("marshal workspace SSH gateway host key: %w", err)
	}
	return string(pem.EncodeToMemory(block)), nil
}

func runtimeWorkspaceSSHGatewayConfig(config codersdk.WorkspaceSSHGatewayConfig) codersdk.WorkspaceSSHGatewayRuntimeConfig {
	return codersdk.WorkspaceSSHGatewayRuntimeConfig{
		ListenAddress:              config.ListenAddress.Value(),
		AdvertiseHost:              config.AdvertiseHost.Value(),
		AdvertisePort:              config.AdvertisePort.Value(),
		CodexBaseURL:               config.CodexBaseURL.Value(),
		CodexModel:                 config.CodexModel.Value(),
		MaxConnections:             config.MaxConnections.Value(),
		MaxPendingConnections:      config.MaxPendingConnections.Value(),
		MaxPendingConnectionsPerIP: config.MaxPendingConnectionsPerIP.Value(),
		MaxConnectionsPerUser:      config.MaxConnectionsPerUser.Value(),
		MaxChannelsPerConnection:   config.MaxChannelsPerConnection.Value(),
		AuthAttemptsPerMinute:      config.AuthAttemptsPerMinute.Value(),
		AuthAttemptsBurst:          config.AuthAttemptsBurst.Value(),
	}
}

func (m *workspaceSSHGatewayManager) disabledInfo() *codersdk.WorkspaceSSHGatewayInfo {
	return &codersdk.WorkspaceSSHGatewayInfo{
		Enabled:     false,
		AliasSuffix: "ssh." + m.api.DeploymentValues.WorkspaceHostnameSuffix.Value(),
	}
}

func (m *workspaceSSHGatewayManager) enabledInfo(config codersdk.WorkspaceSSHGatewayRuntimeConfig, signer ssh.Signer) *codersdk.WorkspaceSSHGatewayInfo {
	return &codersdk.WorkspaceSSHGatewayInfo{
		Enabled:                 true,
		Host:                    config.AdvertiseHost,
		Port:                    config.AdvertisePort,
		HostPublicKey:           strings.TrimSpace(string(ssh.MarshalAuthorizedKey(signer.PublicKey()))),
		HostKeyFingerprint:      ssh.FingerprintSHA256(signer.PublicKey()),
		AliasSuffix:             "ssh." + m.api.DeploymentValues.WorkspaceHostnameSuffix.Value(),
		ChatGPTDesktopAvailable: true,
	}
}

func (m *workspaceSSHGatewayManager) currentInfo() *codersdk.WorkspaceSSHGatewayInfo {
	return m.info.Load()
}

func (api *API) workspaceSSHGatewayInfo() *codersdk.WorkspaceSSHGatewayInfo {
	if api.workspaceSSHGatewayManager != nil {
		return api.workspaceSSHGatewayManager.currentInfo()
	}
	return api.SSHConfig.WorkspaceSSHGateway
}

func (m *workspaceSSHGatewayManager) setError(code string) {
	m.mu.Lock()
	m.state = codersdk.WorkspaceSSHGatewayStateError
	m.errorCode = code
	m.info.Store(m.disabledInfo())
	m.mu.Unlock()
}
