"""LLM provider service abstraction and implementations.

Canonical service per CONTRACT v0.3.1 §5.3, §11.1, §17.4.
Provides BaseLLMProvider, generate, generate_stream, health_check.
"""

import json
import logging
from collections.abc import Iterator
from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import LLMProviderUnavailableError, LLMTimeoutError

logger = logging.getLogger("app.services.llm_service")


class BaseLLMProvider:
    """Base class for all LLM providers per CONTRACT §11.1."""

    def provider_name(self) -> str:
        raise NotImplementedError

    def model_name(self) -> str:
        raise NotImplementedError

    def generate(self, messages: list[dict[str, Any]], **kwargs) -> str:
        raise NotImplementedError

    def generate_stream(self, messages: list[dict[str, Any]], **kwargs) -> Iterator[str]:
        raise NotImplementedError

    def health_check(self) -> bool:
        raise NotImplementedError


class DeterministicTestProvider(BaseLLMProvider):
    """Deterministic test provider for CI and offline development per CONTRACT §17.4."""

    def __init__(self, model: str | None = None) -> None:
        self._model = model or "test-model-v1"

    def provider_name(self) -> str:
        return "deterministic_test"

    def model_name(self) -> str:
        return self._model

    def generate(self, messages: list[dict[str, Any]], **kwargs) -> str:
        last_msg = messages[-1]["content"] if messages else ""
        preview = last_msg[:80]
        return f"Based on your knowledge base: Verified answer regarding: {preview}"

    def generate_stream(self, messages: list[dict[str, Any]], **kwargs) -> Iterator[str]:
        full_text = self.generate(messages, **kwargs)
        for word in full_text.split():
            yield word + " "

    def health_check(self) -> bool:
        return True


class OllamaLLMProvider(BaseLLMProvider):
    """Ollama local LLM provider."""

    def __init__(self, base_url: str | None = None, model: str | None = None) -> None:
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self._model = model or settings.LLM_MODEL

    def provider_name(self) -> str:
        return "ollama"

    def model_name(self) -> str:
        return self._model

    def generate(self, messages: list[dict[str, Any]], **kwargs) -> str:
        try:
            with httpx.Client(timeout=settings.PROVIDER_TIMEOUT_SECONDS) as client:
                res = client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self._model,
                        "messages": messages,
                        "stream": False,
                    },
                )
                if res.status_code != 200:
                    raise LLMProviderUnavailableError(
                        f"Ollama returned HTTP status {res.status_code}"
                    )
                data = res.json()
                return data.get("message", {}).get("content", "")
        except httpx.TimeoutException as e:
            raise LLMTimeoutError("LLM request timed out.") from e
        except httpx.RequestError as e:
            raise LLMProviderUnavailableError("LLM provider unreachable.") from e
        except Exception as e:
            raise LLMProviderUnavailableError("LLM generation failed.") from e

    def generate_stream(self, messages: list[dict[str, Any]], **kwargs) -> Iterator[str]:
        try:
            with httpx.Client(timeout=settings.PROVIDER_TIMEOUT_SECONDS) as client:
                with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self._model,
                        "messages": messages,
                        "stream": True,
                    },
                ) as response:
                    for line in response.iter_lines():
                        if line:
                            data = json.loads(line)
                            content = data.get("message", {}).get("content", "")
                            if content:
                                yield content
        except httpx.TimeoutException as e:
            raise LLMTimeoutError("LLM request timed out.") from e
        except Exception as e:
            raise LLMProviderUnavailableError("LLM streaming failed.") from e

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False


