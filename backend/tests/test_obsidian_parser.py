"""Unit tests for Obsidian and Markdown parsing.

Contract references:
    CONTRACT_v0.2.2.md §5.2, §14.1
"""

from app.services.obsidian_parser import (
    parse_frontmatter,
    parse_markdown_note,
    parse_tags,
    parse_wikilinks,
)


def test_parse_wikilinks_three_forms():
    """Verify all three forms of Obsidian wikilinks resolve to the target note title.

    CONTRACT_v0.2.2.md §5.2:
    [[Note Title]] -> 'Note Title'
    [[Note Title|Display Text]] -> 'Note Title'
    [[Note Title#Heading]] -> 'Note Title'
    """
    content = """
    Check out [[Neural Networks]] for the basics.
    Also read [[Deep Learning|DL overview]] for advanced topics.
    Refer to [[Optimization#Gradient Descent]] for formulas.
    And [[Backpropagation#Algorithm|backprop details]] here.
    """
    links = parse_wikilinks(content)
    assert links == [
        "Neural Networks",
        "Deep Learning",
        "Optimization",
        "Backpropagation",
    ]


def test_parse_wikilinks_whitespace_and_deduplication():
    content = "[[  Trimmed Note  ]] and [[Trimmed Note]] and [[another note|alias]]"
    links = parse_wikilinks(content)
    assert links == ["Trimmed Note", "another note"]


def test_parse_wikilinks_empty_or_malformed():
    content = "[[]] and [[   ]] and [[#Heading]] and [[|Only Display]]"
    links = parse_wikilinks(content)
    assert links == []


def test_parse_tags_inline_and_nested():
    """Verify inline tags and nested tags are parsed as single literal strings.

    CONTRACT_v0.2.2.md §5.2:
    #machine-learning -> 'machine-learning'
    #research/deep-learning -> 'research/deep-learning'
    """
    content = """
    #machine-learning is a big field.
    Studying #research/deep-learning/transformers right now.
    Don't match # Heading or ## Another Heading or # 123.
    Matches (#in-parens) and [#in-brackets].
    """
    tags = parse_tags(content)
    assert "machine-learning" in tags
    assert "research/deep-learning/transformers" in tags
    assert "in-parens" in tags
    assert "in-brackets" in tags
    assert "heading" not in tags
    assert "another heading" not in tags


def test_parse_frontmatter_valid():
    content = """---
title: Quantum Computing
tags:
  - physics
  - quantum/qubits
status: active
difficulty: intermediate
---
# Quantum Computing
Content begins here.
"""
    fm, body = parse_frontmatter(content)
    assert fm["title"] == "Quantum Computing"
    assert fm["tags"] == ["physics", "quantum/qubits"]
    assert fm["status"] == "active"
    assert "Content begins here." in body


def test_parse_frontmatter_invalid_graceful():
    """Invalid YAML must fail gracefully and not crash.

    CONTRACT_v0.2.2.md §12.2
    """
    content = """---
invalid: [unclosed list
---
Body text
"""
    fm, body = parse_frontmatter(content)
    assert fm == {}
    assert "Body text" in body


def test_parse_markdown_note_full():
    content = """---
title: Artificial Intelligence
tags:
  - ai
  - computer-science
source_author: Alan Turing
---
# Intro to AI
See [[Machine Learning]] and [[Ethics#AI Safety]].
Working with #deep-learning today.
"""
    parsed = parse_markdown_note(content, "ai-notes.md")
    assert parsed.title == "Artificial Intelligence"
    assert "ai" in parsed.tags
    assert "computer-science" in parsed.tags
    assert "deep-learning" in parsed.tags
    assert "Machine Learning" in parsed.wikilinks
    assert "Ethics" in parsed.wikilinks
    assert parsed.frontmatter["source_author"] == "Alan Turing"


def test_parse_markdown_note_fallback_heading_and_stem():
    content_heading = "# My Cool Title\nSome body text with [[Target]]."
    parsed_heading = parse_markdown_note(content_heading, "my-file.md")
    assert parsed_heading.title == "My Cool Title"

    content_no_heading = "Just body text without title."
    parsed_stem = parse_markdown_note(content_no_heading, "quantum-mechanics.md")
    assert parsed_stem.title == "Quantum Mechanics"
