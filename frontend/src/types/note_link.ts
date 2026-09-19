export interface NoteLink {
  source_note_id: string;
  target_note_id: string;
  created_at: string;
}

export interface NoteLinksResponse {
  outgoing: NoteLink[];
  incoming: NoteLink[];
}
