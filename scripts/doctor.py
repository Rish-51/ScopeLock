#!/usr/bin/env python3
"""
ScopeLock Environment Doctor & Pre-Flight Diagnostics.
Runs a comprehensive check on Python, virtual environment, dependencies,
Ollama daemon, local Gemma models, Node.js frontend, and server ports.
Usage:
    python scripts/doctor.py
"""

import sys
import os
import shutil
import socket
import subprocess
from pathlib import Path
from typing import Tuple, List, Dict, Any

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# ANSI Color codes for Windows & Unix terminals
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
BOLD = "\033[1m"
RESET = "\033[0m"

def print_header(title: str):
    print(f"\n{BOLD}{BLUE}=== {title} ==={RESET}")

def print_result(label: str, status: str, detail: str = ""):
    if status == "PASS":
        badge = f"{GREEN}[PASS]{RESET}"
    elif status == "WARN":
        badge = f"{YELLOW}[WARN]{RESET}"
    else:
        badge = f"{RED}[FAIL]{RESET}"
    
    if detail:
        print(f"  {badge} {label}: {detail}")
    else:
        print(f"  {badge} {label}")

def check_port(host: str, port: int, timeout: float = 0.5) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

def check_python_environment() -> Tuple[int, int]:
    print_header("1. Python & Virtual Environment")
    passes, fails = 0, 0
    
    # Python Version
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    if sys.version_info >= (3, 10):
        print_result("Python Version", "PASS", f"{py_ver} (>= 3.10 required)")
        passes += 1
    else:
        print_result("Python Version", "FAIL", f"{py_ver} (Python 3.10+ required)")
        fails += 1

    # Virtual Environment
    in_venv = (sys.prefix != sys.base_prefix) or ("VIRTUAL_ENV" in os.environ)
    if in_venv:
        print_result("Virtual Environment", "PASS", f"Active ({sys.prefix})")
        passes += 1
    else:
        print_result("Virtual Environment", "WARN", "Not running inside a virtualenv (.venv recommended)")

    # Core Dependencies
    required_pkgs = [
        ("fastapi", "FastAPI"),
        ("pydantic", "Pydantic"),
        ("httpx", "HTTPX"),
        ("pypdf", "PyPDF"),
        ("sentry_sdk", "Sentry SDK"),
        ("cryptography", "Cryptography (AES-256 Storage)"),
        ("pytest", "Pytest"),
    ]
    
    missing_pkgs = []
    for mod_name, label in required_pkgs:
        try:
            __import__(mod_name)
        except ImportError:
            missing_pkgs.append(label)
    
    if not missing_pkgs:
        print_result("Python Dependencies", "PASS", "All required packages installed")
        passes += 1
    else:
        print_result("Python Dependencies", "FAIL", f"Missing: {', '.join(missing_pkgs)}. Run: pip install -r backend/requirements.txt")
        fails += 1

    return passes, fails

def check_ollama() -> Tuple[int, int]:
    print_header("2. Local Ollama & Gemma Models")
    passes, fails = 0, 0
    
    # HTTP Reachability
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
    import urllib.request
    import json

    reachable = False
    models: List[str] = []
    try:
        req = urllib.request.Request(f"{ollama_host}/api/tags", headers={"User-Agent": "ScopeLock-Doctor"})
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            if resp.status == 200:
                reachable = True
                data = json.loads(resp.read().decode())
                models = [m.get("name", "") for m in data.get("models", [])]
    except Exception:
        reachable = False

    target_model = os.getenv("SCOPELOCK_MODEL", "gemma4:e4b")

    if reachable:
        print_result("Ollama Daemon", "PASS", f"Online at {ollama_host}")
        passes += 1
        
        # Check target model
        target_installed = any(target_model in m for m in models)
        gemma_installed = [m for m in models if "gemma" in m.lower()]
        
        if target_installed:
            print_result(f"Target Model ({target_model})", "PASS", "Installed and ready")
            passes += 1
        elif gemma_installed:
            print_result(f"Target Model ({target_model})", "WARN", f"Found alternatives: {', '.join(gemma_installed)}. Run: ollama pull {target_model}")
        else:
            print_result(f"Target Model ({target_model})", "WARN", f"No Gemma models found. Run: ollama pull {target_model}")
    else:
        print_result("Ollama Daemon", "WARN", f"Offline / Unreachable at {ollama_host}")
        # Check if ollama CLI is in PATH or Windows install dir
        ollama_bin = shutil.which("ollama")
        win_ollama_path = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Ollama" / "ollama.exe"
        if ollama_bin or win_ollama_path.exists():
            print("         * Ollama executable detected on disk. Start it by running: 'ollama serve'")
        else:
            print("         * Ollama executable not found. Download installer from: https://ollama.com/download")
        print("         * Note: ScopeLock UI includes an instant recorded-run demo mode that operates without Ollama.")

    return passes, fails

