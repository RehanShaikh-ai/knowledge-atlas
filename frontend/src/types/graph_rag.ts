import { CitedSource } from './rag';

export interface GraphRAGRequest {
  query: string; // 1-500 chars
  max_hops: number; // 1 or 2
  context_limit?: number;
  rerank?: boolean;
  stream?: boolean;
}

export interface TraversedEntity {
  id: string;
  name: string;
  entity_type: string;
}

export interface TraversedRelationship {
  id: string;
  relationship_type: string;
  source: string;
  target: string;
}

export interface GraphContext {
  entities_traversed: TraversedEntity[];
  relationships_used: TraversedRelationship[];
  hops: number;
}

export type GraphRAGContext = GraphContext;

export interface GraphRAGResponse {
  answer: string;
  citations: CitedSource[];
  graph_context: GraphContext;
  provider: string;
  model: string;
  latency_ms: number;
}
