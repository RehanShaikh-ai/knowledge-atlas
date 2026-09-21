"""Embedding provider service.

Canonical service per CONTRACT v0.3.1 §5.3, §7.4.
Provides get_embedding and get_embeddings_batch.
"""

import hashlib
import logging
from typing import Protocol

import httpx

from app.core.config import settings
from app.core.exceptions import (
    EmbeddingDimensionMismatchError,
    EmbeddingProviderUnavailableError,
)

logger = logging.getLogger("app.services.embedding_service")


class EmbeddingProvider(Protocol):
    """Protocol for embedding providers."""

    def embed(self, texts: list[str]) -> list[list[float]]: ...


class FastEmbedProvider:
    """Local FastEmbed embedding provider."""

    def __init__(self, model_name: str | None = None) -> None:
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from fastembed import TextEmbedding

                self._model = TextEmbedding(model_name=self.model_name)
            except Exception as e:
                logger.error("Failed to initialize FastEmbed: %s", e)
                raise EmbeddingProviderUnavailableError(
                    f"FastEmbed provider unavailable: {e}"
                ) from e
        return self._model

    def embed(self, texts: list[str]) -> list[list[float]]:
        try:
            model = self._get_model()
            embeddings_generator = model.embed(texts)
            return [list(map(float, emb)) for emb in embeddings_generator]
        except EmbeddingProviderUnavailableError:
            raise
        except Exception as e:
            logger.error("FastEmbed embedding failed: %s", e)
            raise EmbeddingProviderUnavailableError(f"Embedding provider failed: {e}") from e


class OllamaEmbeddingProvider:
    """Ollama embedding provider via HTTP API."""

    def __init__(self, base_url: str | None = None, model: str | None = None) -> None:
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.EMBEDDING_MODEL

    def embed(self, texts: list[str]) -> list[list[float]]:
        results: list[list[float]] = []
        try:
            with httpx.Client(timeout=settings.PROVIDER_TIMEOUT_SECONDS) as client:
                for text in texts:
                    res = client.post(
                        f"{self.base_url}/api/embeddings",
                        json={"model": self.model, "prompt": text},
                    )
                    if res.status_code != 200:
                        raise EmbeddingProviderUnavailableError(
                            f"Ollama returned HTTP {res.status_code}"
                        )
                    data = res.json()
                    results.append(data["embedding"])
        except httpx.RequestError as e:
            raise EmbeddingProviderUnavailableError(f"Ollama unreachable: {e}") from e
        except Exception as e:
            raise EmbeddingProviderUnavailableError(f"Embedding error: {e}") from e
        return results


class DeterministicTestEmbeddingProvider:
    """Deterministic embedding provider for testing and offline development."""

    def __init__(self, dimension: int | None = None) -> None:
        self.dimension = dimension or settings.EMBEDDING_DIMENSION

    def embed(self, texts: list[str]) -> list[list[float]]:
        results: list[list[float]] = []
        for text in texts:
            # Deterministic pseudo-embedding from text hash
            h = hashlib.sha256(text.encode("utf-8")).digest()
            vec: list[float] = []
            for i in range(self.dimension):
                b = h[i % len(h)]
                vec.append(float((b - 128) / 128.0))
            # Normalize vector
            norm = sum(x * x for x in vec) ** 0.5 or 1.0
            results.append([round(x / norm, 6) for x in vec])
        return results


def _get_provider() -> EmbeddingProvider:
    provider_name = settings.EMBEDDING_PROVIDER.lower()
    if settings.APP_ENV == "testing" or provider_name == "test":
        return DeterministicTestEmbeddingProvider()
    if provider_name == "ollama":
        return OllamaEmbeddingProvider()
    try:
        import fastembed  # noqa: F401

        return FastEmbedProvider()
    except (ImportError, Exception):
        return DeterministicTestEmbeddingProvider()


def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts.

    Validates dimension against settings.EMBEDDING_DIMENSION per CONTRACT §7.4.
    """
    if not texts:
        return []
    provider = _get_provider()
    embeddings = provider.embed(texts)
    expected_dim = settings.EMBEDDING_DIMENSION
    for emb in embeddings:
        if len(emb) != expected_dim:
            raise EmbeddingDimensionMismatchError(
                f"Embedding dimension {len(emb)} != expected {expected_dim}"
            )
    return embeddings


def get_embedding(text: str) -> list[float]:
    """Generate an embedding for a single text.

    Validates dimension against settings.EMBEDDING_DIMENSION per CONTRACT §7.4.
    """
    results = get_embeddings_batch([text])
    return results[0]
