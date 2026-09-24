export type EntityType =
  | 'concept'
  | 'person'
  | 'technology'
  | 'project'
  | 'place'
  | 'event'
  | 'unknown';

export const ENTITY_TYPES: EntityType[] = [
  'concept',
  'person',
  'technology',
  'project',
  'place',
  'event',
  'unknown',
];

export interface GraphEntity {
  id: string;
  workspace_id: string;
  name: string;
  entity_type: EntityType;
  description?: string | null;
  is_manual: boolean;
  cluster_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GraphEntityCreate {
  name: string;
  entity_type: EntityType;
  description?: string;
}

export interface GraphEntityUpdate {
  name?: string;
  entity_type?: EntityType;
  description?: string | null;
}

export interface EntityProvenanceSource {
  chunk_id: string;
  note_id: string;
  note_title: string;
  excerpt: string;
  extraction_model: string;
  confidence: number;
}

export interface EntityProvenanceResponse {
  entity_id: string;
  sources: EntityProvenanceSource[];
}
