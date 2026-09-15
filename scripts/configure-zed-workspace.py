#!/usr/bin/env python3
"""Keep a Rust workspace's caches outside Zed's file discovery."""

import json
import pathlib
import sys

project = pathlib.Path(sys.argv[1]).resolve(strict=True)
if not (project / "Cargo.toml").is_file():
    raise SystemExit("The project must contain Cargo.toml")

for root in dict.fromkeys([pathlib.Path.home(), project]):
    settings_path = root / ".zed" / "settings.json"
    settings = json.loads(settings_path.read_text()) if settings_path.exists() else {}
    exclusions = settings.setdefault("file_scan_exclusions", [])
    for pattern in ["**/.git", "**/node_modules", "**/target", "**/.cache", "**/.cargo", "**/.rustup", "**/.local/share/zed", "**/.codex"]:
        if pattern not in exclusions:
            exclusions.append(pattern)
    rust = settings.setdefault("lsp", {}).setdefault("rust-analyzer", {}).setdefault("initialization_options", {})
    rust["linkedProjects"] = [str(project / "Cargo.toml")]
    rust.setdefault("cargo", {})["targetDir"] = str(project / "target" / "rust-analyzer")
    settings_path.parent.mkdir(parents=True, exist_ok=True)
    settings_path.write_text(json.dumps(settings, ensure_ascii=False, indent=2) + "\n")
    print(f"Configured {settings_path}")
