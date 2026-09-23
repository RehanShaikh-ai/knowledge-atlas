export type ActivityEventType = 
  | 'note_created' 
  | 'note_updated' 
  | 'note_deleted' 
  | 'note_restored' 
  | 'note_indexed' 
  | 'import_completed';

export interface ActivityItem {
  id: string;
  event_type: ActivityEventType;
  note_id: string | null;
  note_title: string | null;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ActivityResponse {
  items: ActivityItem[];
  total: number;
}
