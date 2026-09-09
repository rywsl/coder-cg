---
title: Workspace SSH Gateway
---

The Workspace SSH Gateway lets system OpenSSH clients connect to Coder
workspace agents through `coderd`. It is available in the Community edition
and does not require Coder Premium, a workspace proxy, the Coder CLI, Coder
Desktop, or MCP.

Coder can use this gateway to open a workspace in ChatGPT Desktop. The user
runs a one-time setup command on their local device. After setup, the **Open in
ChatGPT** action starts ChatGPT Desktop with the workspace agent's expanded
directory as the project path.

> [!IMPORTANT]
> Linux ChatGPT Desktop `26.901.51231` is the tested baseline for this release.
> The private deep link is not a stable public interface. Validate the flow
> again after a ChatGPT Desktop upgrade. macOS and Windows are not validated
> for this release.

## Prerequisites

Before you enable the gateway:

- Configure the Coder access URL with HTTPS. The gateway does not start when
  the access URL uses HTTP.
- Expose a dedicated TCP port from every `coderd` replica. The default listen
  address is `0.0.0.0:2222`.
- Configure one public DNS name, IPv4 address, or IPv6 address for SSH clients.
  DNS names must be ASCII or Punycode.
- Install a controlled Codex CLI version in the workspace template. The
  workspace agent's login shell must find `codex` on `PATH`.
- Configure an upstream that supports the OpenAI Responses API.

The gateway accepts only Linux agents from the latest workspace build that are
connected and ready. It does not start stopped workspaces.

## Create the host key

Create a dedicated Ed25519 host key on the Coder control plane:

```console
sudo install -d -m 0700 /etc/coder
sudo ssh-keygen -q -t ed25519 -N '' \
  -f /etc/coder/workspace_ssh_host_ed25519_key
sudo chmod 0600 /etc/coder/workspace_ssh_host_ed25519_key
```

Every `coderd` replica must read the same private host key. Keep the file at
mode `0600`; startup fails when the key is accessible by a group or other
users. Rotating this key changes the fingerprint trusted by enrolled devices.

## Configure the gateway

Add the gateway configuration to the Coder deployment:

```yaml
networking:
  workspaceSSHGateway:
    enabled: true
    listenAddress: "0.0.0.0:2222"
    advertiseHost: "ssh.example.com"
    advertisePort: 2222
    hostKeyFile: "/etc/coder/workspace_ssh_host_ed25519_key"
    codexBaseURL: "https://responses.example.com/v1"
    codexModel: "example-model"
```

Provide the upstream API key through a secret environment variable:

```shell
CODER_WORKSPACE_SSH_GATEWAY_CODEX_API_KEY=your-api-key
```

Do not store the API key in the YAML configuration. See the
[configuration reference](../setup/configuration-reference.md#workspace-ssh-gateway)
for all connection, authentication, and channel limits.

Allow clients to reach the advertised host on TCP port `2222`. The HTTPS
access URL remains responsible for enrollment, while the dedicated TCP port
carries SSH traffic.

> [!WARNING]
> Coder injects the configured API key only into matching remote
> `codex app-server` process environments. It does not write the key to Codex
> configuration files or command arguments. Users who can run a shell in the
> workspace can inspect process environments and may be able to read the key.

## Set up ChatGPT Desktop

From a running workspace, locate a connected and ready Linux agent and select
**Open in ChatGPT**. On the first use, Coder displays a Bash setup command.
Run it once on the Linux device.

The command:

1. Creates a dedicated Ed25519 client key.
1. Adds a bounded entry to `~/.ssh/config` with `ProxyCommand none`.
1. Writes the gateway host key to a dedicated `known_hosts` file.
1. Registers the public key with a single-use enrollment token.
1. Opens ChatGPT Desktop for the selected SSH alias and project path.

Running the setup command again is idempotent and reuses the dedicated key.
The generated `ProxyCommand none` setting keeps the gateway alias independent
from entries created by `coder config-ssh`.

After enrollment, other running workspaces need only the **Open in ChatGPT**
action. If the private deep link does not open, use the displayed SSH alias and
project path in ChatGPT Desktop's Connections settings.

## Access controls

The gateway authorizes every connection against the current user and
`workspace:ssh` permission. Paused users and revoked keys cannot connect.
Enabling Browser Only dynamically blocks gateway connections and new ChatGPT
Desktop setup. Users can still revoke registered SSH devices from the agent
action menu when a workspace is stopped or Browser Only is enabled.

The gateway transparently proxies standard SSH shells, commands, PTYs, SFTP,
and port forwarding. Only the recognized ChatGPT Desktop `codex app-server`
command receives the configured model and Responses provider settings.
Unrecognized app-server wrappers are rejected instead of using an unintended
upstream.
