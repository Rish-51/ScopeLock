"""
ScopeLock Configuration.
Reads settings from environment variables with safe defaults.
"""

import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseModel):
    # Model runtime
    ollama_host: str = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
    scopelock_model: str = os.getenv("SCOPELOCK_MODEL", "gemma4:e4b")
    scopelock_num_ctx: int = int(os.getenv("SCOPELOCK_NUM_CTX", "4096"))

    # Sentry Telemetry (Metadata-only; empty means telemetry disabled)
    sentry_dsn: str = os.getenv("SENTRY_DSN", "").strip()
    telemetry_enabled: bool = os.getenv("TELEMETRY_ENABLED", "true").lower() == "true"

    # Server configuration
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    max_file_size_mb: int = int(os.getenv("MAX_FILE_SIZE_MB", "5"))

    # Config files
    multipliers_path: Path = BASE_DIR / "backend" / "config" / "multipliers.yaml"


settings = Settings()
