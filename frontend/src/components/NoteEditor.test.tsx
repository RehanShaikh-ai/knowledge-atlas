import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from './NoteEditor';
import * as notesApi from '@/api/notes';

vi.mock('@/api/notes', () => ({
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));

vi.mock('@/api/tags', () => ({
  addTag: vi.fn(),
  removeTag: vi.fn(),
}));

describe('NoteEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('renders in create mode and saves a new note', async () => {
    vi.mocked(notesApi.createNote).mockResolvedValue({
      id: 'new-1',
      title: 'New Title',
      content: 'New Content',
      workspace_id: 'ws-1',
      created_by: '00000000-0000-0000-0000-000000000000',
      is_pinned: false,
      is_archived: false,
      tags: [],
      created_at: '',
      updated_at: ''
    });

    const handleSaved = vi.fn();
    render(<NoteEditor workspaceId="ws-1" onClose={vi.fn()} onSaved={handleSaved} onDeleted={vi.fn()} />);
    
    expect(screen.getByPlaceholderText('Note title')).toBeInTheDocument();
    
    await userEvent.type(screen.getByPlaceholderText('Note title'), 'New Title');
    await userEvent.type(screen.getByPlaceholderText(/Write your note here/i), 'New Content');
    
    await userEvent.click(screen.getByRole('button', { name: /Save/i }));
    
    await waitFor(() => {
      expect(notesApi.createNote).toHaveBeenCalledWith('ws-1', {
        title: 'New Title',
        content: 'New Content',
        created_by: '00000000-0000-0000-0000-000000000000'
      });
      expect(handleSaved).toHaveBeenCalled();
    });
  });

  it('asks for confirmation before closing if dirty', async () => {
    const handleClose = vi.fn();
    render(<NoteEditor workspaceId="ws-1" onClose={handleClose} onSaved={vi.fn()} onDeleted={vi.fn()} />);
    
    await userEvent.type(screen.getByPlaceholderText('Note title'), 'Dirty');
    
    const closeBtn = screen.getByLabelText('Close');
    await userEvent.click(closeBtn);
    
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('unsaved changes'));
    expect(handleClose).toHaveBeenCalled();
  });
});
