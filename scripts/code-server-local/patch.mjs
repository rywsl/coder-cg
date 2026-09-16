import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2];
if (!root) throw new Error("usage: node patch.mjs code-server-distribution");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (pkg.version !== "4.137.0") throw new Error("Only code-server 4.137.0 has been reviewed for this patch");
const proxyPath = path.join(root, "out/node/proxy.js");
const original = "http_proxy_1.default.createProxyServer({})";
const replacement = 'http_proxy_1.default.createProxyServer({ agent: new (require("./loopback-agent.cjs").LoopbackAgent)() })';
const source = fs.readFileSync(proxyPath, "utf8");
if (!source.includes(original) && !source.includes(replacement)) throw new Error("Unexpected proxy implementation; refusing to patch");
fs.copyFileSync(fileURLToPath(new URL("./loopback-agent.cjs", import.meta.url)), path.join(root, "out/node/loopback-agent.cjs"));
fs.writeFileSync(proxyPath, source.replace(original, replacement));
for (const name of ["pathProxy", "domainProxy"]) {
	const file = path.join(root, `out/node/routes/${name}.js`);
	const contents = fs.readFileSync(file, "utf8");
	if (!contents.includes("http://0.0.0.0:") && !contents.includes("http://localhost:")) throw new Error(`Unexpected ${name} target`);
	fs.writeFileSync(file, contents.replaceAll("http://0.0.0.0:", "http://localhost:"));
}
