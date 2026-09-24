export interface GraphRelationship {
  id: string;
  workspace_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  description?: string | null;
  confidence: number;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
}

export interface GraphRelationshipCreate {
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  description?: string;
}

export interface GraphRelationshipUpdate {
  relationship_type?: string;
  description?: string | null;
}
