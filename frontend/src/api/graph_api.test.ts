import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './client';
import {
  getWorkspaceGraph,
  getEntityNeighborhood,
  searchGraph,
} from './graph';
import {
  createEntity,
  updateEntity,
  deleteEntity,
  getEntity,
  getEntityProvenance,
} from './entities';
import {
  createRelationship,
  updateRelationship,
  deleteRelationship,
  getRelationship,
} from './relationships';
import {
  listClusters,
  getCluster,
  generateClusters,
} from './clusters';
import {
  getLinkSuggestions,
  acceptSuggestion,
  rejectSuggestion,
} from './link_suggestions';
import { runGraphRAG } from './graph_rag';
import { triggerExtraction, triggerReindex } from './graph_index';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Canonical API Modules (§5.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('graph.ts', () => {
    it('getWorkspaceGraph sends correct query parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ nodes: [], edges: [], clusters: [], stats: { node_count: 0, edge_count: 0, cluster_count: 0, truncated: false } });

      await getWorkspaceGraph('ws-1', {
        entity_type: 'concept',
        cluster_id: 'c-1',
        note_id: 'n-1',
        relationship_type: 'prerequisite_of',
        min_confidence: 0.8,
        limit: 100,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/workspaces/ws-1/graph?entity_type=concept&cluster_id=c-1&note_id=n-1&relationship_type=prerequisite_of&min_confidence=0.8&limit=100'
      );
    });

    it('getEntityNeighborhood calls correct endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ nodes: [], edges: [], clusters: [], stats: { node_count: 1, edge_count: 0, cluster_count: 0, truncated: false } });

      await getEntityNeighborhood('ent-1');
      expect(apiClient.get).toHaveBeenCalledWith('/entities/ent-1/neighborhood');
    });

    it('searchGraph calls search endpoint with q parameter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ entities: [], notes: [], total: 0 });

      await searchGraph('ws-1', 'neural', 15);
      expect(apiClient.get).toHaveBeenCalledWith('/workspaces/ws-1/graph/search?q=neural&limit=15');
    });
  });

  describe('entities.ts', () => {
    it('createEntity posts to workspace entities', async () => {
      const payload = { name: 'Gradient Descent', entity_type: 'concept' as const, description: 'Optimization' };
      vi.mocked(apiClient.post).mockResolvedValue({ id: 'ent-1', ...payload, workspace_id: 'ws-1', is_manual: true, created_at: '', updated_at: '' });

      await createEntity('ws-1', payload);
      expect(apiClient.post).toHaveBeenCalledWith('/workspaces/ws-1/entities', payload);
    });

    it('updateEntity patches entity', async () => {
      const payload = { description: 'Updated desc' };
      vi.mocked(apiClient.patch).mockResolvedValue({ id: 'ent-1', description: 'Updated desc' });

      await updateEntity('ent-1', payload);
      expect(apiClient.patch).toHaveBeenCalledWith('/entities/ent-1', payload);
    });

    it('deleteEntity issues DELETE', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await deleteEntity('ent-1');
      expect(apiClient.delete).toHaveBeenCalledWith('/entities/ent-1');
    });

    it('getEntity and getEntityProvenance call correct routes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({});

      await getEntity('ent-1');
      expect(apiClient.get).toHaveBeenCalledWith('/entities/ent-1');

      await getEntityProvenance('ent-1');
      expect(apiClient.get).toHaveBeenCalledWith('/entities/ent-1/provenance');
    });
  });

  describe('relationships.ts', () => {
    it('createRelationship posts to workspace relationships', async () => {
      const payload = { source_entity_id: 'e1', target_entity_id: 'e2', relationship_type: 'related_to' };
      vi.mocked(apiClient.post).mockResolvedValue({ id: 'rel-1', ...payload });

      await createRelationship('ws-1', payload);
      expect(apiClient.post).toHaveBeenCalledWith('/workspaces/ws-1/relationships', payload);
    });

    it('updateRelationship patches relationship', async () => {
      const payload = { description: 'Clarified relationship' };
      vi.mocked(apiClient.patch).mockResolvedValue({ id: 'rel-1' });

      await updateRelationship('rel-1', payload);
      expect(apiClient.patch).toHaveBeenCalledWith('/relationships/rel-1', payload);
    });

    it('deleteRelationship and getRelationship call correct routes', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);
      vi.mocked(apiClient.get).mockResolvedValue({ id: 'rel-1' });

      await deleteRelationship('rel-1');
      expect(apiClient.delete).toHaveBeenCalledWith('/relationships/rel-1');

      await getRelationship('rel-1');
      expect(apiClient.get).toHaveBeenCalledWith('/relationships/rel-1');
    });
  });

  describe('clusters.ts', () => {
    it('listClusters and getCluster call correct routes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);
      await listClusters('ws-1');
      expect(apiClient.get).toHaveBeenCalledWith('/workspaces/ws-1/clusters');

      await getCluster('ws-1', 'c-1');
      expect(apiClient.get).toHaveBeenCalledWith('/workspaces/ws-1/clusters/c-1');
    });

    it('generateClusters triggers clustering job', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ job_id: 'j-1', status: 'queued' });
      await generateClusters('ws-1');
      expect(apiClient.post).toHaveBeenCalledWith('/workspaces/ws-1/clusters/generate');
    });
  });

  describe('link_suggestions.ts', () => {
    it('getLinkSuggestions calls suggestions route with filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 });
      await getLinkSuggestions('ws-1', { status: 'pending', page: 2, page_size: 10 });
      expect(apiClient.get).toHaveBeenCalledWith('/workspaces/ws-1/suggestions?status=pending&page=2&page_size=10');
    });

    it('acceptSuggestion posts to accept route', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ id: 'link-1' });
      await acceptSuggestion('sug-1');
      expect(apiClient.post).toHaveBeenCalledWith('/suggestions/sug-1/accept');
    });

    it('rejectSuggestion posts to reject route', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ id: 'sug-1', status: 'rejected' });
      await rejectSuggestion('sug-1');
      expect(apiClient.post).toHaveBeenCalledWith('/suggestions/sug-1/reject');
    });
  });

  describe('graph_rag.ts', () => {
    it('runGraphRAG calls graph-rag endpoint with request payload without mutating max_hops', async () => {
      const req = { query: 'How does backpropagation work?', max_hops: 2, rerank: true };
      vi.mocked(apiClient.post).mockResolvedValue({
        answer: 'Test answer',
        citations: [],
        graph_context: { entities_traversed: [], relationships_used: [], hops: 2 },
        provider: 'ollama',
        model: 'llama3.2',
        latency_ms: 1200,
      });

      await runGraphRAG('ws-1', req);
      expect(apiClient.post).toHaveBeenCalledWith('/workspaces/ws-1/graph-rag', req);
    });
  });

  describe('graph_index.ts', () => {
    it('triggerExtraction calls extract endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ job_id: 'job-extract', status: 'queued' });
      await triggerExtraction('ws-1');
      expect(apiClient.post).toHaveBeenCalledWith('/workspaces/ws-1/graph/extract');
    });

    it('triggerReindex calls reindex endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ job_id: 'job-reindex', status: 'queued' });
      await triggerReindex('ws-1');
      expect(apiClient.post).toHaveBeenCalledWith('/workspaces/ws-1/graph/reindex');
    });
  });
});
