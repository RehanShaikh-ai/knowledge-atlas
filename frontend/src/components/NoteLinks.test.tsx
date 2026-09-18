import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NoteLinks } from './NoteLinks';
import * as noteLinksApi from '@/api/note_links';
import * as notesApi from '@/api/notes';

vi.mock('@/api/note_links', () => ({
  getNoteLinkss: vi.fn(),
  createNoteLink: vi.fn(),
  deleteNoteLink: vi.fn(),
}));

vi.mock('@/api/notes', () => ({
  getNote: vi.fn(),
  searchNotes: vi.fn(),
}));

describe('NoteLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays incoming and outgoing links', async () => {
    vi.mocked(noteLinksApi.getNoteLinkss).mockResolvedValue({
      incoming: [{ source_note_id: 'note-2', target_note_id: 'note-1', created_at: '' }],
      outgoing: [{ source_note_id: 'note-1', target_note_id: 'note-3', created_at: '' }]
    });

    vi.mocked(notesApi.getNote).mockImplementation(async (id) => {
      if (id === 'note-2') return { id: 'note-2', title: 'Incoming Note' } as any;
      if (id === 'note-3') return { id: 'note-3', title: 'Outgoing Note' } as any;
      throw new Error('Not found');
    });

    render(<NoteLinks workspaceId="ws-1" noteId="note-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Incoming Note')).toBeInTheDocument();
      expect(screen.getByText('Outgoing Note')).toBeInTheDocument();
    });
  });

  it('handles link deletion', async () => {
    vi.mocked(noteLinksApi.getNoteLinkss).mockResolvedValue({
      incoming: [],
      outgoing: [{ source_note_id: 'note-1', target_note_id: 'note-3', created_at: '' }]
    });
    vi.mocked(notesApi.getNote).mockResolvedValue({ id: 'note-3', title: 'Outgoing Note' } as any);

    render(<NoteLinks workspaceId="ws-1" noteId="note-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Outgoing Note')).toBeInTheDocument();
    });
    
    const removeBtn = screen.getByTitle('Remove link');
    await userEvent.click(removeBtn);
    
    expect(noteLinksApi.deleteNoteLink).toHaveBeenCalledWith('note-1', 'note-3');
    
    await waitFor(() => {
      expect(screen.queryByText('Outgoing Note')).not.toBeInTheDocument();
    });
  });
});
