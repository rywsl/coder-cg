package workspacessh

import (
	"errors"
	"io"
	"sync"

	"golang.org/x/crypto/ssh"
)

func proxyRequests(requests <-chan *ssh.Request, destination ssh.Conn, transform func(*ssh.Request) (bool, []byte, bool)) {
	go func() {
		for request := range requests {
			requestType, payload := request.Type, request.Payload
			if transform != nil {
				handled, transformed, ok := transform(request)
				if handled {
					if request.WantReply {
						_ = request.Reply(ok, nil)
					}
					continue
				}
				payload = transformed
			}
			ok, response, err := destination.SendRequest(requestType, request.WantReply, payload)
			if err != nil {
				if request.WantReply {
					_ = request.Reply(false, nil)
				}
				continue
			}
			if request.WantReply {
				_ = request.Reply(ok, response)
			}
		}
	}()
}

type channelQuota struct {
	slots chan struct{}
}

func newChannelQuota(limit int) *channelQuota {
	return &channelQuota{slots: make(chan struct{}, limit)}
}

func (q *channelQuota) acquire() bool {
	select {
	case q.slots <- struct{}{}:
		return true
	default:
		return false
	}
}

func (q *channelQuota) release() {
	<-q.slots
}

func proxyChannels(channels <-chan ssh.NewChannel, destination ssh.Conn, codex *CodexConfig, quota *channelQuota, rejected func()) <-chan struct{} {
	done := make(chan struct{})
	go func() {
		defer close(done)
		var wg sync.WaitGroup
		for incoming := range channels {
			if !quota.acquire() {
				_ = incoming.Reject(ssh.ResourceShortage, "workspace SSH channel limit reached")
				rejected()
				continue
			}
			wg.Go(func() {
				defer quota.release()
				proxyChannel(incoming, destination, codex)
			})
		}
		wg.Wait()
	}()
	return done
}

func proxyChannel(incoming ssh.NewChannel, destination ssh.Conn, codex *CodexConfig) {
	downstream, downstreamRequests, err := destination.OpenChannel(incoming.ChannelType(), incoming.ExtraData())
	if err != nil {
		reason := ssh.ConnectionFailed
		message := "target rejected channel"
		var openError *ssh.OpenChannelError
		if errors.As(err, &openError) {
			reason = openError.Reason
			message = openError.Message
		}
		_ = incoming.Reject(reason, message)
		return
	}
	upstream, upstreamRequests, err := incoming.Accept()
	if err != nil {
		_ = downstream.Close()
		return
	}

	var transform func(*ssh.Request) (bool, []byte, bool)
	if codex != nil && incoming.ChannelType() == "session" {
		transform = codex.transformRequest(downstream)
	}
	var replies sync.RWMutex
	upstreamRequestsDone := proxyChannelRequests(upstreamRequests, downstream, transform, &replies)
	downstreamRequestsDone := proxyChannelRequests(downstreamRequests, upstream, nil, &replies)
	copyChannel(upstream, downstream, upstreamRequestsDone, downstreamRequestsDone, &replies)
}

func proxyChannelRequests(requests <-chan *ssh.Request, destination ssh.Channel, transform func(*ssh.Request) (bool, []byte, bool), replies *sync.RWMutex) <-chan struct{} {
	done := make(chan struct{})
	go func() {
		defer close(done)
		for request := range requests {
			replies.RLock()
			payload := request.Payload
			if transform != nil {
				handled, transformed, ok := transform(request)
				if handled {
					if request.WantReply {
						_ = request.Reply(ok, nil)
					}
					replies.RUnlock()
					continue
				}
				payload = transformed
			}
			ok, err := destination.SendRequest(request.Type, request.WantReply, payload)
			if err != nil {
				ok = false
			}
			if request.WantReply {
				_ = request.Reply(ok, nil)
			}
			replies.RUnlock()
		}
	}()
	return done
}

func copyChannel(first, second ssh.Channel, firstRequestsDone, secondRequestsDone <-chan struct{}, replies *sync.RWMutex) {
	var wg sync.WaitGroup
	wg.Add(2)
	go copyChannelDirection(&wg, second, first, firstRequestsDone, replies)
	go copyChannelDirection(&wg, first, second, secondRequestsDone, replies)
	wg.Wait()
}

func copyChannelDirection(wg *sync.WaitGroup, destination, source ssh.Channel, requestsDone <-chan struct{}, replies *sync.RWMutex) {
	defer wg.Done()
	var streams sync.WaitGroup
	streams.Add(2)
	go copyStream(&streams, destination, source)
	go copyStream(&streams, destination.Stderr(), source.Stderr())
	streams.Wait()
	_ = destination.CloseWrite()
	// EOF only half-closes a channel. Once its requests also close, forward
	// the full close after draining output and requests such as exit-status.
	<-requestsDone
	// A fast exec may send EOF before its success reply reaches the client.
	replies.Lock()
	_ = destination.Close()
	replies.Unlock()
}

func copyStream(wg *sync.WaitGroup, destination io.Writer, source io.Reader) {
	defer wg.Done()
	_, _ = io.Copy(destination, source)
}
