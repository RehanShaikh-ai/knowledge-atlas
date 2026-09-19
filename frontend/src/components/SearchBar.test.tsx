import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchBar } from './SearchBar';
import * as notesApi from '@/api/notes';

vi.mock('@/api/notes', () => ({
  searchNotes: vi.fn(),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    fireEvent.change(input, { target: { value: 'Found' } });
    
    await waitFor(() => {
      expect(notesApi.searchNotes).toHaveBeenCalledWith('ws-1', 'Found', { page_size: 10 });
      expect(screen.getByText('Found Note')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('shows empty state when no results', async () => {
    vi.mocked(notesApi.searchNotes).mockResolvedValue({
      items: [],
      total: 0, page: 1, page_size: 10, query: 'Nope'
    });

    render(<SearchBar workspaceId="ws-1" />);
    
    const input = screen.getByPlaceholderText(/Search notes/i);
    fireEvent.change(input, { target: { value: 'Nope' } });
    
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('shows error state on failure', async () => {
    vi.mocked(notesApi.searchNotes).mockRejectedValue(new Error('API failure'));

    render(<SearchBar workspaceId="ws-1" />);
    
    const input = screen.getByPlaceholderText(/Search notes/i);
    fireEvent.change(input, { target: { value: 'Fail' } });
    
    await waitFor(() => {
      expect(screen.getByText('API failure')).toBeInTheDocument();
    }, { timeout: 1500 });
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
    fireEvent.change(input, { target: { value: 'Click' } });
    
    await waitFor(() => {
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    }, { timeout: 1500 });
    
    fireEvent.click(screen.getByText('Click Me'));
    
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ title: 'Click Me' }));
    expect(screen.queryByText('Click Me')).not.toBeInTheDocument();
  });

  it('searches with partial substring and returns matching results', async () => {
    vi.mocked(notesApi.searchNotes).mockResolvedValue({
      items: [
        { id: '1', workspace_id: 'ws-1', title: 'hellow world', content: 'some content', is_pinned: false, is_archived: false, tags: [], created_at: '', updated_at: '', created_by: '' }
      ],
      total: 1, page: 1, page_size: 10, query: 'ell'
    });

    render(<SearchBar workspaceId="ws-1" />);

    const input = screen.getByPlaceholderText(/Search notes/i);
    fireEvent.change(input, { target: { value: 'ell' } });

    await waitFor(() => {
      expect(notesApi.searchNotes).toHaveBeenCalledWith('ws-1', 'ell', { page_size: 10 });
      expect(screen.getByText('hellow world')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('searches case-insensitively and displays results', async () => {
    vi.mocked(notesApi.searchNotes).mockResolvedValue({
      items: [
        { id: '2', workspace_id: 'ws-1', title: 'UPPERCASE Title', content: 'body text', is_pinned: false, is_archived: false, tags: [], created_at: '', updated_at: '', created_by: '' }
      ],
      total: 1, page: 1, page_size: 10, query: 'uppercase'
    });

    render(<SearchBar workspaceId="ws-1" />);

    const input = screen.getByPlaceholderText(/Search notes/i);
    fireEvent.change(input, { target: { value: 'uppercase' } });

    await waitFor(() => {
      expect(notesApi.searchNotes).toHaveBeenCalledWith('ws-1', 'uppercase', { page_size: 10 });
      expect(screen.getByText('UPPERCASE Title')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('matches notes by content substring', async () => {
    vi.mocked(notesApi.searchNotes).mockResolvedValue({
      items: [
        { id: '3', workspace_id: 'ws-1', title: 'My Note', content: 'initialization complete', is_pinned: false, is_archived: false, tags: [], created_at: '', updated_at: '', created_by: '' }
      ],
      total: 1, page: 1, page_size: 10, query: 'init'
    });

    render(<SearchBar workspaceId="ws-1" />);

    const input = screen.getByPlaceholderText(/Search notes/i);
    fireEvent.change(input, { target: { value: 'init' } });

    await waitFor(() => {
      expect(notesApi.searchNotes).toHaveBeenCalledWith('ws-1', 'init', { page_size: 10 });
      expect(screen.getByText('My Note')).toBeInTheDocument();
    }, { timeout: 1500 });
  });
});

