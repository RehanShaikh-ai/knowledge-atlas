import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configure marked with standard GitHub-Flavored Markdown and line break support
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Render standard Markdown content into sanitized HTML.
 * Preserves the original Markdown structure and supports:
 * - Headings (h1 - h6)
 * - Bold, italic, strikethrough
 * - Ordered and unordered lists
 * - Fenced code blocks and inline code
 * - Blockquotes, tables, links, horizontal rules
 * - Paragraphs and line breaks
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';

  try {
    const rawHtml = marked.parse(content) as string;
    return DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel', 'class'],
    });
  } catch (err) {
    console.error('Markdown parsing error:', err);
    return DOMPurify.sanitize(content);
  }
}
