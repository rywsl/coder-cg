package localconnect_test

import (
	"context"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/ssh"

	"github.com/coder/coder/v2/localconnect"
)

func TestForwardReportsChannelCapacity(t *testing.T) {
	t.Parallel()
	forward, err := localconnect.Listen(t.Context(), 0, func(context.Context) (net.Conn, error) {
		return nil, &ssh.OpenChannelError{Reason: ssh.ResourceShortage, Message: "channel limit"}
	})
	require.NoError(t, err)
	t.Cleanup(forward.Close)
	client, err := net.DialTimeout("tcp", net.JoinHostPort("127.0.0.1", strconv.Itoa(int(forward.Port()))), time.Second)
	require.NoError(t, err)
	defer client.Close()
	require.NoError(t, client.SetReadDeadline(time.Now().Add(time.Second)))
	_, err = client.Read(make([]byte, 1))
	require.ErrorIs(t, err, io.EOF)
	require.Equal(t, "capacity", forward.ErrorCode())
}

func TestForwardIPv6AndPortConflict(t *testing.T) {
	t.Parallel()
	listener, err := net.Listen("tcp6", "[::1]:0")
	if err != nil {
		t.Skipf("IPv6 unavailable: %v", err)
	}
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/@vite/client", r.URL.Path)
		_, _ = io.WriteString(w, "hot reload")
	}))
	server.Listener = listener
	server.Start()
	t.Cleanup(server.Close)
	port := listener.Addr().(*net.TCPAddr).AddrPort().Port()
	occupied, err := net.Listen("tcp4", "127.0.0.1:0")
	require.NoError(t, err)
	t.Cleanup(func() { _ = occupied.Close() })
	preferred := occupied.Addr().(*net.TCPAddr).AddrPort().Port()
	forward, err := localconnect.Listen(t.Context(), preferred, func(ctx context.Context) (net.Conn, error) {
		return localconnect.DialLoopback(ctx, (&net.Dialer{}).DialContext, port)
	})
	require.NoError(t, err)
	t.Cleanup(forward.Close)
	require.NotEqual(t, preferred, forward.Port())
	client := &http.Client{Timeout: 3 * time.Second}
	req, err := http.NewRequestWithContext(t.Context(), http.MethodGet, "http://"+net.JoinHostPort("127.0.0.1", strconv.Itoa(int(forward.Port())))+"/@vite/client", nil)
	require.NoError(t, err)
	resp, err := client.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()
	contents, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	require.Equal(t, "hot reload", string(contents))
}

func TestForwardCloseClosesConnections(t *testing.T) {
	t.Parallel()
	connected := make(chan net.Conn, 1)
	forward, err := localconnect.Listen(t.Context(), 0, func(context.Context) (net.Conn, error) {
		client, server := net.Pipe()
		connected <- server
		return client, nil
	})
	require.NoError(t, err)
	t.Cleanup(forward.Close)
	client, err := net.DialTimeout("tcp", net.JoinHostPort("127.0.0.1", strconv.Itoa(int(forward.Port()))), time.Second)
	require.NoError(t, err)
	t.Cleanup(func() { _ = client.Close() })
	var remote net.Conn
	select {
	case remote = <-connected:
	case <-time.After(3 * time.Second):
		t.Fatal("forward did not connect")
	}
	t.Cleanup(func() { _ = remote.Close() })
	forward.Close()
	_, err = remote.Read(make([]byte, 1))
	require.Error(t, err)
	_, err = net.DialTimeout("tcp", net.JoinHostPort("127.0.0.1", strconv.Itoa(int(forward.Port()))), time.Second)
	require.Error(t, err)
}

func TestForwardAvoidsIPv6PortConflict(t *testing.T) {
	t.Parallel()
	occupied, err := net.Listen("tcp6", "[::1]:0")
	if err != nil {
		t.Skipf("IPv6 unavailable: %v", err)
	}
	t.Cleanup(func() { _ = occupied.Close() })
	preferred := occupied.Addr().(*net.TCPAddr).AddrPort().Port()
	forward, err := localconnect.Listen(t.Context(), preferred, func(context.Context) (net.Conn, error) {
		return nil, io.EOF
	})
	require.NoError(t, err)
	t.Cleanup(forward.Close)
	require.NotEqual(t, preferred, forward.Port())
}

func TestForwardPreservesHalfClose(t *testing.T) {
	t.Parallel()
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	require.NoError(t, err)
	t.Cleanup(func() { _ = listener.Close() })
	done := make(chan error, 1)
	go func() {
		conn, err := listener.Accept()
		if err != nil {
			done <- err
			return
		}
		defer conn.Close()
		_ = conn.SetDeadline(time.Now().Add(5 * time.Second))
		_, err = io.ReadAll(conn)
		if err == nil {
			_, err = io.WriteString(conn, "response after EOF")
		}
		done <- err
	}()
	forward, err := localconnect.Listen(t.Context(), 0, func(ctx context.Context) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "tcp", listener.Addr().String())
	})
	require.NoError(t, err)
	t.Cleanup(forward.Close)
	conn, err := net.DialTimeout("tcp", net.JoinHostPort("127.0.0.1", strconv.Itoa(int(forward.Port()))), time.Second)
	require.NoError(t, err)
	t.Cleanup(func() { _ = conn.Close() })
	require.NoError(t, conn.SetDeadline(time.Now().Add(5*time.Second)))
	_, err = io.WriteString(conn, "request")
	require.NoError(t, err)
	require.NoError(t, conn.(*net.TCPConn).CloseWrite())
	response, err := io.ReadAll(conn)
	require.NoError(t, err)
	require.Equal(t, "response after EOF", string(response))
	require.NoError(t, <-done)
}
