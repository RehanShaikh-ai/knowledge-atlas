export interface GraphSearchEntityMatch {
  id: string;
  name: string;
  entity_type: string;
  match_field: string;
}

export interface GraphSearchNoteMatch {
  id: string;
  title: string;
  match_reason: string;
}

export interface GraphSearchResponse {
  entities: GraphSearchEntityMatch[];
  notes: GraphSearchNoteMatch[];
  total: number;
}
