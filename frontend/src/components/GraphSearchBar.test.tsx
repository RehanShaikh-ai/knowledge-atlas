import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GraphSearchBar } from './GraphSearchBar';
import * as graphApi from '@/api/graph';

vi.mock('@/api/graph', () => ({
  searchGraph: vi.fn(),
}));

const mockSearchResults = {
  entities: [
    {
      id: 'entity-1',
      name: 'Neural Networks',
      entity_type: 'concept',
      match_field: 'name',
    },
  ],
  notes: [
    {
      id: 'note-1',
      title: 'Backpropagation Explained',
      match_reason: "contains entity 'Neural Networks'",
    },
  ],
  total: 2,
};

describe('GraphSearchBar (§5.7, §14.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls searchGraph after input and displays matching entities and notes', async () => {
    vi.mocked(graphApi.searchGraph).mockResolvedValue(mockSearchResults);

    render(<GraphSearchBar workspaceId="ws-1" />);

    const input = screen.getByTestId('graph-search-input');
    fireEvent.change(input, { target: { value: 'neural' } });

    await waitFor(() => {
      expect(graphApi.searchGraph).toHaveBeenCalledWith('ws-1', 'neural', 20);
    });

    await waitFor(() => {
      expect(screen.getByTestId('graph-search-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('search-result-entity-entity-1')).toBeInTheDocument();
      expect(screen.getByText('Neural Networks')).toBeInTheDocument();
      expect(screen.getByTestId('search-result-note-note-1')).toBeInTheDocument();
      expect(screen.getByText('Backpropagation Explained')).toBeInTheDocument();
    });
  });

  it('handles selecting entity and calls onSelectEntity / onHighlightEntities', async () => {
    vi.mocked(graphApi.searchGraph).mockResolvedValue(mockSearchResults);
    const onSelectEntity = vi.fn();
    const onHighlight = vi.fn();

    render(
      <GraphSearchBar
        workspaceId="ws-1"
        onSelectEntity={onSelectEntity}
        onHighlightEntities={onHighlight}
      />
    );

    const input = screen.getByTestId('graph-search-input');
    fireEvent.change(input, { target: { value: 'neural' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-result-entity-entity-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('search-result-entity-entity-1'));
    expect(onSelectEntity).toHaveBeenCalledWith('entity-1');
    expect(onHighlight).toHaveBeenCalledWith(['entity-1']);
  });

  it('handles selecting note and calls onSelectNote', async () => {
    vi.mocked(graphApi.searchGraph).mockResolvedValue(mockSearchResults);
    const onSelectNote = vi.fn();

    render(<GraphSearchBar workspaceId="ws-1" onSelectNote={onSelectNote} />);

    const input = screen.getByTestId('graph-search-input');
    fireEvent.change(input, { target: { value: 'backprop' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-result-note-note-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('search-result-note-note-1'));
    expect(onSelectNote).toHaveBeenCalledWith('note-1');
  });

  it('clears query and results on clear button click', async () => {
    vi.mocked(graphApi.searchGraph).mockResolvedValue(mockSearchResults);
    const onHighlight = vi.fn();

    render(<GraphSearchBar workspaceId="ws-1" onHighlightEntities={onHighlight} />);

    const input = screen.getByTestId('graph-search-input');
    fireEvent.change(input, { target: { value: 'neural' } });

    await waitFor(() => {
      expect(screen.getByTestId('graph-search-dropdown')).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole('button', { name: /Clear search/i });
    fireEvent.click(clearBtn);

    expect(input).toHaveValue('');
    expect(screen.queryByTestId('graph-search-dropdown')).not.toBeInTheDocument();
    expect(onHighlight).toHaveBeenCalledWith([]);
  });
});