class OmniRouteLLMProvider(BaseLLMProvider):
    """OmniRoute LLM provider."""

    def __init__(self, base_url: str | None = None, model: str | None = None) -> None:
        self.base_url = (base_url or settings.OMNIROUTE_BASE_URL).rstrip("/")
        self._model = model or settings.LLM_MODEL

    def provider_name(self) -> str:
        return "omniroute"

    def model_name(self) -> str:
        return self._model

    def generate(self, messages: list[dict[str, Any]], **kwargs) -> str:
        if not self.base_url:
            raise LLMProviderUnavailableError("OmniRoute base URL is not configured.")
        try:
            with httpx.Client(timeout=settings.PROVIDER_TIMEOUT_SECONDS) as client:
                res = client.post(
                    f"{self.base_url}/chat/completions",
                    json={"model": self._model, "messages": messages},
                )
                if res.status_code != 200:
                    raise LLMProviderUnavailableError("OmniRoute request failed.")
                return res.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        except httpx.TimeoutException as e:
            raise LLMTimeoutError("OmniRoute request timed out.") from e
        except Exception as e:
            raise LLMProviderUnavailableError("OmniRoute provider unreachable.") from e

    def generate_stream(self, messages: list[dict[str, Any]], **kwargs) -> Iterator[str]:
        full_text = self.generate(messages, **kwargs)
        for chunk in full_text.split():
            yield chunk + " "

    def health_check(self) -> bool:
        if not self.base_url:
            return False
        try:
            with httpx.Client(timeout=3.0) as client:
                return client.get(f"{self.base_url}/health").status_code == 200
        except Exception:
            return False


def _auto_discover_freellmapi_key() -> str | None:
    """Helper to auto-discover local FreeLLMAPI unified key if running locally."""
    try:
        import sqlite3
        from pathlib import Path

        possible_paths = [
            Path("/home/rehan/freellmapi/server/data/freeapi.db"),
            Path("/app/freellmapi/server/data/freeapi.db"),
            Path.home() / "freellmapi/server/data/freeapi.db",
        ]
        for p in possible_paths:
            if p.exists():
                conn = sqlite3.connect(str(p))
                row = (
                    conn.cursor()
                    .execute("SELECT value FROM settings WHERE key = 'unified_api_key'")
                    .fetchone()
                )
                conn.close()
                if row and row[0]:
                    return str(row[0])
    except Exception:
        pass
    return None


RECOMMENDED_MODELS: list[dict[str, Any]] = [
    {
        "id": "auto",
        "name": "Auto-Route (Recommended)",
        "description": "Dynamic failover across fastest available upstream routes",
        "context_window": 131072,
    },
    {
        "id": "qwen2.5-coder-7b-instruct",
        "name": "Qwen 2.5 Coder 7B",
        "description": "Fast reasoning & structured outputs (131k context)",
        "context_window": 131072,
    },
    {
        "id": "gemma-3-4b-it",
        "name": "Gemma 3 4B IT",
        "description": "Google lightweight instruction model (131k context)",
        "context_window": 131072,
    },
    {
        "id": "phi-4",
        "name": "Phi-4",
        "description": "Microsoft compact model with strong grounding (16k context)",
        "context_window": 16384,
    },
    {
        "id": "command-r",
        "name": "Command R",
        "description": "Cohere model optimized for RAG and citations (131k context)",
        "context_window": 131072,
    },
]


