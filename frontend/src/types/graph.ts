export interface GraphNode {
  id: string;
  title: string;
  is_pinned: boolean;
  tag_names: string[];
  degree: number;
}

export interface GraphEdge {
  source_note_id: string;
  target_note_id: string;
}

export interface GraphStats {
  node_count: number;
  edge_count: number;
  isolated_count: number;
  truncated: boolean;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;
}
