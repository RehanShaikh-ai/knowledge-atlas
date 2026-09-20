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

  it('opens with empty state when no initialNote is provided (new note)', () => {
    render(<NoteEditor workspaceId="ws-1" onClose={vi.fn()} onSaved={vi.fn()} onDeleted={vi.fn()} />);

    const titleInput = screen.getByPlaceholderText('Note title') as HTMLInputElement;
    const bodyInput = screen.getByPlaceholderText(/Write your note here/i) as HTMLTextAreaElement;

    expect(titleInput.value).toBe('');
    expect(bodyInput.value).toBe('');
  });

  it('loads the correct data when initialNote changes via key remount', () => {
    const noteA = {
      id: 'a-1', workspace_id: 'ws-1', created_by: 'u1',
      title: 'Note A', content: 'Content A',
      is_pinned: false, is_archived: false, tags: [],
      created_at: '', updated_at: '',
    };
    const noteB = {
      id: 'b-2', workspace_id: 'ws-1', created_by: 'u1',
      title: 'Note B', content: 'Content B',
      is_pinned: true, is_archived: false, tags: [],
      created_at: '', updated_at: '',
    };

    const props = { workspaceId: 'ws-1', onClose: vi.fn(), onSaved: vi.fn(), onDeleted: vi.fn() };

    // Render Note A
    const { unmount } = render(<NoteEditor key={noteA.id} {...props} initialNote={noteA} />);
    expect((screen.getByPlaceholderText('Note title') as HTMLInputElement).value).toBe('Note A');

    // Simulate switching: unmount and render Note B with a different key
    unmount();
    render(<NoteEditor key={noteB.id} {...props} initialNote={noteB} />);
    expect((screen.getByPlaceholderText('Note title') as HTMLInputElement).value).toBe('Note B');
  });

  it('clears editor when switching from existing note to new note via key remount', () => {
    const existingNote = {
      id: 'existing-1', workspace_id: 'ws-1', created_by: 'u1',
      title: 'Existing Title', content: 'Existing Content',
      is_pinned: true, is_archived: false, tags: [],
      created_at: '', updated_at: '',
    };
    const props = { workspaceId: 'ws-1', onClose: vi.fn(), onSaved: vi.fn(), onDeleted: vi.fn() };

    // Render existing note
    const { unmount } = render(<NoteEditor key={existingNote.id} {...props} initialNote={existingNote} />);
    expect((screen.getByPlaceholderText('Note title') as HTMLInputElement).value).toBe('Existing Title');

    // Simulate "New Note": unmount and render without initialNote with a new key
    unmount();
    render(<NoteEditor key="new-1" {...props} />);
    expect((screen.getByPlaceholderText('Note title') as HTMLInputElement).value).toBe('');
    expect((screen.getByPlaceholderText(/Write your note here/i) as HTMLTextAreaElement).value).toBe('');
  });
});
