package main

import (
	"os/exec"
	"syscall"
)

func installAutostart(executable string) error {
	command := exec.Command("schtasks.exe", "/Create", "/TN", "CoderLocalConnect", "/SC", "ONLOGON", "/TR", syscall.EscapeArg(executable), "/RL", "LIMITED", "/F")
	if err := command.Run(); err != nil {
		return err
	}
	return exec.Command("schtasks.exe", "/Run", "/TN", "CoderLocalConnect").Run()
}
