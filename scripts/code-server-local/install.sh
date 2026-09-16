#!/usr/bin/env bash
set -euo pipefail
base=${1:?Coder HTTPS access URL required}
case "$base" in https://*) ;; *)
	echo '必须使用 HTTPS 地址' >&2
	exit 1
	;;
esac
test "$(uname -sm)" = 'Linux x86_64'
runtime="$HOME/.local/share/coder/code-server-local/4.137.0"
mkdir -p "$runtime" "$HOME/.local/bin"
work=$(mktemp -d "$runtime/.install.XXXXXX")
trap 'rm -rf "$work"' EXIT
curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' "$base/api/v2/local-connect/download/code-server.sha256" -o "$work/code-server.sha256"
digest=$(cut -d ' ' -f 1 "$work/code-server.sha256")
case "$digest" in *[!a-f0-9]* | '') exit 1 ;; esac
test "${#digest}" = 64
if [[ -x "$runtime/$digest/bin/code-server" ]]; then
	ln -sfn "$runtime/$digest/bin/code-server" "$HOME/.local/bin/code-server"
	exit 0
fi
curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' "$base/api/v2/local-connect/download/code-server-local-4.137.0-linux-amd64.tar.gz" -o "$work/code-server-local-4.137.0-linux-amd64.tar.gz"
(
	cd "$work"
	sha256sum --check code-server.sha256
	tar -xzf code-server-local-4.137.0-linux-amd64.tar.gz
)
# Install immutable releases. The stable link switches only after verification.
if [[ ! -d "$runtime/$digest" ]]; then mv "$work/code-server" "$runtime/$digest"; fi
ln -sfn "$runtime/$digest/bin/code-server" "$HOME/.local/bin/code-server"
