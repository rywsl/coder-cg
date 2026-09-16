import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("managed module never falls back to the upstream installer", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "coder-module-test-"));
	try {
		fs.writeFileSync(path.join(root, "main.tf"), "VERSION : var.install_version,\n");
		fs.writeFileSync(path.join(root, "run.sh"), `#!/usr/bin/env bash
CODE_SERVER="\${INSTALL_PREFIX}/bin/code-server"
# If there is no cached install OR we don't want to use a cached install
if [ "\${USE_CACHED}" != true ]; then
  curl -fsSL https://code-server.dev/install.sh | sh
fi
# Make the code-server available in PATH.
echo "$CODE_SERVER"
`);
		const patch = fileURLToPath(new URL("./patch-module.mjs", import.meta.url));
		execFileSync(process.execPath, [patch, root]);
		const script = fs.readFileSync(path.join(root, "run.sh"), "utf8");
		assert.doesNotMatch(script, /code-server\.dev|USE_CACHED/);
		assert.match(script, /CODE_SERVER="\$HOME\/\.local\/bin\/code-server"/);
		assert.match(script, /install-code-server\.sh/);
		execFileSync("bash", ["-n", path.join(root, "run.sh")]);
		execFileSync(process.execPath, [patch, root]);
		assert.equal(fs.readFileSync(path.join(root, "run.sh"), "utf8"), script);
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
});
