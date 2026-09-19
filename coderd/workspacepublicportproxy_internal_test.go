package coderd

import (
	"context"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"golang.org/x/xerrors"

	"cdr.dev/slog/v3/sloggers/slogtest"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/codersdk"
	"github.com/coder/coder/v2/testutil"
	"github.com/coder/websocket"
)

func TestPublicPortProxySanitizesHeaders(t *testing.T) {
	t.Parallel()
	received := make(chan *http.Request, 1)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		received <- r.Clone(context.Background())
		w.Header().Add("Set-Cookie", codersdk.SessionTokenCookie+"=malicious; Path=/")
		w.Header().Add("Set-Cookie", "app=ok; Path=/")
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(upstream.Close)
	m := newWorkspacePublicPortManager(nil, slogtest.Make(t, nil), nil)
	m.dial = func(ctx context.Context, _ database.WorkspacePublicPortMapping) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "tcp", upstream.Listener.Addr().String())
	}
	mapping := database.WorkspacePublicPortMapping{ID: uuid.New(), Protocol: "http", PublicPort: 18000, RemotePort: 5173}
	request := httptest.NewRequest(http.MethodGet, "http://hostile.example/assets/app.js?q=1", nil)
	request.Header.Set("X-Forwarded-For", "127.0.0.1")
	request.Header.Set("X-Forwarded-Host", "management.example")
	request.Header.Set("X-Forwarded-Proto", "http")
	request.Header.Set("Forwarded", "host=management.example")
	request.Header.Set(codersdk.SessionTokenHeader, "secret")
	request.Header.Set("Cookie", codersdk.SessionTokenCookie+"=secret; app=ok; csrf_token=secret")
	response := httptest.NewRecorder()
	m.handler(mapping).ServeHTTP(response, request)
	require.Equal(t, http.StatusOK, response.Code)
	r := <-received
	require.Equal(t, "/assets/app.js?q=1", r.URL.RequestURI())
	require.Equal(t, "127.0.0.1:5173", r.Host)
	require.Empty(t, r.Header.Get("Forwarded"))
	require.Empty(t, r.Header.Get("X-Forwarded-Host"))
	require.Empty(t, r.Header.Get(codersdk.SessionTokenHeader))
	require.NotContains(t, r.Header.Get("Cookie"), "secret")
	require.Equal(t, []string{"app=ok; Path=/"}, response.Header().Values("Set-Cookie"))
}

func TestPublicPortWebSocketRevocationAndRestore(t *testing.T) {
	t.Parallel()
	ctx := testutil.Context(t, testutil.WaitLong)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := websocket.Accept(w, r, nil)
		if err != nil {
			return
		}
		defer conn.CloseNow()
		for {
			kind, data, err := conn.Read(r.Context())
			if err != nil {
				return
			}
			if conn.Write(r.Context(), kind, data) != nil {
				return
			}
		}
	}))
	t.Cleanup(upstream.Close)
	m := newWorkspacePublicPortManager(nil, slogtest.Make(t, nil), nil)
	t.Cleanup(func() { _ = m.Close(ctx) })
	m.dial = func(ctx context.Context, _ database.WorkspacePublicPortMapping) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "tcp", upstream.Listener.Addr().String())
	}
	var address string
	m.listen = func(_, _ string) (net.Listener, error) {
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err == nil {
			address = listener.Addr().String()
		}
		return listener, err
	}
	row := database.WorkspacePublicPortMapping{ID: uuid.New(), PublicPort: 18000, RemotePort: 5173, Protocol: "http"}
	load := func(context.Context) ([]database.WorkspacePublicPortMapping, error) {
		return []database.WorkspacePublicPortMapping{row}, nil
	}
	m.reconcile(ctx, load)
	require.True(t, m.Running(row))
	conn, response, err := websocket.Dial(ctx, "ws://"+address+"/hmr?q=1", nil)
	if response != nil && response.Body != nil {
		defer response.Body.Close()
	}
	require.NoError(t, err)
	defer conn.CloseNow()
	require.NoError(t, conn.Write(ctx, websocket.MessageText, []byte("hot update")))
	_, data, err := conn.Read(ctx)
	require.NoError(t, err)
	require.Equal(t, "hot update", string(data))
	m.Remove(row.PublicPort)
	_, _, err = conn.Read(ctx)
	require.Error(t, err)
	require.Empty(t, m.capacity)
	require.False(t, m.Running(row))
	m.reconcile(ctx, load)
	require.True(t, m.Running(row))
	m.reconcile(ctx, func(context.Context) ([]database.WorkspacePublicPortMapping, error) {
		return nil, xerrors.New("database unavailable")
	})
	require.False(t, m.Running(row))
	m.reconcile(ctx, load)
	require.True(t, m.Running(row))
	require.NoError(t, m.Close(ctx))
	require.Error(t, m.Add(ctx, row))
}

