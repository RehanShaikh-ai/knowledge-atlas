export type SearchMode = 'semantic' | 'lexical' | 'hybrid';

export interface SavedSearch {
  id: string;
  workspace_id: string;
  name: string;
  query: string;
  search_mode: SearchMode;
  created_at: string;
}

export interface CreateSavedSearchRequest {
  name: string; // 1-150 chars
  query: string; // 1-500 chars
  search_mode: SearchMode;
}

export interface SavedSearchListResponse {
  items: SavedSearch[];
}
