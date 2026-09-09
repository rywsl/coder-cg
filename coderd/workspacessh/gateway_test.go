package workspacessh //nolint:testpackage // Exercises protocol internals and metric collectors.

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/pem"
	"io"
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/kballard/go-shellquote"
	"github.com/prometheus/client_golang/prometheus"
	promtestutil "github.com/prometheus/client_golang/prometheus/testutil"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/ssh"
	"golang.org/x/xerrors"

	"cdr.dev/slog/v3/sloggers/slogtest"
	"github.com/coder/coder/v2/testutil"
)

type observation struct {
	requestType string
	command     string
	environment map[string]string
}

type reverseChannelResult struct {
	payload []byte
	err     error
}

func TestGatewayProtocolAndCodexInjection(t *testing.T) {
	t.Parallel()
	hostSigner := newSigner(t)
	clientSigner := newSigner(t)
	agentSigner := newSigner(t)
	observations := make(chan observation, 12)
	records := make(chan ConnectionEvent, 2)
	reverse := make(chan struct{})
	reverseResult := make(chan reverseChannelResult, 1)

	gateway, err := New(Config{
		ListenAddress: "127.0.0.1:0",
		HostSigner:    hostSigner,
		Logger:        slogtest.Make(t, nil),
		Registerer:    prometheus.NewRegistry(),
		Codex: CodexConfig{
			Model:     "gpt-test",
			BaseURL:   "https://responses.example.test/v1",
			APIKey:    "test-secret-key",
			APIKeyEnv: "TEST_CODEX_API_KEY",
		},
		Authenticate: func(_ context.Context, metadata ssh.ConnMetadata, key ssh.PublicKey) (Target, error) {
			require.Equal(t, "agent.workspace.owner.coder", metadata.User())
			require.Equal(t, ssh.FingerprintSHA256(clientSigner.PublicKey()), ssh.FingerprintSHA256(key))
			return Target{
				UserID:           uuid.New(),
				Username:         "member",
				OrganizationID:   uuid.New(),
				OrganizationName: "example",
				WorkspaceOwnerID: uuid.New(),
				WorkspaceID:      uuid.New(),
				WorkspaceName:    "workspace",
				AgentID:          uuid.New(),
				AgentName:        "agent",
			}, nil
		},
		DialAgent: func(_ context.Context, _ Target) (net.Conn, func(), error) {
			listener, err := net.Listen("tcp", "127.0.0.1:0")
			require.NoError(t, err)
			go func() {
				server, err := listener.Accept()
				if err == nil {
					serveFakeAgent(t, server, agentSigner, observations, reverse, reverseResult)
				}
				_ = listener.Close()
			}()
			client, err := net.Dial("tcp", listener.Addr().String())
			return client, func() {}, err
		},
		Record: func(_ context.Context, event ConnectionEvent) {
			records <- event
		},
	})
	require.NoError(t, err)
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), testutil.WaitLong)
		defer cancel()
		require.NoError(t, gateway.Close(ctx))
	})

	client, err := ssh.Dial("tcp", gateway.Addr().String(), &ssh.ClientConfig{
		User:            "agent.workspace.owner.coder",
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(clientSigner)},
		HostKeyCallback: ssh.FixedHostKey(hostSigner.PublicKey()),
		Timeout:         5 * time.Second,
	})
	require.NoError(t, err)
	defer client.Close()

	ok, payload, err := client.SendRequest("gateway-test", true, []byte("request"))
	require.NoError(t, err)
	require.True(t, ok)
	require.Equal(t, []byte("agent-response"), payload)

	session, err := client.NewSession()
	require.NoError(t, err)
	require.NoError(t, session.Setenv("FORWARDED", "environment"))
	output, err := session.CombinedOutput("printf hello")
	require.NoError(t, err)
	require.Contains(t, string(output), "stdout:printf hello\n")
	require.Contains(t, string(output), "stderr:printf hello\n")
	require.Equal(t, observation{requestType: "exec", command: "printf hello", environment: map[string]string{"FORWARDED": "environment"}}, <-observations)

	shell, err := client.NewSession()
	require.NoError(t, err)
	shellOutput, err := shell.StdoutPipe()
	require.NoError(t, err)
	require.NoError(t, shell.Shell())
	require.Equal(t, "shell", (<-observations).requestType)
	data, err := io.ReadAll(shellOutput)
	require.NoError(t, err)
	require.Equal(t, "shell ready\n", string(data))
	require.NoError(t, shell.Wait())

	subsystem, err := client.NewSession()
	require.NoError(t, err)
	require.NoError(t, subsystem.RequestSubsystem("sftp"))
	subsystemObservation := <-observations
	require.Equal(t, "subsystem", subsystemObservation.requestType)
	require.Equal(t, "sftp", subsystemObservation.command)
	require.NoError(t, subsystem.Close())

	pty, err := client.NewSession()
	require.NoError(t, err)
	require.NoError(t, pty.RequestPty("xterm", 24, 80, ssh.TerminalModes{}))
	require.NoError(t, pty.Run("pty-command"))
	require.Equal(t, "pty-req", (<-observations).requestType)
	ptyExec := <-observations
	require.Equal(t, "pty-command", ptyExec.command)

	codex, err := client.NewSession()
	require.NoError(t, err)
	require.NoError(t, codex.Run("codex app-server --listen stdio"))
	codexObservation := <-observations
	require.Equal(t, "exec", codexObservation.requestType)
	require.NotContains(t, codexObservation.command, "test-secret-key")
	codexArguments, err := shellquote.Split(codexObservation.command)
	require.NoError(t, err)
	require.Contains(t, codexArguments, `model="gpt-test"`)
	require.Contains(t, codexArguments, `model_provider="sub2"`)
	require.Contains(t, codexArguments, `model_providers.sub2.wire_api="responses"`)
	require.Equal(t, "test-secret-key", codexObservation.environment["TEST_CODEX_API_KEY"])

	desktop, err := client.NewSession()
	require.NoError(t, err)
	desktopCommand := shellquote.Join("sh", "-c", desktopLoginShellWrapperV1, "sh", desktopDaemonPayloadV1)
	require.NoError(t, desktop.Run(desktopCommand))
	desktopObservation := <-observations
	require.Equal(t, "exec", desktopObservation.requestType)
	require.NotContains(t, desktopObservation.command, "test-secret-key")
	require.Contains(t, desktopObservation.command, `model_provider=\"sub2\"`)
	require.Equal(t, "test-secret-key", desktopObservation.environment["TEST_CODEX_API_KEY"])

	malicious, err := client.NewSession()
	require.NoError(t, err)
	require.Error(t, malicious.Run("codex app-server && echo injected"))

	direct, requests, err := client.OpenChannel("direct-tcpip", []byte("metadata"))
	require.NoError(t, err)
	go ssh.DiscardRequests(requests)
	_, err = direct.Write([]byte("channel data"))
	require.NoError(t, err)
	require.NoError(t, direct.CloseWrite())
	data, err = io.ReadAll(direct)
	require.NoError(t, err)
	require.Equal(t, []byte("echo:channel data"), data)
	_ = direct.Close()

	reverseChannels := client.HandleChannelOpen("forwarded-tcpip")
	close(reverse)
	incoming := <-reverseChannels
	require.Equal(t, []byte("reverse-metadata"), incoming.ExtraData())
	reverseChannel, reverseRequests, err := incoming.Accept()
	require.NoError(t, err)
	go ssh.DiscardRequests(reverseRequests)
	reversePayload, err := io.ReadAll(reverseChannel)
	require.NoError(t, err)
	require.Equal(t, []byte("from-agent"), reversePayload)
	_, err = reverseChannel.Write([]byte("from-client"))
	require.NoError(t, err)
	require.NoError(t, reverseChannel.CloseWrite())
	require.NoError(t, reverseChannel.Close())
	require.Equal(t, reverseChannelResult{payload: []byte("from-client")}, <-reverseResult)

	require.NoError(t, client.Close())
	connectedRecord := <-records
	disconnectedRecord := <-records
	require.Zero(t, connectedRecord.DisconnectedAt)
	require.Equal(t, "connected", connectedRecord.Result)
	require.NotZero(t, disconnectedRecord.DisconnectedAt)
	require.Equal(t, "completed", disconnectedRecord.Result)
}

