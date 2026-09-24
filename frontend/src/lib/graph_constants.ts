import { EntityType } from '@/types/graph_entity';

export const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  concept: '#38bdf8',    // sky blue
  person: '#a78bfa',     // violet / mauve
  technology: '#2dd4bf', // teal
  project: '#fbbf24',    // amber
  place: '#4ade80',     // emerald green
  event: '#f43f5e',      // rose
  unknown: '#94a3b8',    // slate
};

export function getEntityTypeColor(type?: string): string {
  if (!type) return ENTITY_TYPE_COLORS.unknown;
  const key = type.toLowerCase() as EntityType;
  return ENTITY_TYPE_COLORS[key] || ENTITY_TYPE_COLORS.unknown;
}

export const COMMON_RELATIONSHIP_TYPES = [
  'related_to',
  'part_of',
  'prerequisite_of',
  'used_in',
  'contradicts',
  'causes',
  'mentions',
];
