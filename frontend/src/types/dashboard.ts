export interface MostConnectedNote {
  id: string;
  title: string;
  degree: number;
}

export interface TagDistribution {
  tag: string;
  note_count: number;
}

export interface ImportStatusSummary {
  completed: number;
  failed: number;
  skipped: number;
}

export interface DashboardStats {
  total_notes: number;
  total_relationships: number;
  total_tags: number;
  total_sources: number;
  notes_created_last_7_days: number;
  isolated_notes_count: number;
  most_connected_notes: MostConnectedNote[];
  tag_distribution: TagDistribution[];
  import_status_summary: ImportStatusSummary;
}