func TestGatewayAuthenticationMetrics(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name              string
		authenticate      func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error)
		authentication    float64
		targetUnavailable float64
	}{
		{
			name: "RejectedKey",
			authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
				return Target{}, xerrors.New("rejected")
			},
			authentication: 1,
		},
		{
			name: "UnavailableTarget",
			authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
				return Target{}, &TargetUnavailableError{Reason: "agent_not_ready"}
			},
			targetUnavailable: 1,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			registry := prometheus.NewRegistry()
			gateway, err := New(Config{
				ListenAddress: "127.0.0.1:0",
				HostSigner:    newSigner(t),
				Logger:        slogtest.Make(t, nil),
				Registerer:    registry,
				Authenticate:  test.authenticate,
				DialAgent: func(context.Context, Target) (net.Conn, func(), error) {
					return nil, func() {}, xerrors.New("must not dial")
				},
			})
			require.NoError(t, err)
			t.Cleanup(func() {
				require.NoError(t, gateway.Close(context.Background()))
			})

			_, err = ssh.Dial("tcp", gateway.Addr().String(), &ssh.ClientConfig{
				User:            "agent.workspace.owner.coder",
				Auth:            []ssh.AuthMethod{ssh.PublicKeys(newSigner(t))},
				HostKeyCallback: ssh.InsecureIgnoreHostKey(), // #nosec G106 -- the generated test endpoint is trusted.
				Timeout:         5 * time.Second,
			})
			require.Error(t, err)
			require.Equal(t, test.authentication, promtestutil.ToFloat64(gateway.metrics.authFailures.WithLabelValues("rejected")))
			require.Zero(t, promtestutil.ToFloat64(gateway.metrics.authFailures.WithLabelValues("handshake")))
			require.Equal(t, test.targetUnavailable, promtestutil.ToFloat64(gateway.metrics.targetUnreachable.WithLabelValues("agent_not_ready")))
		})
	}
}

