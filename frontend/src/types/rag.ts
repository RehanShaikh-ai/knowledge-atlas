export interface CitedSource {
  chunk_id: string;
  note_id: string;
  title: string;
  excerpt: string;
  score: number;
}

export interface RAGRequest {
  query: string; // 1-500 chars, required
  search_mode?: 'semantic' | 'lexical' | 'hybrid';
  rerank?: boolean;
  context_limit?: number; // max 20
  stream?: boolean;
  model?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface RAGResponse {
  answer: string;
  citations: CitedSource[];
  context_chunk_count: number;
  provider: string;
  model: string;
  latency_ms: number;
  reranking_applied: boolean;
  pending_ai_edit?: {
    content: string;
    message?: string;
  };
  ai_unavailable?: boolean;
}

export interface RecommendedModel {
  id: string;
  name: string;
  description: string;
  context_window?: number;
}

export interface RAGStatusResponse {
  provider: string;
  healthy: boolean;
  current_model: string;
  base_url?: string;
  recommended_models: RecommendedModel[];
}

export type RAGStreamEvent = 
  | { type: 'chunk'; content: string }
  | { type: 'done'; citations: CitedSource[]; provider: string; model: string; latency_ms?: number }
  | { type: 'ai_unavailable'; note_count: number; citations: CitedSource[]; message: string }
  | { type: 'error'; code: string; message: string };
