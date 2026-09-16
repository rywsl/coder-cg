package localconnect

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"golang.org/x/crypto/ssh"
	"golang.org/x/xerrors"

	"github.com/coder/coder/v2/codersdk"
)

// Config contains one device's credentials. Never serialize it to logs.
type Config struct {
	URL        string `json:"url"`
	DeviceID   string `json:"device_id"`
	Token      string `json:"token"`
	PrivateKey string `json:"private_key"`
	HostKey    string `json:"host_key"`
}

// APIRequest makes a non-redirecting HTTPS request without logging credentials.
func APIRequest(ctx context.Context, baseURL, path, token string, input, output any) error {
	base, err := url.Parse(baseURL)
	if err != nil || base.Scheme != "https" || base.Host == "" || base.User != nil || base.RawQuery != "" || base.Fragment != "" || base.Path != "" && base.Path != "/" {
		return xerrors.New("请输入有效的 Coder HTTPS 公网地址")
	}
	base.Path = path
	body, err := json.Marshal(input)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base.String(), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	client := &http.Client{Timeout: 20 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	resp, err := client.Do(req)
	if err != nil {
		return xerrors.New("无法连接 Coder，请检查公网网络和证书")
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return xerrors.Errorf("请求被 Coder 拒绝，HTTP %d", resp.StatusCode)
	}
	return json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(output)
}

type agentSession struct {
	client     *ssh.Client
	stopCancel func() bool
	agentID    string
	forwards   map[uint16]*Forward
	protocols  map[uint16]string
	probed     map[uint16]time.Time
}

func (s *agentSession) close() {
	if s.stopCancel != nil {
		s.stopCancel()
	}
	// Closing SSH first unblocks pending channel opens and reads.
	_ = s.client.Close()
	for _, f := range s.forwards {
		f.Close()
	}
}

// Run renews a short authorization lease before maintaining local mappings.
// remembered records non-secret port choices and can be persisted by the caller.
func Run(ctx context.Context, cfg Config, remembered map[string]uint16, persist func() error, report func(string)) error {
	ctx, cancelRun := context.WithCancel(ctx)
	defer cancelRun()
	watchdog := time.AfterFunc(30*time.Second, cancelRun)
	defer watchdog.Stop()
	signer, err := ssh.ParsePrivateKey([]byte(cfg.PrivateKey))
	if err != nil {
		return xerrors.New("设备私钥无效，请重新设置设备")
	}
	hostKey, _, _, rest, err := ssh.ParseAuthorizedKey([]byte(cfg.HostKey))
	if err != nil || len(bytes.TrimSpace(rest)) != 0 {
		return xerrors.New("SSH 主机密钥无效，请重新设置设备")
	}
	sessions := make(map[string]*agentSession)
	closeAll := func() {
		for key, session := range sessions {
			session.close()
			delete(sessions, key)
		}
	}
	defer closeAll()
	var reported []codersdk.LocalConnectorPort
	var revision int64
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		var response codersdk.LocalConnectorSync
		err := APIRequest(ctx, cfg.URL, "/api/v2/local-connect/devices/"+cfg.DeviceID+"/sync", cfg.Token, codersdk.LocalConnectorSyncRequest{Revision: revision, Reported: reported}, &response)
		if err != nil {
			report(err.Error())
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-ticker.C:
				continue
			}
		}
		watchdog.Reset(30 * time.Second)
		revision = response.Revision
		if response.Gateway.HostPublicKey != cfg.HostKey {
			closeAll()
			return xerrors.New("SSH 主机密钥已变化，请在 Coder 中重新授权设备")
		}
		if err := (codersdk.SSHConfigResponse{WorkspaceSSHGateway: &response.Gateway}).Validate(); err != nil {
			closeAll()
			return xerrors.New("SSH 网关配置无效")
		}
		keep := make(map[string]bool)
		reported = nil
		probeBudget := 4
		for _, target := range response.Targets {
			key := target.WorkspaceID.String() + "/" + target.AgentName
			keep[key] = true
			session := sessions[key]
			if session != nil && session.agentID != target.AgentID.String() {
				session.close()
				delete(sessions, key)
				session = nil
			}
			if session != nil {
				probeCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
				finished := make(chan error, 1)
				keepaliveClient := session.client
				go func() { _, _, err := keepaliveClient.SendRequest("keepalive@openssh.com", true, nil); finished <- err }()
				select {
				case err := <-finished:
					if err != nil {
						session.close()
						session = nil
					}
				case <-probeCtx.Done():
					session.close()
					session = nil
				}
				cancel()
			}
			if session == nil {
				client, err := dialSSH(ctx, response.Gateway, target.Alias, signer, hostKey)
				if err != nil {
					report("SSH 连接暂不可用，正在重试")
					delete(sessions, key)
					continue
				}
				session = &agentSession{client: client, agentID: target.AgentID.String(), forwards: make(map[uint16]*Forward), protocols: make(map[uint16]string), probed: make(map[uint16]time.Time)}
				sessions[key] = session
				session.stopCancel = context.AfterFunc(ctx, func() { _ = client.Close() })
			}
			ports := make(map[uint16]string)
			for _, port := range target.Ports {
				if port != 0 {
					ports[port] = "tcp"
				}
			}
			if target.Automatic {
				for _, port := range target.Candidates {
					if port == 0 {
						continue
					}
					if time.Since(session.probed[port]) >= 30*time.Second && probeBudget > 0 {
						probeBudget--
						session.probed[port] = time.Now()
						session.protocols[port] = detectWeb(ctx, session.client.DialContext, port)
					}
					if protocol := session.protocols[port]; protocol != "" {
						ports[port] = protocol
					}
				}
			}
			for port, forward := range session.forwards {
				if _, ok := ports[port]; !ok {
					forward.Close()
					delete(session.forwards, port)
				}
			}
			for port, protocol := range ports {
				if len(reported) >= 256 {
					break
				}
				mapping := codersdk.LocalConnectorPort{WorkspaceID: target.WorkspaceID, AgentName: target.AgentName, RemotePort: port, Protocol: protocol}
				forward := session.forwards[port]
				if forward == nil {
					rememberKey := key + "/" + strconv.Itoa(int(port))
					preferred := remembered[rememberKey]
					if preferred == 0 {
						preferred = port
					}
					client := session.client
					forward, err = Listen(ctx, preferred, func(ctx context.Context) (net.Conn, error) { return DialLoopback(ctx, client.DialContext, port) })
					if err != nil {
						mapping.ErrorCode = "listen_failed"
						reported = append(reported, mapping)
						continue
					}
					session.forwards[port] = forward
					remembered[rememberKey] = forward.Port()
					if err := persist(); err != nil {
						report("无法保存端口映射，下次启动可能重新分配端口")
					}
				}
				mapping.LocalPort = forward.Port()
				reported = append(reported, mapping)
			}
		}
		for key, session := range sessions {
			if !keep[key] {
				session.close()
				delete(sessions, key)
			}
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

func dialSSH(ctx context.Context, gateway codersdk.WorkspaceSSHGatewayInfo, alias string, signer ssh.Signer, hostKey ssh.PublicKey) (*ssh.Client, error) {
	addr := net.JoinHostPort(gateway.Host, strconv.FormatInt(gateway.Port, 10))
	ctx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()
	conn, err := (&net.Dialer{}).DialContext(ctx, "tcp", addr)
	if err != nil {
		return nil, err
	}
	deadline, _ := ctx.Deadline()
	_ = conn.SetDeadline(deadline)
	stop := context.AfterFunc(ctx, func() { _ = conn.Close() })
	defer stop()
	sshConn, channels, requests, err := ssh.NewClientConn(conn, addr, &ssh.ClientConfig{User: alias, Auth: []ssh.AuthMethod{ssh.PublicKeys(signer)}, HostKeyCallback: ssh.FixedHostKey(hostKey)})
	if err != nil {
		_ = conn.Close()
		return nil, err
	}
	_ = conn.SetDeadline(time.Time{})
	return ssh.NewClient(sshConn, channels, requests), nil
}

func detectWeb(ctx context.Context, dial func(context.Context, string, string) (net.Conn, error), port uint16) string {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	transport := &http.Transport{Proxy: nil, DisableKeepAlives: true, DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) { return DialLoopback(ctx, dial, port) }, TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12}}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	for _, scheme := range []string{"http", "https"} {
		req, _ := http.NewRequestWithContext(ctx, http.MethodHead, scheme+"://localhost:"+strconv.Itoa(int(port))+"/", nil)
		resp, err := client.Do(req)
		if err == nil {
			_ = resp.Body.Close()
			return scheme
		}
	}
	return ""
}
