#!/usr/bin/env python3
"""Keep a Rust workspace's caches outside Zed's file discovery."""

import json
import os
import pathlib
import sys

project = pathlib.Path(sys.argv[1]).resolve(strict=True)
if not (project / "Cargo.toml").is_file():
    raise SystemExit("The project must contain Cargo.toml")

build_directories = [project / "target"]
for parent, directories, _ in os.walk(project):
    for name in directories[:]:
        if name in {"target", "node_modules", ".git"}:
            build_directories.append(pathlib.Path(parent) / name)
            directories.remove(name)

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
    files = rust.setdefault("files", {})
    files["watcher"] = "client"
    excluded_dirs = files.setdefault("exclude", [])
    for directory in files.pop("excludeDirs", []):
        if directory not in excluded_dirs:
            excluded_dirs.append(directory)
    for directory in build_directories:
        if str(directory) not in excluded_dirs:
            excluded_dirs.append(str(directory))
    settings_path.parent.mkdir(parents=True, exist_ok=True)
    settings_path.write_text(json.dumps(settings, ensure_ascii=False, indent=2) + "\n")
    print(f"Configured {settings_path}")
