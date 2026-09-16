package main

import (
	"encoding/xml"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

func installAutostart(executable string) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(home, "Library", "LaunchAgents")
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return err
	}
	var escaped strings.Builder
	if err := xml.EscapeText(&escaped, []byte(executable)); err != nil {
		return err
	}
	contents := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>Label</key><string>com.coder.local</string><key>ProgramArguments</key><array><string>%s</string></array><key>RunAtLoad</key><true/><key>KeepAlive</key><true/></dict></plist>`+"\n", escaped.String())
	path := filepath.Join(dir, "com.coder.local.plist")
	if err := writePrivate(path, []byte(contents)); err != nil {
		return err
	}
	domain := "gui/" + strconv.Itoa(os.Getuid())
	_ = exec.Command("launchctl", "bootout", domain+"/com.coder.local").Run()
	return exec.Command("launchctl", "bootstrap", domain, path).Run()
}
