"""Obsidian and Markdown parsing logic.

Canonical service per contract §4.3 and §5.2.
Provides:
    - parse_markdown_note
    - parse_wikilinks
    - parse_frontmatter
    - parse_tags
"""

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger("app.services.obsidian_parser")

# Regex for wikilinks:
# [[target]] or [[target|display]] or [[target#anchor]] or [[target#anchor|display]]
WIKILINK_PATTERN = re.compile(r"\[\[([^\]]+)\]\]")

# Regex for inline tags: must begin with # followed by word characters/hyphens/underscores/slashes.
# Must NOT match Markdown headings or standalone numeric hashes like #123.
# Preceded by start of string, whitespace, or certain punctuation.
TAG_PATTERN = re.compile(
    r"(?:^|(?<=\s)|(?<=[(\[{<\"']))#([a-zA-Z0-9_\-\/]*[a-zA-Z_\-\/][a-zA-Z0-9_\-\/]*)"
)


@dataclass
class ParsedNote:
    """Represents the parsed components of a Markdown note."""

    title: str
    content: str
    tags: list[str] = field(default_factory=list)
    wikilinks: list[str] = field(default_factory=list)
    frontmatter: dict[str, Any] = field(default_factory=dict)


def parse_frontmatter(content: str) -> tuple[dict[str, Any], str]:
    """Extract YAML frontmatter and remaining body from Markdown content.

    Returns:
        tuple[dict, str]: (frontmatter_dict, remaining_body)
    """
    if not content:
        return {}, ""

    # Frontmatter must start at the very beginning with '---'
    if content.startswith("---\n") or content.startswith("---\r\n"):
        parts = re.split(r"^---\s*$", content, maxsplit=2, flags=re.MULTILINE)
        # parts: ["", yaml_content, body]
        if len(parts) >= 3:
            raw_yaml = parts[1]
            body = parts[2].lstrip("\r\n")
            try:
                parsed = yaml.safe_load(raw_yaml)
                if isinstance(parsed, dict):
                    return parsed, body
            except Exception as e:
                logger.warning("Failed to parse YAML frontmatter: %s", e)
                # Fail gracefully for that file per §12.2
                return {}, content

    return {}, content


def parse_wikilinks(content: str) -> list[str]:
    """Parse Obsidian-style wikilinks from content.

    Supports:
        [[Note Title]] -> 'Note Title'
        [[Note Title|Display Text]] -> 'Note Title'
        [[Note Title#Heading]] -> 'Note Title'
        [[Note Title#Heading|Display Text]] -> 'Note Title'

    Returns:
        list[str]: Deduplicated list of target note titles in order of appearance.
    """
    if not content:
        return []

    targets: list[str] = []
    seen: set[str] = set()

    for match in WIKILINK_PATTERN.finditer(content):
        raw_inner = match.group(1).strip()
        if not raw_inner:
            continue

        # Strip display text after pipe: [[Target|Display]]
        target = raw_inner.split("|")[0].strip()

        # Strip heading anchor after hash: [[Target#Heading]]
        target = target.split("#")[0].strip()

        if not target:
            continue

        key = target.lower()
        if key not in seen:
            seen.add(key)
            targets.append(target)

    return targets


def parse_tags(content: str, frontmatter_tags: Any = None) -> list[str]:
    """Parse inline and frontmatter tags.

    Supports:
        #machine-learning
        #research/deep-learning (stored as literal 'research/deep-learning')

    Does not match Markdown headings (e.g. '# Header').
    Tags are normalized to lowercase and stripped of leading/trailing slashes.

    Returns:
        list[str]: Deduplicated list of tag strings.
    """
    tags: list[str] = []
    seen: set[str] = set()

    def add_tag(raw: str) -> None:
        cleaned = raw.strip().strip("/").lower()
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            tags.append(cleaned)

    # 1. Frontmatter tags (list or comma-separated string)
    if frontmatter_tags is not None:
        if isinstance(frontmatter_tags, list):
            for t in frontmatter_tags:
                if isinstance(t, str):
                    add_tag(t)
        elif isinstance(frontmatter_tags, str):
            for t in frontmatter_tags.split(","):
                add_tag(t)

    # 2. Inline tags in content
    if content:
        for match in TAG_PATTERN.finditer(content):
            matched_tag = match.group(1)
            add_tag(matched_tag)

    return tags


def parse_markdown_note(raw_content: str, filename: str) -> ParsedNote:
    """Parse a Markdown note's frontmatter, title, tags, and wikilinks.

    Title precedence:
        1. Frontmatter 'title' field
        2. First top-level '# ' heading in content body
        3. Filename stem without extension
    """
    frontmatter, body = parse_frontmatter(raw_content)

    # Title detection
    title = ""
    if isinstance(frontmatter.get("title"), str) and frontmatter["title"].strip():
        title = frontmatter["title"].strip()
    else:
        # Look for first '# Heading' in body
        heading_match = re.search(r"^#\s+(.+)$", body, flags=re.MULTILINE)
        if heading_match:
            title = heading_match.group(1).strip()
        else:
            stem = Path(filename).stem
            title = stem.replace("-", " ").replace("_", " ").title() if stem else "Untitled Note"

    # Extract tags
    raw_fm_tags = frontmatter.get("tags") or frontmatter.get("tag")
    tags = parse_tags(body, raw_fm_tags)

    # Extract wikilinks from raw content (both body and any frontmatter wikilinks)
    wikilinks = parse_wikilinks(raw_content)

    return ParsedNote(
        title=title,
        content=raw_content,
        tags=tags,
        wikilinks=wikilinks,
        frontmatter=frontmatter,
    )