func TestGatewayConnectionLimits(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name   string
		limits func() Limits
		reason string
	}{
		{
			name: "Total",
			limits: func() Limits {
				limits := DefaultLimits()
				limits.MaxConnections = 1
				limits.MaxPendingConnections = 1
				return limits
			},
			reason: "connections",
		},
		{
			name: "PendingGlobal",
			limits: func() Limits {
				limits := DefaultLimits()
				limits.MaxConnections = 2
				limits.MaxPendingConnections = 1
				limits.MaxPendingConnectionsPerIP = 2
				return limits
			},
			reason: "pending",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			gateway, err := New(Config{
				ListenAddress: "127.0.0.1:0",
				HostSigner:    newSigner(t),
				Logger:        slogtest.Make(t, nil),
				Registerer:    prometheus.NewRegistry(),
				Limits:        test.limits(),
				Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
					return Target{}, xerrors.New("must not authenticate")
				},
				DialAgent: func(context.Context, Target) (net.Conn, func(), error) {
					return nil, func() {}, xerrors.New("must not dial")
				},
			})
			require.NoError(t, err)
			t.Cleanup(func() { require.NoError(t, gateway.Close(context.Background())) })

			first, err := net.Dial("tcp", gateway.Addr().String())
			require.NoError(t, err)
			defer first.Close()
			require.Eventually(t, func() bool {
				return promtestutil.ToFloat64(gateway.metrics.pending) == 1
			}, testutil.WaitShort, testutil.IntervalFast)
			second, err := net.Dial("tcp", gateway.Addr().String())
			require.NoError(t, err)
			defer second.Close()
			require.Eventually(t, func() bool {
				return promtestutil.ToFloat64(gateway.metrics.capacityRejected.WithLabelValues(test.reason)) == 1
			}, testutil.WaitShort, testutil.IntervalFast)
		})
	}

	t.Run("PendingPerIP", func(t *testing.T) {
		t.Parallel()
		limits := DefaultLimits()
		limits.MaxPendingConnectionsPerIP = 1
		gateway, err := New(Config{
			ListenAddress: "127.0.0.1:0",
			HostSigner:    newSigner(t),
			Logger:        slogtest.Make(t, nil),
			Registerer:    prometheus.NewRegistry(),
			Limits:        limits,
			Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
				return Target{}, xerrors.New("must not authenticate")
			},
			DialAgent: func(context.Context, Target) (net.Conn, func(), error) {
				return nil, func() {}, xerrors.New("must not dial")
			},
		})
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, gateway.Close(context.Background())) })

		first, err := net.Dial("tcp", gateway.Addr().String())
		require.NoError(t, err)
		defer first.Close()
		require.Eventually(t, func() bool {
			return promtestutil.ToFloat64(gateway.metrics.pending) == 1
		}, testutil.WaitShort, testutil.IntervalFast)
		second, err := net.Dial("tcp", gateway.Addr().String())
		require.NoError(t, err)
		defer second.Close()
		require.Eventually(t, func() bool {
			return promtestutil.ToFloat64(gateway.metrics.capacityRejected.WithLabelValues("pending_ip")) == 1
		}, testutil.WaitShort, testutil.IntervalFast)
	})

	t.Run("AuthenticationRate", func(t *testing.T) {
		t.Parallel()
		limits := DefaultLimits()
		limits.AuthAttemptsBurst = 1
		gateway, err := New(Config{
			ListenAddress: "127.0.0.1:0",
			HostSigner:    newSigner(t),
			Logger:        slogtest.Make(t, nil),
			Registerer:    prometheus.NewRegistry(),
			Limits:        limits,
			Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
				return Target{UserID: uuid.New()}, nil
			},
			DialAgent: func(context.Context, Target) (net.Conn, func(), error) {
				return nil, func() {}, xerrors.New("must not dial")
			},
		})
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, gateway.Close(context.Background())) })
		first, err := ssh.Dial("tcp", gateway.Addr().String(), testSSHClientConfig(newSigner(t), gateway.config.HostSigner.PublicKey()))
		require.NoError(t, err)
		_ = first.Close()
		_, err = ssh.Dial("tcp", gateway.Addr().String(), testSSHClientConfig(newSigner(t), gateway.config.HostSigner.PublicKey()))
		require.Error(t, err)
		require.Positive(t, promtestutil.ToFloat64(gateway.metrics.authRateLimited))
	})

	t.Run("PerUser", func(t *testing.T) {
		t.Parallel()
		limits := DefaultLimits()
		limits.MaxConnectionsPerUser = 1
		userID := uuid.New()
		gateway, err := newTestGateway(t, limits, func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
			return Target{UserID: userID}, nil
		})
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, gateway.Close(context.Background())) })
		first, err := ssh.Dial("tcp", gateway.Addr().String(), testSSHClientConfig(newSigner(t), gateway.config.HostSigner.PublicKey()))
		require.NoError(t, err)
		defer first.Close()
		_, err = ssh.Dial("tcp", gateway.Addr().String(), testSSHClientConfig(newSigner(t), gateway.config.HostSigner.PublicKey()))
		require.Error(t, err)
		require.Equal(t, float64(1), promtestutil.ToFloat64(gateway.metrics.capacityRejected.WithLabelValues("user")))
	})

	t.Run("Channels", func(t *testing.T) {
		t.Parallel()
		limits := DefaultLimits()
		limits.MaxChannelsPerConnection = 1
		gateway, err := newTestGateway(t, limits, func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
			return Target{UserID: uuid.New()}, nil
		})
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, gateway.Close(context.Background())) })
		client, err := ssh.Dial("tcp", gateway.Addr().String(), testSSHClientConfig(newSigner(t), gateway.config.HostSigner.PublicKey()))
		require.NoError(t, err)
		defer client.Close()
		first, requests, err := client.OpenChannel("direct-tcpip", nil)
		require.NoError(t, err)
		defer first.Close()
		go ssh.DiscardRequests(requests)
		_, _, err = client.OpenChannel("direct-tcpip", nil)
		var openError *ssh.OpenChannelError
		require.ErrorAs(t, err, &openError)
		require.Equal(t, ssh.ResourceShortage, openError.Reason)
		require.Equal(t, float64(1), promtestutil.ToFloat64(gateway.metrics.capacityRejected.WithLabelValues("channel")))
	})

	t.Run("ChannelsSharedAcrossDirections", func(t *testing.T) {
		t.Parallel()
		limits := DefaultLimits()
		limits.MaxChannelsPerConnection = 1
		reverse := make(chan struct{})
		reverseResult := make(chan reverseChannelResult, 1)
		agentSigner := newSigner(t)
		gateway, err := New(Config{
			ListenAddress: "127.0.0.1:0",
			HostSigner:    newSigner(t),
			Logger:        slogtest.Make(t, nil),
			Registerer:    prometheus.NewRegistry(),
			Limits:        limits,
			Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
				return Target{UserID: uuid.New()}, nil
			},
			DialAgent: fakeAgentDialer(t, agentSigner, reverse, reverseResult),
		})
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, gateway.Close(context.Background())) })
		client, err := ssh.Dial("tcp", gateway.Addr().String(), testSSHClientConfig(newSigner(t), gateway.config.HostSigner.PublicKey()))
		require.NoError(t, err)
		defer client.Close()
		_ = client.HandleChannelOpen("forwarded-tcpip")

		channel, requests, err := client.OpenChannel("direct-tcpip", nil)
		require.NoError(t, err)
		defer channel.Close()
		go ssh.DiscardRequests(requests)
		close(reverse)
		result := <-reverseResult
		var openError *ssh.OpenChannelError
		require.ErrorAs(t, result.err, &openError)
		require.Equal(t, ssh.ResourceShortage, openError.Reason)
		require.Equal(t, float64(1), promtestutil.ToFloat64(gateway.metrics.capacityRejected.WithLabelValues("channel")))
	})
}

