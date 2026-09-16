package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func installAutostart(executable string) error {
	root, err := os.UserConfigDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(root, "systemd", "user")
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return err
	}
	quoted := strings.NewReplacer("%", "%%", "$", "$$").Replace(executable)
	unit := fmt.Sprintf("[Unit]\nDescription=Coder local connector\n[Service]\nExecStart=%q\nRestart=on-failure\nRestartSec=5\n[Install]\nWantedBy=default.target\n", quoted)
	if err := writePrivate(filepath.Join(dir, "coder-local.service"), []byte(unit)); err != nil {
		return err
	}
	if err := exec.Command("systemctl", "--user", "daemon-reload").Run(); err != nil {
		return err
	}
	if err := exec.Command("systemctl", "--user", "enable", "coder-local.service").Run(); err != nil {
		return err
	}
	return exec.Command("systemctl", "--user", "restart", "coder-local.service").Run()
}
