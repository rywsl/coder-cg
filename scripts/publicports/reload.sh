#!/usr/bin/env bash
# Validate and reload a prepared private FRP configuration before replacing it.
set -euo pipefail
frpc=${1:?frpc binary required}
current=${2:?current configuration required}
candidate=${3:?candidate configuration required}
[[ -f $current && -f $candidate && $current != "$candidate" ]]
"$frpc" verify -c "$candidate"
staged=$(mktemp "${current}.XXXXXX")
trap 'rm -f "$staged"' EXIT
chmod 600 "$staged"
cp "$candidate" "$staged"
if ! "$frpc" reload -c "$staged" --api-timeout 10s; then
	"$frpc" reload -c "$current" --api-timeout 10s
	exit 1
fi
if ! mv "$staged" "$current"; then
	"$frpc" reload -c "$current" --api-timeout 10s
	exit 1
fi