func TestGatewayOperationTimeouts(t *testing.T) {
	t.Parallel()

	t.Run("ExternalHandshake", func(t *testing.T) {
		t.Parallel()
		gateway, err := New(Config{
			ListenAddress: "127.0.0.1:0",
			HostSigner:    newSigner(t),
			Logger:        slogtest.Make(t, nil),
			Registerer:    prometheus.NewRegistry(),
			Timeouts:      Timeouts{ExternalHandshake: 20 * time.Millisecond},
			Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
				return Target{}, xerrors.New("must not authenticate")
			},
			DialAgent: func(context.Context, Target) (net.Conn, func(), error) {
				return nil, func() {}, xerrors.New("must not dial")
			},
		})
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, gateway.Close(context.Background())) })
		conn, err := net.Dial("tcp", gateway.Addr().String())
		require.NoError(t, err)
		defer conn.Close()
		_, err = io.ReadAll(conn)
		require.NoError(t, err)
		require.Eventually(t, func() bool {
			return promtestutil.ToFloat64(gateway.metrics.timeouts.WithLabelValues("external_handshake")) == 1
		}, testutil.WaitShort, testutil.IntervalFast)
	})

	t.Run("Authentication", func(t *testing.T) {
		t.Parallel()
		gateway, err := New(Config{
			ListenAddress: "127.0.0.1:0",
			HostSigner:    newSigner(t),
			Logger:        slogtest.Make(t, nil),
			Registerer:    prometheus.NewRegistry(),
			Timeouts:      Timeouts{Authentication: 20 * time.Millisecond},
			Authenticate: func(ctx context.Context, _ ssh.ConnMetadata, _ ssh.PublicKey) (Target, error) {
				<-ctx.Done()
				return Target{}, ctx.Err()
			},
			DialAgent: func(context.Context, Target) (net.Conn, func(), error) {
				return nil, func() {}, xerrors.New("must not dial")
			},
		})
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, gateway.Close(context.Background())) })
		_, err = ssh.Dial("tcp", gateway.Addr().String(), testSSHClientConfig(newSigner(t), gateway.config.HostSigner.PublicKey()))
		require.Error(t, err)
		require.Equal(t, float64(1), promtestutil.ToFloat64(gateway.metrics.timeouts.WithLabelValues("authentication")))
	})

	t.Run("AgentDial", func(t *testing.T) {
		t.Parallel()
		gateway, err := New(Config{
			ListenAddress: "127.0.0.1:0",
			HostSigner:    newSigner(t),
			Logger:        slogtest.Make(t, nil),
			Registerer:    prometheus.NewRegistry(),
			Timeouts:      Timeouts{AgentDial: 20 * time.Millisecond},
			Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
				return Target{UserID: uuid.New()}, nil
			},
			DialAgent: func(ctx context.Context, _ Target) (net.Conn, func(), error) {
				<-ctx.Done()
				return nil, func() {}, ctx.Err()
			},
		})
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, gateway.Close(context.Background())) })
		client, err := ssh.Dial("tcp", gateway.Addr().String(), testSSHClientConfig(newSigner(t), gateway.config.HostSigner.PublicKey()))
		require.NoError(t, err)
		require.Error(t, client.Wait())
		require.Equal(t, float64(1), promtestutil.ToFloat64(gateway.metrics.timeouts.WithLabelValues("agent_dial")))
	})

	t.Run("AgentHandshake", func(t *testing.T) {
		t.Parallel()
		var peer net.Conn
		gateway, err := New(Config{
			ListenAddress: "127.0.0.1:0",
			HostSigner:    newSigner(t),
			Logger:        slogtest.Make(t, nil),
			Registerer:    prometheus.NewRegistry(),
			Timeouts:      Timeouts{AgentHandshake: 20 * time.Millisecond},
			Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
				return Target{UserID: uuid.New()}, nil
			},
			DialAgent: func(context.Context, Target) (net.Conn, func(), error) {
				gatewaySide, agentSide := net.Pipe()
				peer = agentSide
				return gatewaySide, func() {}, nil
			},
		})
		require.NoError(t, err)
		t.Cleanup(func() {
			if peer != nil {
				_ = peer.Close()
			}
			require.NoError(t, gateway.Close(context.Background()))
		})
		client, err := ssh.Dial("tcp", gateway.Addr().String(), testSSHClientConfig(newSigner(t), gateway.config.HostSigner.PublicKey()))
		require.NoError(t, err)
		require.Error(t, client.Wait())
		require.Equal(t, float64(1), promtestutil.ToFloat64(gateway.metrics.timeouts.WithLabelValues("agent_handshake")))
	})
}

