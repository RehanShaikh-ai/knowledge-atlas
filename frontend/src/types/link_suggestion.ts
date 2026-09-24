export type LinkSuggestionStatus = 'pending' | 'accepted' | 'rejected';

export interface LinkSuggestion {
  id: string;
  workspace_id: string;
  source_note_id: string;
  source_note_title: string;
  target_note_id: string;
  target_note_title: string;
  confidence: number;
  reason?: string | null;
  status: LinkSuggestionStatus;
  shared_entity_ids?: string[] | null;
  created_at: string;
  decided_at?: string | null;
}

export interface LinkSuggestionDecision {
  action: 'accept' | 'reject';
  suggestion_id: string;
}

export interface LinkSuggestionListResponse {
  items: LinkSuggestion[];
  total: number;
  page: number;
  page_size: number;
}
