import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClusterView } from './ClusterView';
import * as clustersApi from '@/api/clusters';
import { ClusterResponse } from '@/types/cluster';

vi.mock('@/api/clusters', () => ({
  listClusters: vi.fn(),
  getCluster: vi.fn(),
  generateClusters: vi.fn(),
}));

const mockClusters: ClusterResponse[] = [
  {
    id: 'c-1',
    workspace_id: 'ws-1',
    label: 'Deep Learning & Neural Networks',
    description: 'Foundational concepts in deep learning and backprop',
    member_count: 2,
    members: [
      {
        note_id: 'note-1',
        note_title: 'Intro to Neural Nets',
        score: 0.95,
      },
      {
        note_id: 'note-2',
        note_title: 'Backpropagation Calculus',
        score: 0.88,
      },
    ],
  },
  {
    id: 'c-2',
    workspace_id: 'ws-1',
    label: 'Transformers & NLP',
    description: 'Attention mechanisms and language models',
    member_count: 1,
    members: [
      {
        note_id: 'note-3',
        note_title: 'Attention Is All You Need',
        score: 0.92,
      },
    ],
  },
];

describe('ClusterView (§5.7, §14.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cluster list and details with member notes and scores', async () => {
    vi.mocked(clustersApi.listClusters).mockResolvedValue(mockClusters);
    vi.mocked(clustersApi.getCluster).mockResolvedValue(mockClusters[0]);

    render(<ClusterView workspaceId="ws-1" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(clustersApi.listClusters).toHaveBeenCalledWith('ws-1');
      expect(screen.getByTestId('cluster-view')).toBeInTheDocument();
      expect(screen.getByTestId('cluster-tab-c-1')).toBeInTheDocument();
      expect(screen.getByTestId('cluster-title')).toHaveTextContent('Deep Learning & Neural Networks');
      expect(screen.getByTestId('cluster-member-note-1')).toBeInTheDocument();
      expect(screen.getByText('Intro to Neural Nets')).toBeInTheDocument();
      expect(screen.getByText('95% fit')).toBeInTheDocument();
    });
  });

  it('switches between clusters when clicking tab', async () => {
    vi.mocked(clustersApi.listClusters).mockResolvedValue(mockClusters);
    vi.mocked(clustersApi.getCluster).mockImplementation(async (_, id) => {
      return mockClusters.find((c) => c.id === id) || mockClusters[0];
    });

    render(<ClusterView workspaceId="ws-1" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('cluster-tab-c-2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cluster-tab-c-2'));

    await waitFor(() => {
      expect(clustersApi.getCluster).toHaveBeenCalledWith('ws-1', 'c-2');
      expect(screen.getByTestId('cluster-title')).toHaveTextContent('Transformers & NLP');
      expect(screen.getByTestId('cluster-member-note-3')).toBeInTheDocument();
    });
  });

  it('calls generateClusters when generate button is clicked', async () => {
    vi.mocked(clustersApi.listClusters).mockResolvedValue(mockClusters);
    vi.mocked(clustersApi.getCluster).mockResolvedValue(mockClusters[0]);
    vi.mocked(clustersApi.generateClusters).mockResolvedValue({
      job_id: 'job-12345678',
      status: 'queued',
    });

    render(<ClusterView workspaceId="ws-1" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Generate/i }));

    await waitFor(() => {
      expect(clustersApi.generateClusters).toHaveBeenCalledWith('ws-1');
      expect(screen.getByText(/Clustering job queued/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no clusters exist', async () => {
    vi.mocked(clustersApi.listClusters).mockResolvedValue([]);

    render(<ClusterView workspaceId="ws-1" isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('clusters-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Clusters Formed')).toBeInTheDocument();
    });
  });
});