func TestGatewayAcceptBackoff(t *testing.T) {
	t.Parallel()
	listener := &temporaryErrorListener{calls: make(chan time.Time, 3)}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	gateway := &Gateway{
		config:   Config{Logger: slogtest.Make(t, nil)},
		listener: listener,
		ctx:      ctx,
		metrics:  newMetrics(),
	}
	gateway.wg.Add(1)
	go gateway.serve()
	gateway.wg.Wait()
	first := <-listener.calls
	second := <-listener.calls
	third := <-listener.calls
	require.GreaterOrEqual(t, second.Sub(first), 4*time.Millisecond)
	require.GreaterOrEqual(t, third.Sub(second), 9*time.Millisecond)
}

func TestGatewayEventRecording(t *testing.T) {
	t.Parallel()

	t.Run("Timeout", func(t *testing.T) {
		t.Parallel()
		gateway, err := New(Config{
			ListenAddress: "127.0.0.1:0",
			HostSigner:    newSigner(t),
			Logger:        slogtest.Make(t, nil),
			Registerer:    prometheus.NewRegistry(),
			Timeouts:      Timeouts{Record: 20 * time.Millisecond},
			Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
				return Target{}, xerrors.New("must not authenticate")
			},
			DialAgent: func(context.Context, Target) (net.Conn, func(), error) {
				return nil, func() {}, xerrors.New("must not dial")
			},
			Record: func(ctx context.Context, _ ConnectionEvent) {
				<-ctx.Done()
			},
		})
		require.NoError(t, err)
		gateway.record(ConnectionEvent{})
		require.Eventually(t, func() bool {
			return promtestutil.ToFloat64(gateway.metrics.timeouts.WithLabelValues("event_record")) == 1
		}, testutil.WaitShort, testutil.IntervalFast)
		require.NoError(t, gateway.Close(context.Background()))
	})

	t.Run("Drop", func(t *testing.T) {
		t.Parallel()
		gateway := &Gateway{
			config:  Config{Record: func(context.Context, ConnectionEvent) {}},
			metrics: newMetrics(),
			records: make(chan ConnectionEvent, 1),
		}
		gateway.record(ConnectionEvent{})
		gateway.record(ConnectionEvent{DisconnectedAt: time.Now()})
		require.Equal(t, float64(1), promtestutil.ToFloat64(gateway.metrics.eventsDropped.WithLabelValues("disconnected")))
	})
}

