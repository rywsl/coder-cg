"use strict";
const http = require("node:http");
const net = require("node:net");

// Connect before giving HTTP any socket, so failed dials never replay a request.
class LoopbackAgent extends http.Agent {
	createConnection(options, callback) {
		const port = Number(options.port);
		if (!Number.isInteger(port) || port < 1 || port > 65535) {
			callback(new Error("无效的预览端口"));
			return;
		}
		const hosts = ["127.0.0.1", "::1"];
		const attempt = () => {
			const host = hosts.shift();
			const socket = net.connect({ host, port });
			const failed = (error) => {
				socket.removeAllListeners("connect");
				socket.destroy();
				if (hosts.length) attempt();
				else callback(error);
			};
			socket.setTimeout(1500, () => socket.destroy(new Error("预览连接超时")));
			socket.once("error", failed);
			socket.once("connect", () => {
				socket.removeListener("error", failed);
				socket.setTimeout(0);
				callback(null, socket);
			});
		};
		attempt();
	}
}
module.exports = { LoopbackAgent };
