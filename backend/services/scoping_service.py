"""
ScopeLock Scoping Service Adapter.
Maintains backward compatibility for existing callers by delegating to ScopingPipeline.
Source of truth: GLOSSARY.md 'Scoping Pipeline'.
"""

from typing import Optional
from backend.core.parser import ParsedDocument
from backend.core.ollama_client import OllamaClient
from backend.schemas.proposal import ScopeLockProposal
from backend.pipeline import (
    ScopingPipeline,
    BriefInput,
    PipelineOptions,
    OllamaModelAdapter,
)


class ScopingService:
    """
    Adapter preserving the legacy ScopingService interface
    while delegating all execution to the deep ScopingPipeline.
    """

    def __init__(self, ollama_client: Optional[OllamaClient] = None):
        self.ollama = ollama_client or OllamaClient()
        self.pipeline = ScopingPipeline(model_client=OllamaModelAdapter(ollama_client=self.ollama))

    async def analyze_document(
        self,
        doc: ParsedDocument,
        hourly_rate: float = 120.0,
        currency: str = "USD",
        contingency_percent: int = 20,
    ) -> ScopeLockProposal:
        """Analyzes a parsed document via the deep ScopingPipeline."""
        return await self.pipeline.scope(
            input=BriefInput(parsed_doc=doc, filename=doc.filename),
            options=PipelineOptions(
                hourly_rate=hourly_rate,
                currency=currency,
                contingency_percent=contingency_percent,
            ),
        )
