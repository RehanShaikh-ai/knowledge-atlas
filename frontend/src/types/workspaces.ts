export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreate {
  name: string;
  description?: string | null;
  owner_id: string;
}

export interface WorkspaceListResponse {
  items: Workspace[];
  total: number;
}