func TestPublicPortHTTPAndProbe(t *testing.T) {
	t.Parallel()
	ctx := testutil.Context(t, testutil.WaitLong)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/redirect" {
			http.Redirect(w, r, "http://localhost:5173/assets/app.js?q=2", http.StatusFound)
			return
		}
		_, _ = io.WriteString(w, r.URL.RequestURI())
	}))
	t.Cleanup(upstream.Close)
	m := newWorkspacePublicPortManager(nil, slogtest.Make(t, nil), nil)
	m.externalHost = "212.64.22.217"
	m.dial = func(ctx context.Context, _ database.WorkspacePublicPortMapping) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "tcp", upstream.Listener.Addr().String())
	}
	row := database.WorkspacePublicPortMapping{ID: uuid.New(), PublicPort: 18000, RemotePort: 5173, Protocol: "http"}
	require.NoError(t, m.probe(ctx, row))
	for _, path := range []string{"/", "/assets/app.js?q=1", "/api/data?query=%E4%B8%AD%E6%96%87"} {
		response := httptest.NewRecorder()
		m.handler(row).ServeHTTP(response, httptest.NewRequest(http.MethodGet, path, nil))
		require.Equal(t, http.StatusOK, response.Code)
		require.Equal(t, path, response.Body.String())
	}
	response := httptest.NewRecorder()
	m.handler(row).ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/redirect", nil))
	require.Equal(t, "https://212.64.22.217:18000/assets/app.js?q=2", response.Header().Get("Location"))
	m.validate = func(context.Context, database.WorkspacePublicPortMapping) error { return xerrors.New("revoked") }
	response = httptest.NewRecorder()
	m.handler(row).ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/", nil))
	require.Equal(t, http.StatusServiceUnavailable, response.Code)
}

func TestPublicPortListenerCapacityAndBindFailure(t *testing.T) {
	t.Parallel()
	ctx := testutil.Context(t, testutil.WaitLong)
	m := newWorkspacePublicPortManager(nil, slogtest.Make(t, nil), nil)
	m.listen = func(string, string) (net.Listener, error) { return nil, xerrors.New("occupied") }
	row := database.WorkspacePublicPortMapping{ID: uuid.New(), PublicPort: 18000, RemotePort: 5173, Protocol: "http"}
	require.Error(t, m.Add(ctx, row))
	require.False(t, m.Running(row))
	m.listen = func(string, string) (net.Listener, error) { return net.Listen("tcp", "127.0.0.1:0") }
	m.capacity = make(chan struct{}, 1)
	require.NoError(t, m.Add(ctx, row))
	m.mu.Lock()
	address := m.servers[row.PublicPort].listener.Addr().String()
	m.mu.Unlock()
	conn, err := net.DialTimeout("tcp", address, time.Second)
	require.NoError(t, err)
	t.Cleanup(func() { _ = conn.Close() })
	require.Eventually(t, func() bool { return len(m.capacity) == 1 }, testutil.WaitShort, testutil.IntervalFast)
	excess, err := net.DialTimeout("tcp", address, time.Second)
	require.NoError(t, err)
	defer excess.Close()
	require.NoError(t, excess.SetReadDeadline(time.Now().Add(testutil.WaitShort)))
	_, err = excess.Read(make([]byte, 1))
	require.ErrorIs(t, err, io.EOF)
	canceled, cancel := context.WithCancel(ctx)
	cancel()
	_ = m.Close(canceled)
	_, err = conn.Read(make([]byte, 1))
	require.Error(t, err)
	require.Empty(t, m.capacity)
}

func TestPublicPortRejectsInternalPorts(t *testing.T) {
	t.Parallel()
	for _, port := range []int32{0, 22, 2222, 65536} {
		require.False(t, validWorkspacePublicPort(port))
	}
	require.True(t, validWorkspacePublicPort(5173))
}
