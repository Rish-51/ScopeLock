"""
Model Seam and Adapters for ScopeLock Pipeline.
Decouples pipeline orchestration from specific LLM runtimes.
Source of truth: GLOSSARY.md 'Model Seam'.
"""

from typing import Any, Dict, List, Optional, Protocol, Tuple, Type, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class ModelClient(Protocol):
    """Protocol defining the language model seam."""

    async def chat_structured(
        self,
        messages: List[Dict[str, str]],
        response_model: Type[T],
        stage: str,
        attempt: int = 1,
        num_predict: int = 1500,
    ) -> Tuple[T, Dict[str, Any]]:
        """Executes a structured completion matching response_model."""
        ...

    @property
    def model_name(self) -> str:
        """Returns the active model name."""
        ...

    @property
    def context_window(self) -> int:
        """Returns the active context window in tokens."""
        ...


class OllamaModelAdapter:
    """Production adapter connecting to local Ollama via OllamaClient."""

    def __init__(self, ollama_client: Optional[Any] = None, default_model: Optional[str] = None):
        if ollama_client is not None:
            self.client = ollama_client
        else:
            from backend.core.ollama_client import OllamaClient
            self.client = OllamaClient(default_model=default_model)

    @property
    def model_name(self) -> str:
        return getattr(self.client, "default_model", "gemma4:e4b")

    @property
    def context_window(self) -> int:
        return getattr(self.client, "num_ctx", 16384)

    async def chat_structured(
        self,
        messages: List[Dict[str, str]],
        response_model: Type[T],
        stage: str,
        attempt: int = 1,
        num_predict: int = 1500,
    ) -> Tuple[T, Dict[str, Any]]:
        return await self.client.chat_structured(
            messages=messages,
            response_model=response_model,
            stage=stage,
            attempt=attempt,
            num_predict=num_predict,
        )


class FakeModelAdapter:
    """
    Deterministic in-memory fake model adapter for unit tests and CI.
    Allows testing the entire scoping pipeline in milliseconds without Ollama.
    """

    def __init__(
        self,
        model_name: str = "fake-gemma4:test",
        context_window: int = 16384,
        canned_responses: Optional[Dict[str, BaseModel]] = None,
    ):
        self._model_name = model_name
        self._context_window = context_window
        self.canned_responses = canned_responses or {}
        self.call_history: List[Dict[str, Any]] = []

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def context_window(self) -> int:
        return self._context_window

    def register_response(self, stage_prefix: str, response: BaseModel):
        """Register a canned response for a given stage."""
        self.canned_responses[stage_prefix] = response

    async def chat_structured(
        self,
        messages: List[Dict[str, str]],
        response_model: Type[T],
        stage: str,
        attempt: int = 1,
        num_predict: int = 1500,
    ) -> Tuple[T, Dict[str, Any]]:
        self.call_history.append({
            "stage": stage,
            "attempt": attempt,
            "response_model": response_model,
            "messages": messages,
        })

        # Match by exact stage name or prefix (e.g. 'requirements' matches 'requirements_chunk_1')
        for key, canned in self.canned_responses.items():
            if stage == key or stage.startswith(key):
                if isinstance(canned, response_model):
                    metrics = {
                        "input_tokens": 120,
                        "output_tokens": 80,
                        "total_tokens": 200,
                        "load_ms": 1.2,
                    }
                    return canned, metrics  # type: ignore

        # If no canned response registered, attempt to instantiate default model
        try:
            default_inst = response_model.model_construct()
            return default_inst, {"input_tokens": 50, "output_tokens": 50, "total_tokens": 100, "load_ms": 0.5}
        except Exception:
            raise ValueError(f"No fake canned response registered for stage '{stage}' ({response_model.__name__})")
