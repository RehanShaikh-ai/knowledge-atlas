export interface ClusterMember {
  note_id: string;
  note_title?: string;
  score: number;
}

export interface ClusterResponse {
  id: string;
  workspace_id: string;
  label: string;
  description?: string | null;
  member_count?: number;
  members?: ClusterMember[];
  created_at?: string;
  updated_at?: string;
}
