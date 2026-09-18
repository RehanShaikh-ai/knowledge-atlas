import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { TagFilter } from './TagFilter';
import * as tagsApi from '@/api/tags';

vi.mock('@/api/tags', () => ({
  listWorkspaceTags: vi.fn(),
}));

describe('TagFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays tags', async () => {
    vi.mocked(tagsApi.listWorkspaceTags).mockResolvedValue({
      items: [
        { id: '1', workspace_id: 'ws-1', name: 'react' },
        { id: '2', workspace_id: 'ws-1', name: 'api' }
      ],
      total: 2
    });

    render(<TagFilter workspaceId="ws-1" onSelectTag={vi.fn()} />);
    
    expect(screen.getByText('Loading tags...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('api')).toBeInTheDocument();
    });
  });

  it('handles tag selection', async () => {
    vi.mocked(tagsApi.listWorkspaceTags).mockResolvedValue({
      items: [{ id: '1', workspace_id: 'ws-1', name: 'react' }],
      total: 1
    });

    const handleSelect = vi.fn();
    render(<TagFilter workspaceId="ws-1" onSelectTag={handleSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument();
    });
    
    await userEvent.click(screen.getByText('react'));
    expect(handleSelect).toHaveBeenCalledWith('react');
  });

  it('handles clearing selected tag', async () => {
    vi.mocked(tagsApi.listWorkspaceTags).mockResolvedValue({
      items: [{ id: '1', workspace_id: 'ws-1', name: 'react' }],
      total: 1
    });

    const handleSelect = vi.fn();
    render(<TagFilter workspaceId="ws-1" selectedTag="react" onSelectTag={handleSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument();
    });
    
    const selectedBtn = screen.getByRole('button', { name: /react/i });
    await userEvent.click(selectedBtn);
    expect(handleSelect).toHaveBeenCalledWith(undefined);
  });
});
