"""
ScopeLock FastAPI Application.
Source of truth: PLAN.md Section 5.3, 6, 11 Gate 2.
Stateless backend providing:
  - GET  /health and /api/v1/health (truthful telemetry and model status)
  - POST /api/v1/scope/analyze (multipart file or text ingestion)
  - GET  /api/v1/multipliers (returns active pricing heuristics)
"""

from typing import Optional
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.core.config import settings
from backend.core.tracing import init_sentry, trace_session, get_current_trace
from backend.core.parser import parse_document
from backend.core.pricing import load_multipliers, DEFAULT_SCHEDULE
from backend.core.ollama_client import OllamaClient
from backend.services.scoping_service import ScopingService
from backend.schemas.proposal import ScopeLockProposal

# Initialize Sentry (metadata only, no-op if DSN empty)
init_sentry(settings.sentry_dsn)

app = FastAPI(
    title="ScopeLock API",
    description="NDA-safe local-first RFQ and proposal scoper for freelancers",
    version="0.1.0",
)

# CORS middleware for local frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
@app.get("/api/v1/health")
async def health_check():
    """
    Truthful privacy and runtime beacon.
    PLAN.md Section 6: Reads actual state: 'Offline: telemetry off' or 'Telemetry on: metadata only'.
    """
    telemetry_enabled = bool(settings.sentry_dsn)
    telemetry_state = "Telemetry on: metadata only" if telemetry_enabled else "Offline: telemetry off"

    ollama = OllamaClient()
    ollama_status = await ollama.check_health()

    return {
        "status": "ok",
        "model": settings.scopelock_model,
        "num_ctx": settings.scopelock_num_ctx,
        "telemetry_enabled": telemetry_enabled,
        "telemetry_state": telemetry_state,
        "ollama": ollama_status,
    }


@app.get("/api/v1/multipliers")
async def get_multipliers():
    """Returns active multiplier heuristics and default payment schedules."""
    multipliers = load_multipliers(settings.multipliers_path)
    return {
        "multipliers": multipliers,
        "defaults": {
            "hourly_rate": 120.0,
            "currency": "USD",
            "contingency_percent": 20,
            "payment_schedule": DEFAULT_SCHEDULE,
        },
    }


class AnalysisResponse(BaseModel):
    proposal: ScopeLockProposal
    trace: list
    char_count: int
    estimated_tokens: int
    is_chunked: bool


@app.post("/api/v1/scope/analyze", response_model=AnalysisResponse)
async def analyze_scope(
    file: Optional[UploadFile] = File(None),
    brief_text: Optional[str] = Form(None),
    hourly_rate: float = Form(120.0),
    currency: str = Form("USD"),
    contingency_percent: int = Form(20),
    model: Optional[str] = Form(None),
):
    """
    Analyzes an RFQ brief (uploaded file or pasted text).
    Zero client content is sent outside the machine.
    Returns the structured proposal and local trace spans for UI inspection.
    """
    if file:
        file_bytes = await file.read()
        filename = file.filename or "uploaded_brief.txt"
    elif brief_text:
        file_bytes = brief_text.encode("utf-8")
        filename = "pasted_brief.txt"
    else:
        raise HTTPException(
            status_code=400,
            detail="Either a file upload or brief_text must be provided.",
        )

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Provided brief content is empty.")

    doc = parse_document(
        file_bytes=file_bytes,
        filename=filename,
        num_ctx=settings.scopelock_num_ctx,
    )

    ollama = OllamaClient(default_model=model)
    service = ScopingService(ollama_client=ollama)

    try:
        with trace_session():
            proposal = await service.analyze_document(
                doc=doc,
                hourly_rate=hourly_rate,
                currency=currency,
                contingency_percent=contingency_percent,
            )
            traces = get_current_trace()

            return AnalysisResponse(
                proposal=proposal,
                trace=traces,
                char_count=doc.char_count,
                estimated_tokens=doc.estimated_tokens,
                is_chunked=doc.is_chunked,
            )
    except Exception as exc:
        # Guarantee no brief content leaks in exception details
        err_msg = f"Analysis pipeline error: {type(exc).__name__}: {str(exc)}"
        raise HTTPException(status_code=500, detail=err_msg)
