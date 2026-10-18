"""
ScopeLock Scoping Pipeline Package.
A deep module providing a single interface for turning client briefs into grounded, priced proposals.
Source of truth: GLOSSARY.md 'Scoping Pipeline'.
"""

from backend.pipeline.client import ModelClient, OllamaModelAdapter, FakeModelAdapter
from backend.pipeline.pipeline import ScopingPipeline, BriefInput, PipelineOptions

__all__ = [
    "ScopingPipeline",
    "BriefInput",
    "PipelineOptions",
    "ModelClient",
    "OllamaModelAdapter",
    "FakeModelAdapter",
]
