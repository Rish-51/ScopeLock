"""
Gate 0 Smoke Test Script.
Source of truth: PLAN.md Section 11, Gate 0:
1. Verify Ollama is reachable and model is available.
2. Confirm structured output returns schema-valid JSON.
3. If SENTRY_DSN is configured, emit one manual gen_ai.chat span per Section 5.1/5.2.
"""

import asyncio
import os
import sys
from pathlib import Path

# Ensure real-time line buffered console output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.core.config import settings
from backend.core.ollama_client import OllamaClient
from backend.core.tracing import init_sentry, traced
from backend.schemas.proposal import RequirementsResult, ComplexityTag


async def run_smoke_test():
    print(f"[Gate 0] Checking Ollama host: {settings.ollama_host}")
    client = OllamaClient()

    health = await client.check_health()
    if not health.get("reachable"):
        print(f"[Gate 0] ERROR: Ollama is unreachable: {health.get('error')}")
        print("Please ensure Ollama is installed and running (`ollama serve`).")
        return False

    models = health.get("models", [])
    print(f"[Gate 0] Ollama is reachable! Found models: {models}")

    target_model = settings.scopelock_model
    print(f"[Gate 0] Target model: {target_model}")

    # Check if target model is pulled
    model_names = [m.split(":")[0] for m in models] + models
    if target_model not in models and target_model.split(":")[0] not in model_names:
        print(f"[Gate 0] WARNING: Model '{target_model}' not found in `ollama list`.")
        print(f"Please run: `ollama pull {target_model}` (or fallback model per Section 14).")

    # Initialize Sentry if configured
    if settings.sentry_dsn:
        print("[Gate 0] Initializing Sentry for Agent Tracing...")
        init_sentry(settings.sentry_dsn)
    else:
        print("[Gate 0] SENTRY_DSN not set. Running in offline/metadata-local mode.")

    # Test prompt for structured output
    test_brief = "Client needs a React and Python application with Stripe payment checkout."
    messages = [
        {
            "role": "system",
            "content": "You are ScopeLock Scoper. Extract requirements matching the schema exactly. Copy quotes character-for-character.",
        },
        {
            "role": "user",
            "content": f"Extract requirements from this brief:\n\n{test_brief}",
        },
    ]

    print("[Gate 0] Sending structured chat test request to Ollama...")
    try:
        result, metrics = await client.chat_structured(
            messages=messages,
            response_model=RequirementsResult,
            stage="smoke_test",
            attempt=1,
        )

        print("[Gate 0] SUCCESS: Received schema-valid structured response!")
        print(f"Project Title: {result.project_title}")
        print(f"Requirements count: {len(result.requirements)}")
        print(f"Metrics: tokens={metrics['total_tokens']} (in={metrics['input_tokens']}, out={metrics['output_tokens']}), load_ms={metrics['load_ms']}")

        # Validate types
        assert isinstance(result, RequirementsResult), "Result must be RequirementsResult instance"
        print("[Gate 0] Pydantic schema validation PASSED.")
        return True

    except Exception as e:
        import traceback
        print(f"[Gate 0] Structured chat failed: {repr(e)}")
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(run_smoke_test())
    sys.exit(0 if success else 1)
