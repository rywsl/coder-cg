const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const { once } = require("node:events");
const { LoopbackAgent } = require("./loopback-agent.cjs");

test("IPv6-only HTTP preserves Vite root paths", async (t) => {
	const server = http.createServer((req, res) => { assert.equal(req.url, "/@vite/client"); res.end("vite"); });
	server.listen(0, "::1");
	await once(server, "listening");
	t.after(() => server.close());
	const agent = new LoopbackAgent();
	t.after(() => agent.destroy());
	const request = http.get({ host: "localhost", port: server.address().port, path: "/@vite/client", agent });
	const [response] = await once(request, "response");
	let body = "";
	for await (const chunk of response) body += chunk;
	assert.equal(body, "vite");
});

test("IPv6-only WebSocket upgrade retains the socket", async (t) => {
	const server = http.createServer();
	server.on("upgrade", (_, socket) => socket.end("HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n"));
	server.listen(0, "::1");
	await once(server, "listening");
	t.after(() => server.close());
	const agent = new LoopbackAgent();
	t.after(() => agent.destroy());
	const request = http.get({ host: "localhost", port: server.address().port, headers: { Connection: "Upgrade", Upgrade: "websocket" }, agent });
	const [response, socket] = await once(request, "upgrade");
	assert.equal(response.statusCode, 101);
	socket.destroy();
});
