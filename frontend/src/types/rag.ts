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
}

export interface RAGResponse {
  answer: string;
  citations: CitedSource[];
  context_chunk_count: number;
  provider: string;
  model: string;
  latency_ms: number;
  reranking_applied: boolean;
  // Included from §11.4 AI-Edit Approval Flow
  pending_ai_edit?: {
    content: string;
    message?: string;
  };
}

export type RAGStreamEvent = 
  | { type: 'chunk'; content: string }
  | { type: 'done'; citations: CitedSource[]; provider: string; model: string; latency_ms?: number }
  | { type: 'error'; code: string; message: string };
