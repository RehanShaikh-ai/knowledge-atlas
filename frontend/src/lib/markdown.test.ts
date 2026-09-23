import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders headings correctly', () => {
    const input = '# Heading 1\n## Heading 2\n### Heading 3';
    const html = renderMarkdown(input);
    expect(html).toContain('<h1>Heading 1</h1>');
    expect(html).toContain('<h2>Heading 2</h2>');
    expect(html).toContain('<h3>Heading 3</h3>');
  });

  it('renders bold, italics, and inline code', () => {
    const input = '**bold text** and *italic text* and `inline code`';
    const html = renderMarkdown(input);
    expect(html).toContain('<strong>bold text</strong>');
    expect(html).toContain('<em>italic text</em>');
    expect(html).toContain('<code>inline code</code>');
  });

  it('renders unordered and ordered lists as separate items', () => {
    const input = '- Item 1\n- Item 2\n\n1. First\n2. Second';
    const html = renderMarkdown(input);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<li>Item 2</li>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>First</li>');
    expect(html).toContain('<li>Second</li>');
  });

  it('renders code blocks with pre and code tags', () => {
    const input = '```python\ndef hello():\n    return "world"\n```';
    const html = renderMarkdown(input);
    expect(html).toContain('<pre><code class="language-python">');
    expect(html).toContain('def hello():');
  });

  it('renders paragraphs and line breaks without collapsing', () => {
    const input = 'Paragraph one.\n\nParagraph two.\nLine break.';
    const html = renderMarkdown(input);
    expect(html).toContain('<p>Paragraph one.</p>');
    expect(html).toContain('<p>Paragraph two.<br>');
  });

  it('renders markdown tables properly', () => {
    const input = '| Concept | Note |\n|---|---|\n| ML | Intro |';
    const html = renderMarkdown(input);
    expect(html).toContain('<table>');
    expect(html).toContain('<th>Concept</th>');
    expect(html).toContain('<td>ML</td>');
  });

  it('sanitizes dangerous HTML/script injection', () => {
    const input = '<script>alert("hack")</script>Hello <img src=x onerror=alert(1)>';
    const html = renderMarkdown(input);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('onerror');
  });
});
