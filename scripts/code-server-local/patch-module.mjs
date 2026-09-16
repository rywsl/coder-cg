import fs from "node:fs";
import path from "node:path";

// Input: registry.coder.com/download/coder/1.5.0-code-server.tar.gz.
const root = process.argv[2];
if (!root) throw new Error("usage: patch-module.mjs extracted-module-directory");
const mainPath = path.join(root, "main.tf");
const scriptPath = path.join(root, "run.sh");
let main = fs.readFileSync(mainPath, "utf8");
let script = fs.readFileSync(scriptPath, "utf8");
if (!main.includes("variable \"coder_access_url\"")) {
	main += '\nvariable "coder_access_url" {\n  type = string\n  description = "Coder public HTTPS URL for the managed local preview runtime."\n  validation {\n    condition = can(regex("^https://[A-Za-z0-9.:\\\\[\\\\]-]+$", var.coder_access_url))\n    error_message = "Use a bare HTTPS host and optional port without a path."\n  }\n}\n';
	main = main.replace('VERSION : var.install_version,', 'VERSION : var.install_version,\n    CODER_LOCAL_ACCESS_URL : var.coder_access_url,');
	const line = 'CODE_SERVER="${INSTALL_PREFIX}/bin/code-server"';
	if (!script.includes(line)) throw new Error("Unexpected code-server 1.5.0 module");
	const installStart = script.indexOf("# If there is no cached install OR we don't want to use a cached install");
	const installEnd = script.indexOf("# Make the code-server available in PATH.");
	if (installStart < 0 || installEnd <= installStart) throw new Error("Unexpected upstream installation block");
	// Only the checksum-verified managed distribution may supply this runtime.
	script = script.slice(0, installStart) + script.slice(installEnd);
	script = script.replace(line, `installer=$(mktemp)
trap 'rm -f "$installer"' EXIT
curl --fail --silent --show-error --proto '=https' '\${CODER_LOCAL_ACCESS_URL}/api/v2/local-connect/download/install-code-server.sh' -o "$installer" || exit 1
bash "$installer" '\${CODER_LOCAL_ACCESS_URL}' || exit 1
CODE_SERVER="$HOME/.local/bin/code-server"`);
	fs.writeFileSync(mainPath, main);
	fs.writeFileSync(scriptPath, script);
}