func TestIsCompletedConnection(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		err  error
		want bool
	}{
		{name: "Nil", want: true},
		{name: "EOF", err: io.EOF, want: true},
		{name: "Closed", err: net.ErrClosed, want: true},
		{name: "OpenSSH", err: xerrors.New(`ssh: disconnect, reason 11: "disconnected by user"`), want: true},
		{name: "ProtocolError", err: xerrors.New("ssh: got bogus newkeys message")},
		{name: "OtherDisconnect", err: xerrors.New(`ssh: disconnect, reason 2: "protocol error"`)},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			require.Equal(t, test.want, isCompletedConnection(test.err))
		})
	}
}

func TestGatewayClose(t *testing.T) {
	t.Parallel()

	t.Run("Drain", func(t *testing.T) {
		t.Parallel()
		gateway, client, connected := newConnectedTestGateway(t)
		<-connected

		closeResult := make(chan error, 1)
		go func() { closeResult <- gateway.Close(context.Background()) }()
		require.Eventually(t, func() bool {
			conn, err := net.DialTimeout("tcp", gateway.Addr().String(), 20*time.Millisecond)
			if err == nil {
				_ = conn.Close()
			}
			return err != nil
		}, testutil.WaitLong, testutil.IntervalFast)
		select {
		case err := <-closeResult:
			require.Failf(t, "gateway closed before connection drained", "error: %v", err)
		case <-time.After(50 * time.Millisecond):
		}
		require.NoError(t, client.Close())
		require.NoError(t, <-closeResult)
	})

	t.Run("Force", func(t *testing.T) {
		t.Parallel()
		records := make(chan ConnectionEvent, 2)
		gateway, client := newRecordedTestGateway(t, records)
		connected := <-records
		require.Equal(t, "connected", connected.Result)
		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		require.ErrorIs(t, gateway.Close(ctx), context.Canceled)
		require.Error(t, client.Wait())
		disconnected := <-records
		require.Equal(t, "shutdown", disconnected.Result)
		require.NotZero(t, disconnected.DisconnectedAt)
	})

	t.Run("CancelDial", func(t *testing.T) {
		t.Parallel()
		dialStarted := make(chan struct{})
		dialCanceled := make(chan struct{})
		gateway, err := New(Config{
			ListenAddress: "127.0.0.1:0",
			HostSigner:    newSigner(t),
			Logger:        slogtest.Make(t, nil),
			Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
				return Target{}, nil
			},
			DialAgent: func(ctx context.Context, _ Target) (net.Conn, func(), error) {
				close(dialStarted)
				<-ctx.Done()
				close(dialCanceled)
				return nil, func() {}, ctx.Err()
			},
		})
		require.NoError(t, err)

		clientConn, err := net.Dial("tcp", gateway.Addr().String())
		require.NoError(t, err)
		clientConfig := &ssh.ClientConfig{
			User:            "agent.workspace.owner.coder",
			Auth:            []ssh.AuthMethod{ssh.PublicKeys(newSigner(t))},
			HostKeyCallback: ssh.InsecureIgnoreHostKey(), // #nosec G106 -- the generated test endpoint is trusted.
		}
		_, _, _, err = ssh.NewClientConn(clientConn, gateway.Addr().String(), clientConfig)
		require.NoError(t, err)
		<-dialStarted

		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		require.ErrorIs(t, gateway.Close(ctx), context.Canceled)
		select {
		case <-dialCanceled:
		case <-time.After(testutil.WaitShort):
			require.Fail(t, "agent dial context was not canceled")
		}
	})
}

func TestLoadHostSigner(t *testing.T) {
	t.Parallel()
	_, rawPrivate, err := ed25519.GenerateKey(rand.Reader)
	require.NoError(t, err)
	block, err := ssh.MarshalPrivateKey(rawPrivate, "")
	require.NoError(t, err)
	path := filepath.Join(t.TempDir(), "host_key")
	require.NoError(t, os.WriteFile(path, pem.EncodeToMemory(block), 0o600))
	loaded, err := LoadHostSigner(path)
	require.NoError(t, err)
	require.Equal(t, ssh.KeyAlgoED25519, loaded.PublicKey().Type())
	require.NoError(t, os.Chmod(path, 0o644))
	_, err = LoadHostSigner(path)
	require.ErrorContains(t, err, "group or others")
}

