import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GraphRAGPanel } from './GraphRAGPanel';
import * as graphRagApi from '@/api/graph_rag';
import { GraphRAGResponse } from '@/types/graph_rag';

vi.mock('@/api/graph_rag', () => ({
  runGraphRAG: vi.fn(),
}));

const mockGraphRAGResponse: GraphRAGResponse = {
  answer: 'Backpropagation computes the gradient of the loss function with respect to weights using the chain rule.',
  citations: [
    {
      chunk_id: 'chunk-1',
      note_id: 'note-1',
      title: 'Neural Networks Overview',
      excerpt: 'The backpropagation algorithm is an efficient method...',
      score: 0.94,
    },
  ],
  graph_context: {
    entities_traversed: [
      { id: 'ent-1', name: 'Neural Networks', entity_type: 'concept' },
      { id: 'ent-2', name: 'Gradient Descent', entity_type: 'concept' },
    ],
    relationships_used: [
      {
        id: 'rel-1',
        relationship_type: 'uses',
        source: 'Neural Networks',
        target: 'Gradient Descent',
      },
    ],
    hops: 2,
  },
  provider: 'ollama',
  model: 'llama3.2',
  latency_ms: 1850,
};

describe('GraphRAGPanel (§5.7, §9.7, §14.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits query and renders answer, citations, and graph_context', async () => {
    vi.mocked(graphRagApi.runGraphRAG).mockResolvedValue(mockGraphRAGResponse);

    render(<GraphRAGPanel workspaceId="ws-1" />);

    const input = screen.getByTestId('graph-rag-query-input');
    fireEvent.change(input, {
      target: { value: 'How does backpropagation relate to gradient descent?' },
    });

    const submitBtn = screen.getByTestId('graph-rag-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(graphRagApi.runGraphRAG).toHaveBeenCalledWith('ws-1', {
        query: 'How does backpropagation relate to gradient descent?',
        max_hops: 2,
        context_limit: 10,
        rerank: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('graph-rag-results')).toBeInTheDocument();
      expect(screen.getByTestId('graph-rag-answer')).toHaveTextContent(
        'Backpropagation computes the gradient of the loss function'
      );
      expect(screen.getByTestId('graph-context-hops')).toHaveTextContent('2 Hops Traversed');
      expect(screen.getByTestId('traversed-entities-list')).toHaveTextContent('Neural Networks');
      expect(screen.getByTestId('traversed-entities-list')).toHaveTextContent('Gradient Descent');
      expect(screen.getByTestId('relationships-used-list')).toHaveTextContent('uses');
      expect(screen.getByTestId('graph-rag-citations')).toBeInTheDocument();
      expect(screen.getByText('Neural Networks Overview')).toBeInTheDocument();
      expect(screen.getByText(/Provider: ollama/i)).toBeInTheDocument();
      expect(screen.getByText(/Latency: 1850ms/i)).toBeInTheDocument();
    });
  });

  it('does NOT silently cap max_hops > 2 when requested', async () => {
    vi.mocked(graphRagApi.runGraphRAG).mockResolvedValue(mockGraphRAGResponse);

    render(<GraphRAGPanel workspaceId="ws-1" />);

    // Select 3 hops
    const hopsSelect = screen.getByTestId('max-hops-select');
    fireEvent.change(hopsSelect, { target: { value: '3' } });

    const input = screen.getByTestId('graph-rag-query-input');
    fireEvent.change(input, { target: { value: 'Deep traversal query' } });

    fireEvent.click(screen.getByTestId('graph-rag-submit-btn'));

    await waitFor(() => {
      // Must NOT be capped to 2 by frontend
      expect(graphRagApi.runGraphRAG).toHaveBeenCalledWith('ws-1', {
        query: 'Deep traversal query',
        max_hops: 3,
        context_limit: 10,
        rerank: true,
      });
    });
  });

  it('renders error state on API failure', async () => {
    vi.mocked(graphRagApi.runGraphRAG).mockRejectedValue({
      error: { code: 'VALIDATION_ERROR', message: 'max_hops cannot exceed 2' },
    });

    render(<GraphRAGPanel workspaceId="ws-1" />);

    const input = screen.getByTestId('graph-rag-query-input');
    fireEvent.change(input, { target: { value: 'Deep query' } });
    fireEvent.click(screen.getByTestId('graph-rag-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('graph-rag-error')).toHaveTextContent('max_hops cannot exceed 2');
    });
  });
});
