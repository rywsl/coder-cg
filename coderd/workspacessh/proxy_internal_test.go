package workspacessh

import (
	"bytes"
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/coder/coder/v2/testutil"
)

func TestGatewaySessionClosesWithOpenStdin(t *testing.T) {
	t.Parallel()
	for _, command := range []string{"exec", "shell"} {
		t.Run(command, func(t *testing.T) {
			t.Parallel()
			gateway, client, _ := newConnectedTestGateway(t)
			t.Cleanup(func() {
				_ = client.Close()
				ctx, cancel := context.WithTimeout(context.Background(), testutil.WaitLong)
				defer cancel()
				require.NoError(t, gateway.Close(ctx))
			})
			session, err := client.NewSession()
			require.NoError(t, err)
			stdin, err := session.StdinPipe()
			require.NoError(t, err)
			defer stdin.Close()
			var stdout, stderr bytes.Buffer
			session.Stdout = &stdout
			session.Stderr = &stderr
			if command == "exec" {
				require.NoError(t, session.Start("printf hello"))
			} else {
				require.NoError(t, session.Shell())
			}
			done := make(chan error, 1)
			go func() { done <- session.Wait() }()
			ctx := testutil.Context(t, testutil.WaitShort)
			select {
			case err := <-done:
				require.NoError(t, err)
			case <-ctx.Done():
				t.Fatal("remote session did not close while client stdin remained open")
			}
			if command == "exec" {
				require.Equal(t, "stdout:printf hello\n", stdout.String())
				require.Equal(t, "stderr:printf hello\n", stderr.String())
			} else {
				require.Equal(t, "shell ready\n", stdout.String())
			}
		})
	}
}
