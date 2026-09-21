export interface NoteVersion {
  id: string;
  note_id: string;
  commit_hash: string;
  message: string;
  created_at: string;
  is_ai_edit: boolean;
  restored_from?: string | null;
}

export interface NoteVersionListResponse {
  items: NoteVersion[];
}

export interface NoteVersionResponse {
  version: NoteVersion;
  content: string;
}

export interface DiffResponse {
  diff: string;
  from_commit: string;
  to_commit: string;
}
