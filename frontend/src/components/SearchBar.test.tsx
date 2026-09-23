import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchBar } from './SearchBar';
import * as searchApi from '@/api/search';

vi.mock('@/api/search', () => ({
  searchNotes: vi.fn(),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls search API and displays results after typing', async () => {
    vi.mocked(searchApi.searchNotes).mockResolvedValue({
      results: [
        { note_id: '1', chunk_id: 'c1', title: 'Found Note', excerpt: '...', score: 0.9, score_meaning: 'hybrid', search_mode: 'hybrid', is_archived: false }
      ]
    });

    render(<SearchBar workspaceId="ws-1" />);
    
    const input = screen.getByPlaceholderText(/Search notes/i);
    fireEvent.change(input, { target: { value: 'Found' } });
    
    await waitFor(() => {
      expect(searchApi.searchNotes).toHaveBeenCalledWith('ws-1', { query: 'Found', mode: 'hybrid', limit: 10 });
      expect(screen.getByText('Found Note')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('shows empty state when no results', async () => {
    vi.mocked(searchApi.searchNotes).mockResolvedValue({
      results: []
    });

    render(<SearchBar workspaceId="ws-1" />);
    
    const input = screen.getByPlaceholderText(/Search notes/i);
    fireEvent.change(input, { target: { value: 'Nope' } });
    
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('shows error state on failure', async () => {
    vi.mocked(searchApi.searchNotes).mockRejectedValue(new Error('API failure'));

    render(<SearchBar workspaceId="ws-1" />);
    
    const input = screen.getByPlaceholderText(/Search notes/i);
    fireEvent.change(input, { target: { value: 'Fail' } });
    
    await waitFor(() => {
      expect(screen.getByText('API failure')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('handles note selection', async () => {
    vi.mocked(searchApi.searchNotes).mockResolvedValue({
      results: [
        { note_id: '1', chunk_id: 'c2', title: 'Click Me', excerpt: '...', score: 0.8, score_meaning: 'hybrid', search_mode: 'hybrid', is_archived: false }
      ]
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
    vi.mocked(searchApi.searchNotes).mockResolvedValue({
      results: [
        { note_id: '1', chunk_id: 'c3', title: 'hellow world', excerpt: 'some content', score: 0.7, score_meaning: 'hybrid', search_mode: 'hybrid', is_archived: false }
      ]
    });

    render(<SearchBar workspaceId="ws-1" />);

    const input = screen.getByPlaceholderText(/Search notes/i);
    fireEvent.change(input, { target: { value: 'ell' } });

    await waitFor(() => {
      expect(searchApi.searchNotes).toHaveBeenCalledWith('ws-1', { query: 'ell', mode: 'hybrid', limit: 10 });
      expect(screen.getByText('hellow world')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('searches case-insensitively and displays results', async () => {
    vi.mocked(searchApi.searchNotes).mockResolvedValue({
      results: [
        { note_id: '2', chunk_id: 'c4', title: 'UPPERCASE Title', excerpt: 'body text', score: 0.6, score_meaning: 'hybrid', search_mode: 'hybrid', is_archived: false }
      ]
    });

    render(<SearchBar workspaceId="ws-1" />);

    const input = screen.getByPlaceholderText(/Search notes/i);
    fireEvent.change(input, { target: { value: 'uppercase' } });

    await waitFor(() => {
      expect(searchApi.searchNotes).toHaveBeenCalledWith('ws-1', { query: 'uppercase', mode: 'hybrid', limit: 10 });
      expect(screen.getByText('UPPERCASE Title')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('matches notes by content substring', async () => {
    vi.mocked(searchApi.searchNotes).mockResolvedValue({
      results: [
        { note_id: '3', chunk_id: 'c5', title: 'My Note', excerpt: 'initialization complete', score: 0.9, score_meaning: 'hybrid', search_mode: 'hybrid', is_archived: false }
      ]
    });

    render(<SearchBar workspaceId="ws-1" />);

    const input = screen.getByPlaceholderText(/Search notes/i);
    fireEvent.change(input, { target: { value: 'init' } });

    await waitFor(() => {
      expect(searchApi.searchNotes).toHaveBeenCalledWith('ws-1', { query: 'init', mode: 'hybrid', limit: 10 });
      expect(screen.getByText('My Note')).toBeInTheDocument();
    }, { timeout: 1500 });
  });
});

