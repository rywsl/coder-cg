// Package localconnect connects local loopback ports to workspace services.
package localconnect

import (
	"context"
	"errors"
	"io"
	"net"
	"net/netip"
	"strconv"
	"sync"
	"syscall"
	"time"

	"golang.org/x/xerrors"
)

// DialLoopback tries both address families before sending application data.
func DialLoopback(ctx context.Context, dial func(context.Context, string, string) (net.Conn, error), port uint16) (net.Conn, error) {
	var errs []error
	for _, host := range []string{"127.0.0.1", "::1"} {
		attempt, cancel := context.WithTimeout(ctx, 3*time.Second)
		conn, err := dial(attempt, "tcp", net.JoinHostPort(host, strconv.Itoa(int(port))))
		cancel()
		if err == nil {
			return conn, nil
		}
		errs = append(errs, err)
		if ctx.Err() != nil {
			break
		}
	}
	return nil, errors.Join(errs...)
}

// Forward owns local listeners and all connections accepted by them.
type Forward struct {
	port        uint16
	cancel      context.CancelFunc
	listeners   []net.Listener
	mu          sync.Mutex
	connections map[net.Conn]struct{}
	closed      bool
	wg          sync.WaitGroup
	once        sync.Once
}

// Listen binds loopback listeners, choosing another port if preferred is busy.
func Listen(ctx context.Context, preferred uint16, dial func(context.Context) (net.Conn, error)) (*Forward, error) {
	listener, err := net.Listen("tcp4", net.JoinHostPort("127.0.0.1", strconv.Itoa(int(preferred))))
	if err != nil && preferred != 0 {
		listener, err = net.Listen("tcp4", "127.0.0.1:0")
	}
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithCancel(ctx)
	address, err := netip.ParseAddrPort(listener.Addr().String())
	if err != nil {
		_ = listener.Close()
		cancel()
		return nil, err
	}
	f := &Forward{port: address.Port(), cancel: cancel, listeners: []net.Listener{listener}, connections: make(map[net.Conn]struct{})}
	// A different service on ::1 must never receive requests for our localhost URL.
	for range 8 {
		v6, err := net.Listen("tcp6", net.JoinHostPort("::1", strconv.Itoa(int(f.port))))
		if err == nil {
			f.listeners = append(f.listeners, v6)
			break
		}
		if errors.Is(err, syscall.EAFNOSUPPORT) || errors.Is(err, syscall.EADDRNOTAVAIL) || errors.Is(err, syscall.EPROTONOSUPPORT) {
			break
		}
		_ = f.listeners[0].Close()
		listener, err = net.Listen("tcp4", "127.0.0.1:0")
		if err != nil {
			cancel()
			return nil, err
		}
		f.listeners[0] = listener
		address, err = netip.ParseAddrPort(listener.Addr().String())
		if err != nil {
			_ = listener.Close()
			cancel()
			return nil, err
		}
		f.port = address.Port()
	}
	if len(f.listeners) == 1 {
		// Verify the IPv6 family is actually unavailable, not merely occupied.
		probe, err := net.Listen("tcp6", "[::1]:0")
		if err == nil {
			_ = probe.Close()
			_ = f.listeners[0].Close()
			cancel()
			return nil, xerrors.New("unable to reserve both loopback address families")
		}
	}
	for _, listener := range f.listeners {
		f.wg.Go(func() { f.accept(ctx, listener, dial) })
	}
	context.AfterFunc(ctx, f.Close)
	return f, nil
}

// Port returns the actual local port.
func (f *Forward) Port() uint16 { return f.port }

func (f *Forward) track(conn net.Conn) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.closed {
		_ = conn.Close()
		return false
	}
	f.connections[conn] = struct{}{}
	return true
}

func (f *Forward) release(conn net.Conn) {
	_ = conn.Close()
	f.mu.Lock()
	delete(f.connections, conn)
	f.mu.Unlock()
}

func (f *Forward) accept(ctx context.Context, listener net.Listener, dial func(context.Context) (net.Conn, error)) {
	// Bound accepted sockets as well as downstream SSH channels.
	slots := make(chan struct{}, 64)
	for {
		conn, err := listener.Accept()
		if err != nil {
			return
		}
		select {
		case slots <- struct{}{}:
		default:
			_ = conn.Close()
			continue
		}
		if !f.track(conn) {
			<-slots
			return
		}
		f.wg.Go(func() {
			defer func() { <-slots }()
			defer f.release(conn)
			remote, err := dial(ctx)
			if err != nil {
				return
			}
			if !f.track(remote) {
				return
			}
			defer f.release(remote)
			done := make(chan struct{})
			go func() {
				_, _ = io.Copy(remote, conn)
				if half, ok := remote.(interface{ CloseWrite() error }); ok {
					_ = half.CloseWrite()
				} else {
					_ = remote.Close()
				}
				close(done)
			}()
			_, _ = io.Copy(conn, remote)
			if half, ok := conn.(interface{ CloseWrite() error }); ok {
				_ = half.CloseWrite()
			} else {
				_ = conn.Close()
			}
			<-done
		})
	}
}

// Close cancels pending dials and waits for every accepted socket to close.
func (f *Forward) Close() {
	f.once.Do(func() {
		f.cancel()
		f.mu.Lock()
		f.closed = true
		for _, listener := range f.listeners {
			_ = listener.Close()
		}
		for conn := range f.connections {
			_ = conn.Close()
		}
		f.mu.Unlock()
		f.wg.Wait()
	})
}
