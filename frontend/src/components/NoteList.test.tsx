import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NoteList } from './NoteList';
import { Note } from '@/types/note';

const mockNotes: Note[] = [
  {
    id: 'note-1',
    workspace_id: 'ws-1',
    created_by: 'user-1',
    title: 'First Note',
    content: 'Content 1',
    is_pinned: false,
    is_archived: false,
    tags: [],
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-02T12:00:00Z',
  },
  {
    id: 'note-2',
    workspace_id: 'ws-1',
    created_by: 'user-1',
    title: 'Second Note',
    content: 'Content 2',
    is_pinned: true,
    is_archived: false,
    tags: [],
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-03T12:00:00Z',
  }
];

describe('NoteList', () => {
  it('renders loading state', () => {
    render(<NoteList notes={[]} isLoading={true} />);
    expect(screen.getByText('Loading notes...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<NoteList notes={[]} error={new Error('Network failure')} />);
    expect(screen.getByText('Failed to load notes')).toBeInTheDocument();
    expect(screen.getByText('Network failure')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<NoteList notes={[]} />);
    expect(screen.getByText('No notes found')).toBeInTheDocument();
  });

  it('renders list of notes', () => {
    render(<NoteList notes={mockNotes} />);
    expect(screen.getByText('First Note')).toBeInTheDocument();
    expect(screen.getByText('Second Note')).toBeInTheDocument();
  });

  it('handles note click', async () => {
    const handleClick = vi.fn();
    render(<NoteList notes={mockNotes} onNoteClick={handleClick} />);
    
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(2);
    
    await userEvent.click(articles[0]);
    expect(handleClick).toHaveBeenCalledWith(mockNotes[0]);
  });
});