func TestGatewaysShareHostKey(t *testing.T) {
	t.Parallel()
	_, rawPrivate, err := ed25519.GenerateKey(rand.Reader)
	require.NoError(t, err)
	block, err := ssh.MarshalPrivateKey(rawPrivate, "")
	require.NoError(t, err)
	path := filepath.Join(t.TempDir(), "host_key")
	require.NoError(t, os.WriteFile(path, pem.EncodeToMemory(block), 0o600))

	firstSigner, err := LoadHostSigner(path)
	require.NoError(t, err)
	secondSigner, err := LoadHostSigner(path)
	require.NoError(t, err)
	require.Equal(t, ssh.FingerprintSHA256(firstSigner.PublicKey()), ssh.FingerprintSHA256(secondSigner.PublicKey()))

	for _, signer := range []ssh.Signer{firstSigner, secondSigner} {
		gateway, err := New(Config{
			ListenAddress: "127.0.0.1:0",
			HostSigner:    signer,
			Logger:        slogtest.Make(t, nil),
			Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
				return Target{}, nil
			},
			DialAgent: func(context.Context, Target) (net.Conn, func(), error) {
				return nil, func() {}, xerrors.New("target unavailable after external handshake")
			},
		})
		require.NoError(t, err)

		client, err := ssh.Dial("tcp", gateway.Addr().String(), &ssh.ClientConfig{
			User:            "agent.workspace.owner.coder",
			Auth:            []ssh.AuthMethod{ssh.PublicKeys(newSigner(t))},
			HostKeyCallback: ssh.FixedHostKey(firstSigner.PublicKey()),
			Timeout:         5 * time.Second,
		})
		require.NoError(t, err)
		if err := client.Close(); err != nil {
			require.ErrorIs(t, err, net.ErrClosed)
		}
		require.NoError(t, gateway.Close(context.Background()))
	}
}

func newSigner(t *testing.T) ssh.Signer {
	t.Helper()
	_, privateKey, err := ed25519.GenerateKey(rand.Reader)
	require.NoError(t, err)
	signer, err := ssh.NewSignerFromKey(privateKey)
	require.NoError(t, err)
	return signer
}

func testSSHClientConfig(signer ssh.Signer, hostKey ssh.PublicKey) *ssh.ClientConfig {
	return &ssh.ClientConfig{
		User:            "agent.workspace.owner.coder",
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(signer)},
		HostKeyCallback: ssh.FixedHostKey(hostKey),
		Timeout:         5 * time.Second,
	}
}

func newTestGateway(
	t *testing.T,
	limits Limits,
	authenticate func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error),
) (*Gateway, error) {
	t.Helper()
	agentSigner := newSigner(t)
	return New(Config{
		ListenAddress: "127.0.0.1:0",
		HostSigner:    newSigner(t),
		Logger:        slogtest.Make(t, nil),
		Registerer:    prometheus.NewRegistry(),
		Limits:        limits,
		Authenticate:  authenticate,
		DialAgent:     fakeAgentDialer(t, agentSigner, nil, nil),
	})
}

func fakeAgentDialer(t *testing.T, signer ssh.Signer, reverse <-chan struct{}, reverseResult chan<- reverseChannelResult) func(context.Context, Target) (net.Conn, func(), error) {
	t.Helper()
	return func(context.Context, Target) (net.Conn, func(), error) {
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			return nil, func() {}, err
		}
		go func() {
			agentSide, acceptErr := listener.Accept()
			if acceptErr == nil {
				serveFakeAgent(t, agentSide, signer, make(chan observation, 1), reverse, reverseResult)
			}
			_ = listener.Close()
		}()
		gatewaySide, err := net.Dial("tcp", listener.Addr().String())
		return gatewaySide, func() {}, err
	}
}

func newRecordedTestGateway(t *testing.T, records chan<- ConnectionEvent) (*Gateway, *ssh.Client) {
	t.Helper()
	limits := DefaultLimits()
	gateway, err := New(Config{
		ListenAddress: "127.0.0.1:0",
		HostSigner:    newSigner(t),
		Logger:        slogtest.Make(t, nil),
		Limits:        limits,
		Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
			return Target{UserID: uuid.New()}, nil
		},
		DialAgent: fakeAgentDialer(t, newSigner(t), nil, nil),
		Record: func(_ context.Context, event ConnectionEvent) {
			records <- event
		},
	})
	require.NoError(t, err)
	client, err := ssh.Dial("tcp", gateway.Addr().String(), testSSHClientConfig(newSigner(t), gateway.config.HostSigner.PublicKey()))
	require.NoError(t, err)
	return gateway, client
}

func newConnectedTestGateway(t *testing.T) (*Gateway, *ssh.Client, <-chan struct{}) {
	t.Helper()
	hostSigner := newSigner(t)
	agentSigner := newSigner(t)
	connected := make(chan struct{})
	gateway, err := New(Config{
		ListenAddress: "127.0.0.1:0",
		HostSigner:    hostSigner,
		Logger:        slogtest.Make(t, nil),
		Authenticate: func(context.Context, ssh.ConnMetadata, ssh.PublicKey) (Target, error) {
			return Target{}, nil
		},
		DialAgent: func(context.Context, Target) (net.Conn, func(), error) {
			listener, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				return nil, func() {}, err
			}
			go func() {
				agentSide, acceptErr := listener.Accept()
				if acceptErr == nil {
					serveFakeAgent(t, agentSide, agentSigner, make(chan observation, 1), nil, nil)
				}
				_ = listener.Close()
			}()
			gatewaySide, err := net.Dial("tcp", listener.Addr().String())
			return gatewaySide, func() {}, err
		},
		Record: func(_ context.Context, event ConnectionEvent) {
			if event.DisconnectedAt.IsZero() {
				close(connected)
			}
		},
	})
	require.NoError(t, err)
	client, err := ssh.Dial("tcp", gateway.Addr().String(), &ssh.ClientConfig{
		User:            "agent.workspace.owner.coder",
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(newSigner(t))},
		HostKeyCallback: ssh.FixedHostKey(hostSigner.PublicKey()),
		Timeout:         5 * time.Second,
	})
	require.NoError(t, err)
	return gateway, client, connected
}

