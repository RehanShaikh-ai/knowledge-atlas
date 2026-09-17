import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HomePage } from './HomePage';
import { getUsers } from '@/api/users';
import { getWorkspaces } from '@/api/workspaces';
import { User } from '@/types/users';

vi.mock('@/api/users', () => ({ getUsers: vi.fn() }));
vi.mock('@/api/workspaces', () => ({ getWorkspaces: vi.fn() }));

const mockUser: User = {
  id: '11111111-1111-1111-1111-111111111111',
  display_name: 'Ada Lovelace',
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

    const continueButton = screen.getByTestId('continue-to-workspaces');
    expect(continueButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByTestId(`select-user-${mockUser.id}`)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(`select-user-${mockUser.id}`));
    expect(continueButton).toBeEnabled();

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
    fireEvent.click(screen.getByTestId('continue-to-workspaces'));
    await screen.findByRole('heading', { name: 'Workspace Management' });

    fireEvent.click(screen.getByRole('button', { name: /back to users/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Selected owner: Ada Lovelace');
  });
});
