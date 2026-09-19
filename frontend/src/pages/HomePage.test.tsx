import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HomePage } from './HomePage';
import { getUsers } from '@/api/users';
import { getWorkspaces } from '@/api/workspaces';
import { User } from '@/types/users';
import { Workspace } from '@/types/workspaces';

vi.mock('@/api/users', () => ({ getUsers: vi.fn() }));
vi.mock('@/api/workspaces', () => ({ getWorkspaces: vi.fn() }));
vi.mock('@/api/notes', () => ({
  listNotes: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, page_size: 100 }),
  searchNotes: vi.fn().mockResolvedValue({ items: [], total: 0, query: '' }),
}));
vi.mock('@/api/tags', () => ({
  listWorkspaceTags: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

const mockUser: User = {
  id: '11111111-1111-1111-1111-111111111111',
  display_name: 'Ada Lovelace',
  created_at: '2026-09-17T12:00:00Z',
  updated_at: '2026-09-17T12:00:00Z',
};

const mockWorkspace: Workspace = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Quantum Notes',
  description: 'Research workspace',
  owner_id: mockUser.id,
  created_at: '2026-09-17T12:00:00Z',
  updated_at: '2026-09-17T12:00:00Z',
};

describe('HomePage Health State UI (§16, §25, §27)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUsers).mockResolvedValue({ items: [mockUser], total: 1 });
    vi.mocked(getWorkspaces).mockResolvedValue({ items: [], total: 0 });
  });

  it('renders loading state', async () => {
    render(<HomePage healthStatus="loading" onRefreshHealth={vi.fn()} />);
    expect(screen.getByTestId('health-status')).toHaveTextContent(
      'Backend: Loading'
    );
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('renders connected state', async () => {
    render(<HomePage healthStatus="connected" onRefreshHealth={vi.fn()} />);
    expect(screen.getByTestId('health-status')).toHaveTextContent(
      'Backend: Connected'
    );
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('renders unavailable state', async () => {
    render(<HomePage healthStatus="error" onRefreshHealth={vi.fn()} />);
    expect(screen.getByTestId('health-status')).toHaveTextContent(
      'Backend: Unavailable'
    );
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('requires a selected user before progressing to workspace management', async () => {
    render(<HomePage healthStatus="connected" onRefreshHealth={vi.fn()} />);

    // Wait for user list to load — continue button should not yet be present
    await waitFor(() => {
      expect(screen.getByTestId(`select-user-${mockUser.id}`)).toBeInTheDocument();
    });

    // Continue button is not rendered until a user is selected
    expect(screen.queryByTestId('continue-to-workspaces')).not.toBeInTheDocument();

    // Select a user — continue button now appears
    fireEvent.click(screen.getByTestId(`select-user-${mockUser.id}`));
    const continueButton = await screen.findByTestId('continue-to-workspaces');
    expect(continueButton).toBeInTheDocument();

    fireEvent.click(continueButton);
    expect(await screen.findByRole('heading', { name: 'Workspace Management' })).toBeInTheDocument();
    expect(screen.getByTestId('selected-workspace-owner')).toHaveTextContent('Ada Lovelace');
  });

  it('preserves the selected user when returning to user management', async () => {
    render(<HomePage healthStatus="connected" onRefreshHealth={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId(`select-user-${mockUser.id}`)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(`select-user-${mockUser.id}`));
    fireEvent.click(await screen.findByTestId('continue-to-workspaces'));
    await screen.findByRole('heading', { name: 'Workspace Management' });

    // Click back ("← Users" button)
    fireEvent.click(screen.getByRole('button', { name: /users/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Selected owner: Ada Lovelace');
  });

  it('smoothly navigates to Knowledge Base (Phase 03) when selecting a workspace and returns back', async () => {
    vi.mocked(getWorkspaces).mockResolvedValue({ items: [mockWorkspace], total: 1 });

    render(<HomePage healthStatus="connected" onRefreshHealth={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId(`select-user-${mockUser.id}`)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(`select-user-${mockUser.id}`));
    fireEvent.click(await screen.findByTestId('continue-to-workspaces'));
    await screen.findByRole('heading', { name: 'Workspace Management' });

    // Find and click Open Knowledge Base button on the workspace item
    const openBtn = await screen.findByTestId(`open-workspace-${mockWorkspace.id}`);
    expect(openBtn).toBeInTheDocument();
    fireEvent.click(openBtn);

    // Knowledge Base breadcrumb and workspace badge should be visible
    // The NotesDashboard shows the workspace name in breadcrumb
    await waitFor(
      () => {
        expect(screen.getByTestId('active-workspace-badge')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Click back to workspaces
    const backBtn = screen.getByTestId('back-to-workspaces');
    fireEvent.click(backBtn);

    // Should return to Workspace Management with selected workspace remembered
    expect(await screen.findByRole('heading', { name: 'Workspace Management' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Selected workspace: Quantum Notes');
  });
});
