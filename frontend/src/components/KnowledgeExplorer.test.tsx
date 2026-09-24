import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KnowledgeExplorer } from './KnowledgeExplorer';
import * as entitiesApi from '@/api/entities';
import * as graphApi from '@/api/graph';

vi.mock('@/api/entities', () => ({
  getEntity: vi.fn(),
  getEntityProvenance: vi.fn(),
  deleteEntity: vi.fn(),
}));

vi.mock('@/api/graph', () => ({
  getEntityNeighborhood: vi.fn(),
}));

const mockEntity = {
  id: 'ent-1',
  workspace_id: 'ws-1',
  name: 'Backpropagation',
  entity_type: 'concept' as const,
  description: 'Algorithm for computing gradients in neural networks',
  is_manual: true,
  cluster_id: 'c-1',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

const mockNeighborhood = {
  nodes: [
    {
      id: 'ent-1',
      name: 'Backpropagation',
      entity_type: 'concept',
      is_manual: true,
      degree: 2,
      note_count: 1,
    },
    {
      id: 'ent-2',
      name: 'Gradient Descent',
      entity_type: 'concept',
      is_manual: false,
      degree: 3,
      note_count: 2,
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source_entity_id: 'ent-1',
      target_entity_id: 'ent-2',
      relationship_type: 'uses',
      confidence: 0.9,
      is_manual: true,
    },
  ],
  clusters: [],
  stats: { node_count: 2, edge_count: 1, cluster_count: 0, truncated: false },
};

const mockProvenance = {
  entity_id: 'ent-1',
  sources: [
    {
      chunk_id: 'chunk-1',
      note_id: 'note-1',
      note_title: 'Calculus and Deep Learning',
      excerpt: 'Backpropagation applies the chain rule iteratively across computational graphs.',
      extraction_model: 'llama3.2',
      confidence: 0.94,
    },
  ],
};

describe('KnowledgeExplorer (§5.7, §14.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders entity details and neighborhood connections', async () => {
    vi.mocked(entitiesApi.getEntity).mockResolvedValue(mockEntity);
    vi.mocked(graphApi.getEntityNeighborhood).mockResolvedValue(mockNeighborhood);
    vi.mocked(entitiesApi.getEntityProvenance).mockResolvedValue(mockProvenance);

    const onClose = vi.fn();
    render(<KnowledgeExplorer entityId="ent-1" onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('explorer-entity-name')).toHaveTextContent('Backpropagation');
      expect(screen.getByTestId('explorer-entity-description')).toHaveTextContent(
        'Algorithm for computing gradients'
      );
      expect(screen.getByText('Manual')).toBeInTheDocument();
      expect(screen.getByTestId('connection-edge-1')).toBeInTheDocument();
      expect(screen.getByText('Gradient Descent')).toBeInTheDocument();
    });
  });

  it('renders provenance source chunks when switching to Sources tab', async () => {
    vi.mocked(entitiesApi.getEntity).mockResolvedValue(mockEntity);
    vi.mocked(graphApi.getEntityNeighborhood).mockResolvedValue(mockNeighborhood);
    vi.mocked(entitiesApi.getEntityProvenance).mockResolvedValue(mockProvenance);

    render(<KnowledgeExplorer entityId="ent-1" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Sources/i)).toBeInTheDocument();
    });

    const sourcesTab = screen.getByRole('button', { name: /Sources/i });
    fireEvent.click(sourcesTab);

    await waitFor(() => {
      expect(screen.getByTestId('provenance-source-chunk-1')).toBeInTheDocument();
      expect(screen.getByText('Calculus and Deep Learning')).toBeInTheDocument();
      expect(screen.getByText(/chain rule iteratively/i)).toBeInTheDocument();
      expect(screen.getByText(/llama3.2/i)).toBeInTheDocument();
    });
  });

  it('calls deleteEntity and notifies parent on confirmed delete', async () => {
    vi.mocked(entitiesApi.getEntity).mockResolvedValue(mockEntity);
    vi.mocked(graphApi.getEntityNeighborhood).mockResolvedValue(mockNeighborhood);
    vi.mocked(entitiesApi.getEntityProvenance).mockResolvedValue(mockProvenance);
    vi.mocked(entitiesApi.deleteEntity).mockResolvedValue(undefined);

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const onDeleted = vi.fn();
    const onClose = vi.fn();

    render(
      <KnowledgeExplorer
        entityId="ent-1"
        onClose={onClose}
        onEntityDeleted={onDeleted}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('explorer-entity-name')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /Delete entity/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(entitiesApi.deleteEntity).toHaveBeenCalledWith('ent-1');
      expect(onDeleted).toHaveBeenCalledWith('ent-1');
      expect(onClose).toHaveBeenCalled();
    });
  });
});
