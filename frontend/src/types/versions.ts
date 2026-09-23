export interface NoteVersion {
  id: string;
  note_id: string;
  workspace_id?: string;
  commit_hash: string;
  message: string;
  created_at: string;
  is_ai_edit: boolean;
  restored_from?: string | null;
  author_id?: string;
  content?: string;
}

export interface NoteVersionListResponse {
  items: NoteVersion[];
  total?: number;
}

export interface NoteVersionResponse extends NoteVersion {
  content?: string;
}

export interface DiffResponse {
  diff: string;
  from_commit: string;
  to_commit: string;
  note_id?: string;
}
