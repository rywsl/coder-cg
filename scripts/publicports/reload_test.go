package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestFRPReloadPreservesConfiguration(t *testing.T) {
	t.Parallel()
	for _, state := range []string{"valid", "invalid", "reload-fails"} {
		t.Run(state, func(t *testing.T) {
			t.Parallel()
			dir := t.TempDir()
			current := filepath.Join(dir, "current.toml")
			candidate := filepath.Join(dir, "candidate.toml")
			fake := filepath.Join(dir, "frpc")
			require.NoError(t, os.WriteFile(current, []byte("original"), 0o600))
			require.NoError(t, os.WriteFile(candidate, []byte(state), 0o600))
			require.NoError(t, os.WriteFile(fake, []byte(`#!/usr/bin/env bash
set -euo pipefail
content=$(<"$3")
if [[ $1 == verify && $content == invalid ]]; then exit 1; fi
if [[ $1 == reload && $content == reload-fails ]]; then exit 1; fi
`), 0o600))
			require.NoError(t, os.Chmod(fake, 0o700))
			command := exec.CommandContext(t.Context(), "bash", "reload.sh", fake, current, candidate)
			output, err := command.CombinedOutput()
			if state == "valid" {
				require.NoError(t, err, "%s", output)
			} else {
				require.Error(t, err)
			}
			content, err := os.ReadFile(current)
			require.NoError(t, err)
			if state == "valid" {
				require.Equal(t, state, string(content))
			} else {
				require.Equal(t, "original", string(content))
			}
		})
	}
}
