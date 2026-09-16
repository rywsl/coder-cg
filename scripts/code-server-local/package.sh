#!/usr/bin/env bash
set -euo pipefail
distribution=${1:?usage: package.sh code-server-distribution output-directory}
output=${2:?output directory required}
script_dir=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$output"
work=$(mktemp -d "$output/.package.XXXXXX")
trap 'rm -rf "$work"' EXIT
cp -a "$distribution" "$work/code-server"
node "$script_dir/patch.mjs" "$work/code-server"
node --test "$script_dir/loopback-agent.test.cjs"
node --test "$script_dir/patch-module.test.mjs"
tar --sort=name --mtime='UTC 2026-09-16' --owner=0 --group=0 --numeric-owner -C "$work" -czf "$output/code-server-local-4.137.0-linux-amd64.tar.gz" code-server
(
	cd "$output"
	sha256sum code-server-local-4.137.0-linux-amd64.tar.gz >code-server.sha256
)
cp "$script_dir/install.sh" "$output/install-code-server.sh"
if [[ -n ${3:-} ]]; then
	actual=$(sha256sum "$3" | cut -d ' ' -f 1)
	test "$actual" = '0c98df253b3fc6495b7e60352495245c13454a1fa93b0c7afc727251d1c8e24d'
	mkdir "$work/module"
	tar -xzf "$3" -C "$work/module"
	node "$script_dir/patch-module.mjs" "$work/module"
	tar --sort=name --mtime='UTC 2026-09-16' --owner=0 --group=0 --numeric-owner -C "$work/module" -czf "$output/code-server-module-1.5.0-local.tar.gz" .
fi
