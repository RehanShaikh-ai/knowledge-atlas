import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';
import * as notesApi from '@/api/notes';

vi.mock('@/api/notes', () => ({
  searchNotes: vi.fn(),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls search API and displays results after typing', async () => {
    vi.mocked(notesApi.searchNotes).mockResolvedValue({
      items: [
        { id: '1', workspace_id: 'ws-1', title: 'Found Note', content: '...', is_pinned: false, is_archived: false, tags: [], created_at: '', updated_at: '', created_by: '' }
      ],
      total: 1, page: 1, page_size: 10, query: 'Found'
    });

    render(<SearchBar workspaceId="ws-1" />);
    
    const input = screen.getByPlaceholderText(/Search notes/i);
    await userEvent.type(input, 'Found');
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      expect(notesApi.searchNotes).toHaveBeenCalledWith('ws-1', 'Found', { page_size: 10 });
      expect(screen.getByText('Found Note')).toBeInTheDocument();
    });
  });

  it('shows empty state when no results', async () => {
    vi.mocked(notesApi.searchNotes).mockResolvedValue({
      items: [],
      total: 0, page: 1, page_size: 10, query: 'Nope'
    });

    render(<SearchBar workspaceId="ws-1" />);
    
    const input = screen.getByPlaceholderText(/Search notes/i);
    await userEvent.type(input, 'Nope');
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('shows error state on failure', async () => {
    vi.mocked(notesApi.searchNotes).mockRejectedValue(new Error('API failure'));

    render(<SearchBar workspaceId="ws-1" />);
    
    const input = screen.getByPlaceholderText(/Search notes/i);
    await userEvent.type(input, 'Fail');
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      expect(screen.getByText('API failure')).toBeInTheDocument();
    });
  });

  it('handles note selection', async () => {
    vi.mocked(notesApi.searchNotes).mockResolvedValue({
      items: [
        { id: '1', workspace_id: 'ws-1', title: 'Click Me', content: '...', is_pinned: false, is_archived: false, tags: [], created_at: '', updated_at: '', created_by: '' }
      ],
      total: 1, page: 1, page_size: 10, query: 'Click'
    });

    const handleSelect = vi.fn();
    render(<SearchBar workspaceId="ws-1" onNoteSelect={handleSelect} />);
    
    const input = screen.getByPlaceholderText(/Search notes/i);
    await userEvent.type(input, 'Click');
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });
    
    await userEvent.click(screen.getByText('Click Me'));
    
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ title: 'Click Me' }));
    expect(screen.queryByText('Click Me')).not.toBeInTheDocument();
  });
});
