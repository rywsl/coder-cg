// Command publicports generates the fixed public preview ingress configuration.
package main

import (
	"flag"
	"fmt"
	"net"
	"os"
	"strings"

	"golang.org/x/xerrors"
)

func main() {
	mode := flag.String("format", "frpc", "Output format: frpc or nginx")
	address := flag.String("ip", "212.64.22.217", "Public IPv4 address covered by the TLS certificate")
	flag.Parse()
	content, err := configuration(*mode, *address)
	if err != nil {
		_, _ = fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	_, _ = fmt.Fprint(os.Stdout, content)
}

func configuration(format, address string) (string, error) {
	ip := net.ParseIP(address)
	if ip == nil || ip.To4() == nil {
		return "", xerrors.New("expected a bare public IPv4 address")
	}
	var out strings.Builder
	switch format {
	case "frpc":
		for port := 18000; port <= 18099; port++ {
			_, _ = fmt.Fprintf(&out, "[[proxies]]\nname = \"workspace-public-%d\"\ntype = \"tcp\"\nlocalIP = \"127.0.0.1\"\nlocalPort = %d\nremotePort = %d\n\n", port, port, port+10000)
		}
	case "nginx":
		_, _ = out.WriteString("map $server_port $coder_public_backend {\n    default 0;\n")
		for port := 18000; port <= 18099; port++ {
			_, _ = fmt.Fprintf(&out, "    %d %d;\n", port, port+10000)
		}
		_, _ = out.WriteString("}\nserver {\n")
		for port := 18000; port <= 18099; port++ {
			_, _ = fmt.Fprintf(&out, "    listen %d ssl;\n", port)
		}
		_, _ = fmt.Fprintf(&out, "    server_name %s;\n", ip.String())
		_, _ = out.WriteString(`    ssl_certificate /etc/letsencrypt/live/coder-public-ip/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coder-public-ip/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    client_max_body_size 100m;
    access_log off;
    error_log /dev/null;
    location / {
        proxy_pass http://127.0.0.1:$coder_public_backend;
        proxy_http_version 1.1;
        proxy_set_header Host 127.0.0.1;
        proxy_set_header Forwarded "";
        proxy_set_header X-Forwarded-For "";
        proxy_set_header X-Forwarded-Host "";
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_connect_timeout 5s;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
        proxy_intercept_errors on;
        error_page 502 503 504 =503 /__coder_public_unavailable;
    }
    location = /__coder_public_unavailable {
        internal;
        charset utf-8;
        default_type text/plain;
        return 503 "公开服务暂时不可用，请检查工作区、分享状态和 FRP 连接。\n";
    }
}
`)
	default:
		return "", xerrors.Errorf("unsupported format %q", format)
	}
	return out.String(), nil
}
