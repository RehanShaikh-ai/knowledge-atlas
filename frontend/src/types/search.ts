export type SearchMode = 'semantic' | 'lexical' | 'hybrid';

export interface SearchRequest {
  query: string; // 1-500 chars, required
  mode?: SearchMode;
  limit?: number;
  include_archived?: boolean;
}

export interface SearchResultItem {
  note_id: string; // uuid
  chunk_id: string; // uuid
  title: string;
  excerpt: string; // matched chunk content, truncated to 500 chars
  score: number;
  score_meaning: string;
  search_mode: string;
  is_archived: boolean;
}

export interface SearchResponse {
  results: SearchResultItem[];
}