def check_frontend() -> Tuple[int, int]:
    print_header("3. Node.js & Frontend Tooling")
    passes, fails = 0, 0
    
    # Node.js
    node_bin = shutil.which("node")
    if node_bin:
        try:
            res = subprocess.run(["node", "--version"], capture_output=True, text=True, check=True)
            print_result("Node.js Runtime", "PASS", f"{res.stdout.strip()} ({node_bin})")
            passes += 1
        except Exception as e:
            print_result("Node.js Runtime", "WARN", f"Installed but execution error: {e}")
    else:
        print_result("Node.js Runtime", "WARN", "node not found in PATH")

    # frontend/node_modules
    frontend_dir = BASE_DIR / "frontend"
    node_modules = frontend_dir / "node_modules"
    if node_modules.exists() and any(node_modules.iterdir()):
        print_result("Frontend Dependencies", "PASS", "node_modules installed")
        passes += 1
    else:
        print_result("Frontend Dependencies", "WARN", "node_modules missing. Run: cd frontend && npm install")

    return passes, fails

def check_active_services() -> Tuple[int, int]:
    print_header("4. Local Service Ports & Privacy State")
    passes, fails = 0, 0
    
    # Port 8000 (Backend API)
    b_online = check_port("localhost", 8000) or check_port("127.0.0.1", 8000)
    if b_online:
        print_result("Backend Service (Port 8000)", "PASS", "FastAPI server is listening")
        passes += 1
    else:
        print_result("Backend Service (Port 8000)", "WARN", "No service on port 8000 (Start with: uvicorn backend.main:app --port 8000)")

    # Port 5173 (Frontend Dev)
    f_online = check_port("localhost", 5173) or check_port("127.0.0.1", 5173)
    if f_online:
        print_result("Frontend Service (Port 5173)", "PASS", "Vite dev server is listening")
        passes += 1
    else:
        print_result("Frontend Service (Port 5173)", "WARN", "No service on port 5173 (Start with: cd frontend && npm run dev)")

    # Telemetry State
    sentry_dsn = os.getenv("SENTRY_DSN", "").strip()
    telemetry_enabled = os.getenv("TELEMETRY_ENABLED", "true").lower() == "true" and bool(sentry_dsn)
    if not telemetry_enabled:
        print_result("Privacy Boundary", "PASS", "Offline Mode (SENTRY_DSN unset; ZERO network egress)")
        passes += 1
    else:
        print_result("Privacy Boundary", "PASS", "Metadata-Only Telemetry (SENTRY_DSN set; zero brief egress)")
        passes += 1

    return passes, fails

def main():
    print(f"\n{BOLD}ScopeLock System Health Doctor{RESET}")
    print("================================")
    
    total_passes = 0
    total_fails = 0
    
    p, f = check_python_environment()
    total_passes += p
    total_fails += f
    
    p, f = check_ollama()
    total_passes += p
    total_fails += f
    
    p, f = check_frontend()
    total_passes += p
    total_fails += f
    
    p, f = check_active_services()
    total_passes += p
    total_fails += f
    
    print("\n--------------------------------")
    if total_fails == 0:
        print(f"{BOLD}{GREEN}Result: Ready to run ScopeLock!{RESET} ({total_passes} checks passed)")
    else:
        print(f"{BOLD}{RED}Result: {total_fails} critical check(s) failed.{RESET} Please resolve them above.")
    print("--------------------------------\n")

if __name__ == "__main__":
    main()
