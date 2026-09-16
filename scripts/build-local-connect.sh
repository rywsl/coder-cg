#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
output=${1:?usage: build-local-connect.sh output-directory}
mkdir -p "$output"
version=${2:-$(git rev-parse --short HEAD)}
for platform in linux darwin windows; do
	for arch in amd64 arm64; do
		name="coder-local-$platform-$arch"
		if [[ $platform == windows ]]; then name+=.exe; fi
		CGO_ENABLED=0 GOOS="$platform" GOARCH="$arch" go build -trimpath -ldflags='-s -w' -o "$output/$name" ./cmd/coder-local
	done
done
node - "$output" "$version" <<'JS'
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const [output, version] = process.argv.slice(2);
const artifacts = fs.readdirSync(output).filter(name => /^coder-local-(linux|darwin|windows)-(amd64|arm64)(\.exe)?$/.test(name)).sort().map(name => {
  const [, , os, arch] = name.replace(/\.exe$/, "").split("-");
  return { os, arch, name, sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(output, name))).digest("hex") };
});
fs.writeFileSync(path.join(output, "manifest.json"), JSON.stringify({ version, artifacts }, null, 2) + "\n");
JS
