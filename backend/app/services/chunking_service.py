"""Markdown-aware chunking service.

Canonical service per CONTRACT v0.3.1 §5.3, §8.1, §8.2.
Provides chunk_note and compute_content_hash.
"""

import hashlib
import re
from typing import Any

from app.core.config import settings


def compute_content_hash(content: str) -> str:
    """Compute deterministic SHA-256 hex digest of content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def _estimate_token_count(text: str) -> int:
    """Rough token count estimation (approx 4 chars/token or word-based)."""
    # Simple whitespace + punctuation split gives a solid approximation
    words = len(text.split())
    char_estimate = len(text) // 4
    return max(words, char_estimate, 1) if text.strip() else 0


def _split_into_sections(markdown_text: str) -> list[tuple[str, str]]:
    """Split markdown into (heading, section_text) tuples."""
    lines = markdown_text.splitlines(keepends=True)
    sections: list[tuple[str, str]] = []
    current_heading = ""
    current_lines: list[str] = []

    heading_pattern = re.compile(r"^(#{1,6})\s+(.+)$")

    for line in lines:
        match = heading_pattern.match(line.strip())
        if match:
            if current_lines:
                sections.append((current_heading, "".join(current_lines)))
                current_lines = []
            current_heading = match.group(2).strip()
            current_lines.append(line)
        else:
            current_lines.append(line)

    if current_lines:
        sections.append((current_heading, "".join(current_lines)))

    return sections if sections else [("", markdown_text)]


def _split_section_with_overlap(
    text: str, heading: str, target_tokens: int, overlap_tokens: int
) -> list[str]:
    """Split a section into overlapping sub-chunks if it exceeds target_tokens."""
    words = text.split()
    if not words:
        return []

    # If already fits
    if len(words) <= target_tokens:
        return [text.strip()]

    chunks: list[str] = []
    step = max(target_tokens - overlap_tokens, 1)
    for start_idx in range(0, len(words), step):
        sub_words = words[start_idx : start_idx + target_tokens]
        chunk_text = " ".join(sub_words)
        if heading and not chunk_text.startswith("#"):
            chunk_text = f"## {heading}\n\n{chunk_text}"
        chunks.append(chunk_text.strip())
        if start_idx + target_tokens >= len(words):
            break

    return chunks


def chunk_note(
    content: str,
    title: str = "",
    *,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
    strategy: str | None = None,
) -> list[dict[str, Any]]:
    """Chunk note content deterministically per CONTRACT §8.1, §8.2.

    Returns a list of chunk dicts:
        chunk_index: int (0-based)
        content: str
        content_hash: str (SHA-256)
        token_count: int
        heading: str
    """
    target_tokens = chunk_size or settings.CHUNK_SIZE
    overlap_tokens = chunk_overlap or settings.CHUNK_OVERLAP
    chunking_strategy = strategy or settings.CHUNKING_STRATEGY

    stripped = content.strip()
    if not stripped:
        return []

    raw_chunks: list[str] = []

    if chunking_strategy == "markdown_heading":
        sections = _split_into_sections(stripped)
        for heading, sec_text in sections:
            sec_words = len(sec_text.split())
            if sec_words <= target_tokens:
                chunk_body = sec_text.strip()
                if heading and not chunk_body.startswith("#"):
                    chunk_body = f"## {heading}\n\n{chunk_body}"
                raw_chunks.append(chunk_body)
            else:
                sub_chunks = _split_section_with_overlap(
                    sec_text, heading, target_tokens, overlap_tokens
                )
                raw_chunks.extend(sub_chunks)
    else:
        # fixed_size strategy
        words = stripped.split()
        step = max(target_tokens - overlap_tokens, 1)
        for start_idx in range(0, len(words), step):
            sub_words = words[start_idx : start_idx + target_tokens]
            raw_chunks.append(" ".join(sub_words))
            if start_idx + target_tokens >= len(words):
                break

    # Build structured chunks with deterministic order and metadata
    result: list[dict[str, Any]] = []
    for idx, chunk_text in enumerate(raw_chunks):
        if not chunk_text.strip():
            continue
        c_hash = compute_content_hash(chunk_text)
        tokens = _estimate_token_count(chunk_text)
        result.append(
            {
                "chunk_index": idx,
                "content": chunk_text,
                "content_hash": c_hash,
                "token_count": tokens,
            }
        )

    # Re-index to ensure strictly contiguous 0, 1, 2...
    for i, c in enumerate(result):
        c["chunk_index"] = i

    return result