func serveFakeAgent(
	t *testing.T,
	conn net.Conn,
	signer ssh.Signer,
	observations chan<- observation,
	reverse <-chan struct{},
	reverseResult chan<- reverseChannelResult,
) {
	t.Helper()
	defer conn.Close()
	config := &ssh.ServerConfig{NoClientAuth: true}
	config.AddHostKey(signer)
	server, channels, requests, err := ssh.NewServerConn(conn, config)
	if err != nil {
		return
	}
	defer server.Close()
	if reverse != nil {
		go func() {
			<-reverse
			channel, requests, err := server.OpenChannel("forwarded-tcpip", []byte("reverse-metadata"))
			if err != nil {
				reverseResult <- reverseChannelResult{err: err}
				return
			}
			go ssh.DiscardRequests(requests)
			_, err = channel.Write([]byte("from-agent"))
			if err == nil {
				err = channel.CloseWrite()
			}
			var payload []byte
			if err == nil {
				payload, err = io.ReadAll(channel)
			}
			_ = channel.Close()
			reverseResult <- reverseChannelResult{payload: payload, err: err}
		}()
	}
	go func() {
		for request := range requests {
			if request.Type == "gateway-test" {
				_ = request.Reply(true, []byte("agent-response"))
				continue
			}
			_ = request.Reply(false, nil)
		}
	}()
	for incoming := range channels {
		channel, channelRequests, err := incoming.Accept()
		if err != nil {
			continue
		}
		if incoming.ChannelType() != "session" {
			go func() {
				data, _ := io.ReadAll(channel)
				_, _ = channel.Write(append([]byte("echo:"), data...))
				_ = channel.Close()
			}()
			continue
		}
		go func() {
			defer channel.Close()
			environment := map[string]string{}
			for request := range channelRequests {
				switch request.Type {
				case "env":
					var env struct{ Name, Value string }
					if err := ssh.Unmarshal(request.Payload, &env); err != nil {
						_ = request.Reply(false, nil)
						continue
					}
					environment[env.Name] = env.Value
					_ = request.Reply(true, nil)
				case "pty-req":
					observations <- observation{requestType: "pty-req", environment: cloneMap(environment)}
					_ = request.Reply(true, nil)
				case "shell":
					observations <- observation{requestType: "shell", environment: cloneMap(environment)}
					_ = request.Reply(true, nil)
					_, _ = channel.Write([]byte("shell ready\n"))
					_, _ = channel.SendRequest("exit-status", false, ssh.Marshal(struct{ Status uint32 }{0}))
					return
				case "subsystem":
					var subsystem struct{ Name string }
					if err := ssh.Unmarshal(request.Payload, &subsystem); err != nil {
						_ = request.Reply(false, nil)
						continue
					}
					observations <- observation{requestType: "subsystem", command: subsystem.Name, environment: cloneMap(environment)}
					_ = request.Reply(true, nil)
				case "exec":
					var execRequest struct{ Command string }
					if err := ssh.Unmarshal(request.Payload, &execRequest); err != nil {
						_ = request.Reply(false, nil)
						continue
					}
					observations <- observation{requestType: "exec", command: execRequest.Command, environment: cloneMap(environment)}
					_ = request.Reply(true, nil)
					if execRequest.Command == "printf hello" {
						_, _ = channel.Write([]byte("stdout:printf hello\n"))
						_, _ = channel.Stderr().Write([]byte("stderr:printf hello\n"))
					}
					_, _ = channel.SendRequest("exit-status", false, ssh.Marshal(struct{ Status uint32 }{0}))
					return
				default:
					_ = request.Reply(true, nil)
				}
			}
		}()
	}
}

func cloneMap(source map[string]string) map[string]string {
	result := make(map[string]string, len(source))
	for key, value := range source {
		result[key] = value
	}
	return result
}

type temporaryAcceptError struct{}

func (temporaryAcceptError) Error() string   { return "temporary accept error" }
func (temporaryAcceptError) Timeout() bool   { return false }
func (temporaryAcceptError) Temporary() bool { return true }

type temporaryErrorListener struct {
	calls chan time.Time
}

func (l *temporaryErrorListener) Accept() (net.Conn, error) {
	l.calls <- time.Now()
	if len(l.calls) < cap(l.calls) {
		return nil, temporaryAcceptError{}
	}
	return nil, net.ErrClosed
}

func (*temporaryErrorListener) Close() error   { return nil }
func (*temporaryErrorListener) Addr() net.Addr { return testAddr("temporary-listener") }

type testAddr string

func (testAddr) Network() string  { return "test" }
func (a testAddr) String() string { return string(a) }
