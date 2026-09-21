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


class FreeLLMAPILMProvider(BaseLLMProvider):
    """FreeLLMAPI provider."""

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        self.base_url = (base_url or settings.FREELLMAPI_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.FREELLMAPI_API_KEY
        self._model = model or settings.LLM_MODEL

    def provider_name(self) -> str:
        return "freellmapi"

    def model_name(self) -> str:
        return self._model

    def generate(self, messages: list[dict[str, Any]], **kwargs) -> str:
        if not self.base_url:
            raise LLMProviderUnavailableError("FreeLLMAPI base URL is not configured.")
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        try:
            with httpx.Client(timeout=settings.PROVIDER_TIMEOUT_SECONDS) as client:
                res = client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json={"model": self._model, "messages": messages},
                )
                if res.status_code != 200:
                    raise LLMProviderUnavailableError("FreeLLMAPI request failed.")
                return res.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        except httpx.TimeoutException as e:
            raise LLMTimeoutError("FreeLLMAPI request timed out.") from e
        except Exception as e:
            raise LLMProviderUnavailableError("FreeLLMAPI provider unreachable.") from e

    def generate_stream(self, messages: list[dict[str, Any]], **kwargs) -> Iterator[str]:
        full_text = self.generate(messages, **kwargs)
        for chunk in full_text.split():
            yield chunk + " "

    def health_check(self) -> bool:
        return bool(self.base_url)


def get_llm_provider() -> BaseLLMProvider:
    """Factory selecting provider based on LLM_PROVIDER or environment."""
    if settings.APP_ENV == "testing":
        return DeterministicTestProvider()

    p_name = settings.LLM_PROVIDER.lower()
    if p_name == "ollama":
        return OllamaLLMProvider()
    if p_name == "omniroute":
        return OmniRouteLLMProvider()
    if p_name == "freellmapi":
        return FreeLLMAPILMProvider()
    return DeterministicTestProvider()


def generate(messages: list[dict[str, Any]], **kwargs) -> str:
    """Canonical generate function per CONTRACT §5.3."""
    provider = get_llm_provider()
    return provider.generate(messages, **kwargs)


def generate_stream(messages: list[dict[str, Any]], **kwargs) -> Iterator[str]:
    """Canonical generate_stream function per CONTRACT §5.3."""
    provider = get_llm_provider()
    return provider.generate_stream(messages, **kwargs)


def health_check() -> bool:
    """Canonical health_check function per CONTRACT §5.3."""
    provider = get_llm_provider()
    return provider.health_check()
