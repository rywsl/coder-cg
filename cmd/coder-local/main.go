// coder-local provides per-user localhost forwarding without a Coder CLI install.
package main

import (
	"bufio"
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"time"

	"github.com/gofrs/flock"
	"golang.org/x/crypto/ssh"
	"golang.org/x/term"
	"golang.org/x/xerrors"

	"github.com/coder/coder/v2/cli/sessionstore"
	"github.com/coder/coder/v2/codersdk"
	"github.com/coder/coder/v2/localconnect"
)

type state struct {
	URL   string            `json:"url"`
	Ports map[string]uint16 `json:"ports"`
}

func main() {
	if err := run(); err != nil {
		_, _ = fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	root, err := os.UserConfigDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(root, "coder-local")
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return err
	}
	if err := secureDirectory(dir); err != nil {
		return err
	}
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	setupRequested := len(os.Args) > 1 && os.Args[1] == "--setup"
	var settings state
	data, err := os.ReadFile(filepath.Join(dir, "state.json"))
	if errors.Is(err, os.ErrNotExist) || setupRequested {
		return setup(ctx, dir)
	}
	if err != nil {
		return err
	}
	if err := json.Unmarshal(data, &settings); err != nil {
		return err
	}
	if settings.Ports == nil {
		settings.Ports = map[string]uint16{}
	}
	lock := flock.New(filepath.Join(dir, "instance.lock"))
	ok, err := lock.TryLock()
	if err != nil {
		return err
	}
	if !ok {
		return xerrors.New("本地连接器已在运行")
	}
	defer func() { _ = lock.Unlock() }()
	base, err := url.Parse(settings.URL)
	if err != nil {
		return err
	}
	var secret string
	if runtime.GOOS == "linux" {
		data, err := os.ReadFile(filepath.Join(dir, "credentials.json"))
		if err != nil {
			return err
		}
		secret = string(data)
	} else {
		secret, err = sessionstore.NewKeyringWithService("coder-local-credentials").Read(base)
		if err != nil {
			return err
		}
	}
	var cfg localconnect.Config
	if err := json.Unmarshal([]byte(secret), &cfg); err != nil {
		return xerrors.New("设备凭据无效，请重新授权")
	}
	persist := func() error {
		data, err := json.Marshal(settings)
		if err != nil {
			return err
		}
		return writePrivate(filepath.Join(dir, "state.json"), data)
	}
	for ctx.Err() == nil {
		err := localconnect.Run(ctx, cfg, settings.Ports, persist, func(message string) { _, _ = fmt.Fprintln(os.Stderr, message) })
		if ctx.Err() != nil {
			return nil
		}
		if err != nil {
			_, _ = fmt.Fprintln(os.Stderr, err)
		}
		select {
		case <-ctx.Done():
			return nil
		case <-time.After(5 * time.Second):
		}
	}
	return nil
}

func setup(ctx context.Context, dir string) error {
	reader := bufio.NewReader(os.Stdin)
	read := func(prompt string) (string, error) {
		_, _ = fmt.Print(prompt)
		text, err := reader.ReadString('\n')
		return strings.TrimSpace(text), err
	}
	base, err := read("Coder 公网 HTTPS 地址：")
	if err != nil {
		return err
	}
	parsed, err := url.Parse(base)
	if err != nil || parsed.Scheme != "https" || parsed.Host == "" || parsed.User != nil || parsed.RawQuery != "" || parsed.Fragment != "" {
		return xerrors.New("请输入有效的 HTTPS 地址")
	}
	id, err := read("网页中显示的注册 ID：")
	if err != nil {
		return err
	}
	_, _ = fmt.Print("一次性授权码（输入不显示）：")
	var token string
	if term.IsTerminal(int(os.Stdin.Fd())) {
		secret, err := term.ReadPassword(int(os.Stdin.Fd()))
		if err != nil {
			return err
		}
		token = strings.TrimSpace(string(secret))
		_, _ = fmt.Println()
	} else {
		text, err := reader.ReadString('\n')
		if err != nil {
			return err
		}
		token = strings.TrimSpace(text)
	}
	_, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return err
	}
	signer, err := ssh.NewSignerFromKey(privateKey)
	if err != nil {
		return err
	}
	pemKey, err := ssh.MarshalPrivateKey(privateKey, "coder-local")
	if err != nil {
		return err
	}
	secret := make([]byte, 32)
	_, _ = rand.Read(secret)
	deviceToken := base64.RawURLEncoding.EncodeToString(secret)
	name, err := os.Hostname()
	if err != nil {
		name = runtime.GOOS
	}
	var registration codersdk.LocalConnectorRegistration
	if err := localconnect.APIRequest(ctx, base, "/api/v2/local-connect/enrollments/"+url.PathEscape(id), token, codersdk.LocalConnectorRegister{DeviceName: name, PublicKey: string(ssh.MarshalAuthorizedKey(signer.PublicKey())), Token: deviceToken}, &registration); err != nil {
		return err
	}
	if err := (codersdk.SSHConfigResponse{WorkspaceSSHGateway: &registration.Gateway}).Validate(); err != nil {
		return xerrors.New("SSH 网关配置无效")
	}
	cfg := localconnect.Config{URL: base, DeviceID: registration.Device.ID.String(), Token: deviceToken, PrivateKey: string(pem.EncodeToMemory(pemKey)), HostKey: registration.Gateway.HostPublicKey}
	encoded, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	if runtime.GOOS == "linux" {
		if err := writePrivate(filepath.Join(dir, "credentials.json"), encoded); err != nil {
			return err
		}
	} else if err := sessionstore.NewKeyringWithService("coder-local-credentials").Write(parsed, string(encoded)); err != nil {
		return err
	}
	settings, err := json.Marshal(state{URL: base, Ports: map[string]uint16{}})
	if err != nil {
		return err
	}
	if err := writePrivate(filepath.Join(dir, "state.json"), settings); err != nil {
		return err
	}
	current, err := os.Executable()
	if err != nil {
		return err
	}
	name = "coder-local"
	if runtime.GOOS == "windows" {
		name += ".exe"
	}
	installed := filepath.Join(dir, name)
	if current != installed {
		input, err := os.Open(current)
		if err != nil {
			return err
		}
		defer input.Close()
		output, err := os.CreateTemp(dir, ".coder-local-binary-*")
		if err != nil {
			return err
		}
		defer os.Remove(output.Name())
		_, copyErr := io.Copy(output, input)
		closeErr := output.Close()
		if err := errors.Join(copyErr, closeErr); err != nil {
			return err
		}
		if err := os.Chmod(output.Name(), 0o700); err != nil {
			return err
		}
		if err := os.Rename(output.Name(), installed); err != nil {
			return err
		}
	}
	if err := installAutostart(installed); err != nil {
		return xerrors.Errorf("设备已授权，但登录自启设置失败：%w。可运行已安装的 coder-local 重试连接", err)
	}
	_, _ = fmt.Println("设备已授权，连接器已后台启动。请返回 Coder 网页打开工作区。")
	return nil
}

func writePrivate(path string, contents []byte) error {
	temp, err := os.CreateTemp(filepath.Dir(path), ".coder-local-*")
	if err != nil {
		return err
	}
	defer os.Remove(temp.Name())
	if _, err := temp.Write(contents); err != nil {
		_ = temp.Close()
		return err
	}
	if err := temp.Close(); err != nil {
		return err
	}
	return os.Rename(temp.Name(), path)
}
