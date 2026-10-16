"""
Script to record authentic proposal scoping runs from local Gemma
and save them to frontend/public/demo/*.json for the hosted Render demo.
PLAN.md Section 8 & 9.
"""

import sys
import json
import asyncio
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.core.parser import parse_document
from backend.services.scoping_service import ScopingService
from backend.core.ollama_client import OllamaClient
from backend.core.tracing import trace_session, get_current_trace

DEMO_DIR = ROOT_DIR / "frontend" / "public" / "demo"
BRIEFS_DIR = ROOT_DIR / "backend" / "tests" / "sample_briefs"


async def record_brief_run(brief_file: Path, output_file: Path, model: str = "gemma4:e4b"):
    print(f"[*] Processing '{brief_file.name}' with model '{model}'...")
    raw_bytes = brief_file.read_bytes()
    doc = parse_document(raw_bytes, brief_file.name)

    client = OllamaClient(default_model=model)
    service = ScopingService(ollama_client=client)

    with trace_session():
        proposal = await service.analyze_document(
            doc=doc,
            hourly_rate=120.0,
            currency="USD",
            contingency_percent=20,
        )
        trace = get_current_trace()

    payload = {
        "proposal": proposal.model_dump(),
        "trace": trace,
        "brief_text": doc.text,
        "char_count": doc.char_count,
        "estimated_tokens": doc.estimated_tokens,
        "is_chunked": doc.is_chunked,
    }

    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    output_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"[+] Saved recorded demo run to '{output_file}' ({len(trace)} spans)")


async def main():
    target_brief = BRIEFS_DIR / "01_mobile_pets_mvp.md"
    out_file = DEMO_DIR / "01_mobile_pets_mvp.json"

    if not target_brief.exists():
        print(f"Error: {target_brief} does not exist.")
        return

    try:
        await record_brief_run(target_brief, out_file)
    except Exception as e:
        print(f"Recording failed: {e}")
        print("Note: ensure Ollama is running and gemma4:e4b (or chosen model) is pulled.")


if __name__ == "__main__":
    asyncio.run(main())
