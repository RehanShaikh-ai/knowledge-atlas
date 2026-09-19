import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NotesDashboard } from './NotesDashboard';
import * as notesApi from '@/api/notes';

vi.mock('@/api/notes', () => ({
  listNotes: vi.fn(),
  searchNotes: vi.fn().mockResolvedValue({ items: [], total: 0, query: '' }),
}));

vi.mock('@/api/tags', () => ({
  listWorkspaceTags: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

const mockNote = {
  id: '1',
  workspace_id: 'ws-1',
  title: 'Test Note',
  content: 'Content',
  is_pinned: false,
  is_archived: false,
  tags: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  created_by: 'u1'
};

describe('NotesDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard sections and fetches data', async () => {
    vi.mocked(notesApi.listNotes).mockImplementation(async (_, params) => {
      if (params?.is_pinned) {
        return { items: [{ ...mockNote, id: 'pinned-1', is_pinned: true, title: 'Pinned Note' }], total: 1, page: 1, page_size: 100 };
      }
      return { items: [{ ...mockNote, id: 'recent-1', title: 'Recent Note' }], total: 1, page: 1, page_size: 100 };
    });

    render(<NotesDashboard workspaceId="ws-1" />);

    // "Knowledge Base" text appears in the breadcrumb
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Pinned Note')).toBeInTheDocument();
      expect(screen.getByText('Recent Note')).toBeInTheDocument();
    });
  });

  it('shows workspace name badge when workspaceName prop is provided', async () => {
    vi.mocked(notesApi.listNotes).mockResolvedValue({ items: [], total: 0, page: 1, page_size: 100 });

    render(<NotesDashboard workspaceId="ws-1" workspaceName="My Workspace" />);

    expect(screen.getByTestId('active-workspace-badge')).toHaveTextContent('My Workspace');
  });

  it('toggles archived view', async () => {
    vi.mocked(notesApi.listNotes).mockImplementation(async (_, params) => {
      if (params?.is_archived) {
        return { items: [{ ...mockNote, id: 'arch-1', title: 'Archived Note' }], total: 1, page: 1, page_size: 100 };
      }
      return { items: [], total: 0, page: 1, page_size: 100 };
    });

    render(<NotesDashboard workspaceId="ws-1" />);

    // Click archived toggle (button with text "Archived")
    const archiveBtn = screen.getByRole('button', { name: /Archived/i });
    await userEvent.click(archiveBtn);

    await waitFor(() => {
      expect(screen.getByText('Archived Notes')).toBeInTheDocument();
      expect(screen.getByText('Archived Note')).toBeInTheDocument();
    });
  });
});