class FreeLLMAPILMProvider(BaseLLMProvider):
    """FreeLLMAPI provider with real token streaming and health checking."""

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        raw_url = base_url or settings.FREELLMAPI_BASE_URL or "http://localhost:3001"
        self.base_url = raw_url.rstrip("/")
        self.api_key = api_key or settings.FREELLMAPI_API_KEY or _auto_discover_freellmapi_key()
        # Default to 'auto' for FreeLLMAPI dynamic routing if generic/empty model is set
        m = model or settings.LLM_MODEL
        self._model = "auto" if m in ("llama3.2", "default", "", None) else m

    def _endpoint(self, path: str) -> str:
        url = self.base_url.rstrip("/")
        if not url.endswith("/v1"):
            url += "/v1"
        return f"{url}/{path.lstrip('/')}"

    def provider_name(self) -> str:
        return "freellmapi"

    def model_name(self) -> str:
        return self._model

    def generate(self, messages: list[dict[str, Any]], **kwargs) -> str:
        if not self.base_url:
            raise LLMProviderUnavailableError("FreeLLMAPI base URL is not configured.")
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        try:
            with httpx.Client(timeout=settings.PROVIDER_TIMEOUT_SECONDS) as client:
                res = client.post(
                    self._endpoint("chat/completions"),
                    headers=headers,
                    json={"model": self._model, "messages": messages},
                )
                if res.status_code != 200:
                    raise LLMProviderUnavailableError(
                        f"FreeLLMAPI request failed with status {res.status_code}."
                    )
                return res.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        except httpx.TimeoutException as e:
            raise LLMTimeoutError("FreeLLMAPI request timed out.") from e
        except Exception as e:
            raise LLMProviderUnavailableError("FreeLLMAPI provider unreachable.") from e

    def generate_stream(self, messages: list[dict[str, Any]], **kwargs) -> Iterator[str]:
        """Real token streaming directly from FreeLLMAPI via SSE."""
        if not self.base_url:
            raise LLMProviderUnavailableError("FreeLLMAPI base URL is not configured.")
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        try:
            with httpx.Client(timeout=settings.PROVIDER_TIMEOUT_SECONDS) as client:
                with client.stream(
                    "POST",
                    self._endpoint("chat/completions"),
                    headers=headers,
                    json={"model": self._model, "messages": messages, "stream": True},
                ) as response:
                    if response.status_code != 200:
                        raise LLMProviderUnavailableError(
                            f"FreeLLMAPI streaming failed with status {response.status_code}."
                        )
                    for line in response.iter_lines():
                        if not line:
                            continue
                        if line.startswith("data: "):
                            raw_data = line[6:].strip()
                            if raw_data == "[DONE]":
                                break
                            try:
                                payload = json.loads(raw_data)
                                choices = payload.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
        except httpx.TimeoutException as e:
            raise LLMTimeoutError("FreeLLMAPI request timed out.") from e
        except Exception as e:
            raise LLMProviderUnavailableError(f"FreeLLMAPI streaming failed: {e}") from e

    def health_check(self) -> bool:
        if not self.base_url:
            return False
        try:
            with httpx.Client(timeout=3.0) as client:
                headers = {}
                if self.api_key:
                    headers["Authorization"] = f"Bearer {self.api_key}"
                    res = client.get(self._endpoint("models"), headers=headers)
                    if res.status_code == 200:
                        return True
                # Fallback to server ping
                res = client.get(f"{self.base_url}/api/auth/status")
                return res.status_code in (200, 404)
        except Exception:
            return False


def get_llm_provider(model: str | None = None) -> BaseLLMProvider:
    """Factory selecting provider based on LLM_PROVIDER or environment."""
    if settings.APP_ENV == "testing":
        return DeterministicTestProvider(model=model)

    p_name = settings.LLM_PROVIDER.lower()
    if p_name == "freellmapi":
        provider = FreeLLMAPILMProvider(model=model)
        if provider.health_check():
            return provider
        logger.warning(
            "FreeLLMAPI configured but unreachable at %s. Checking Ollama fallback.",
            provider.base_url,
        )
        ollama_provider = OllamaLLMProvider(model=model)
        if ollama_provider.health_check():
            return ollama_provider
        # Do NOT silently fake answers in normal usage
        raise LLMProviderUnavailableError(f"FreeLLMAPI is unreachable at {provider.base_url}.")

    if p_name == "ollama":
        provider = OllamaLLMProvider(model=model)
        if provider.health_check():
            return provider
        raise LLMProviderUnavailableError("Ollama provider is unreachable.")

    if p_name == "omniroute":
        provider = OmniRouteLLMProvider(model=model)
        if provider.health_check():
            return provider
        raise LLMProviderUnavailableError("OmniRoute provider is unreachable.")

    provider = FreeLLMAPILMProvider(model=model)
    if provider.health_check():
        return provider
    raise LLMProviderUnavailableError("No LLM provider is currently reachable.")


def generate(messages: list[dict[str, Any]], model: str | None = None, **kwargs) -> str:
    """Canonical generate function per CONTRACT §5.3."""
    provider = get_llm_provider(model=model)
    return provider.generate(messages, **kwargs)


def generate_stream(
    messages: list[dict[str, Any]], model: str | None = None, **kwargs
) -> Iterator[str]:
    """Canonical generate_stream function per CONTRACT §5.3."""
    provider = get_llm_provider(model=model)
    return provider.generate_stream(messages, **kwargs)


def health_check() -> bool:
    """Canonical health_check function per CONTRACT §5.3."""
    try:
        provider = get_llm_provider()
        return provider.health_check()
    except Exception:
        return False
