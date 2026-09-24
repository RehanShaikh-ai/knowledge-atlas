import React, { useState } from 'react';
import { GraphQueryParams, GraphClusterSummary } from '@/types/graph';
import { ENTITY_TYPES, EntityType } from '@/types/graph_entity';
import { ENTITY_TYPE_COLORS, COMMON_RELATIONSHIP_TYPES } from '@/lib/graph_constants';
import { RotateCcw, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GraphFilterPanelProps {
  filters: GraphQueryParams;
  onChange: (filters: GraphQueryParams) => void;
  clusters?: GraphClusterSummary[];
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const GraphFilterPanel: React.FC<GraphFilterPanelProps> = ({
  filters,
  onChange,
  clusters = [],
  isOpen = true,
  onClose,
  className,
}) => {
  const [localFilters, setLocalFilters] = useState<GraphQueryParams>(filters);

  // Keep local filters in sync with external prop
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const activeFilterCount = [
    localFilters.entity_type,
    localFilters.relationship_type,
    localFilters.cluster_id,
    localFilters.note_id,
    localFilters.min_confidence && localFilters.min_confidence > 0,
    localFilters.limit && localFilters.limit !== 500,
  ].filter(Boolean).length;

  const handleChange = (key: keyof GraphQueryParams, value: unknown) => {
    const updated = {
      ...localFilters,
      [key]: value === '' || value === undefined ? undefined : value,
    };
    setLocalFilters(updated);
    onChange(updated);
  };

  const handleReset = () => {
    const emptyFilters: GraphQueryParams = {
      entity_type: undefined,
      relationship_type: undefined,
      cluster_id: undefined,
      note_id: undefined,
      min_confidence: 0,
      limit: 500,
    };
    setLocalFilters(emptyFilters);
    onChange(emptyFilters);
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="graph-filter-panel"
      className={cn(
        'bg-slate-900/95 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl shadow-2xl text-slate-200 w-80 space-y-4.5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-sky-500/10 text-sky-400">
            <SlidersHorizontal size={15} />
          </div>
          <h3 className="font-semibold text-xs tracking-wide uppercase text-slate-300">
            Graph Filters
          </h3>
          {activeFilterCount > 0 && (
            <span
              data-testid="active-filter-badge"
              className="bg-sky-500/20 text-sky-300 text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-sky-500/30"
            >
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="text-[11px] text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800/60 transition-colors flex items-center gap-1"
              title="Reset all filters"
              aria-label="Reset filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800/60 transition-colors"
              aria-label="Close filters"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Filter by Entity Type */}
      <div className="space-y-1.5">
        <label
          htmlFor="filter-entity-type"
          className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block"
        >
          Entity Type
        </label>
        <select
          id="filter-entity-type"
          data-testid="filter-entity-type"
          value={localFilters.entity_type || ''}
          onChange={(e) => handleChange('entity_type', e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
        >
          <option value="">All Entity Types</option>
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        {/* Quick Pills for Common Types */}
        <div className="flex flex-wrap gap-1 pt-1">
          {(['concept', 'person', 'technology', 'project'] as EntityType[]).map((type) => {
            const isSelected = localFilters.entity_type === type;
            const color = ENTITY_TYPE_COLORS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleChange('entity_type', isSelected ? undefined : type)}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[10px] capitalize transition-colors flex items-center gap-1 border',
                  isSelected
                    ? 'bg-sky-950 border-sky-500/60 text-sky-200'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter by Relationship Type */}
      <div className="space-y-1.5">
        <label
          htmlFor="filter-relationship-type"
          className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block"
        >
          Relationship Type
        </label>
        <input
          id="filter-relationship-type"
          data-testid="filter-relationship-type"
          type="text"
          placeholder="e.g. prerequisite_of, part_of"
          value={localFilters.relationship_type || ''}
          onChange={(e) => handleChange('relationship_type', e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1 pt-0.5">
          {COMMON_RELATIONSHIP_TYPES.slice(0, 4).map((rel) => (
            <button
              key={rel}
              type="button"
              onClick={() =>
                handleChange(
                  'relationship_type',
                  localFilters.relationship_type === rel ? undefined : rel
                )
              }
              className={cn(
                'px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors',
                localFilters.relationship_type === rel
                  ? 'bg-sky-950/80 border-sky-500/60 text-sky-300'
                  : 'bg-slate-950/40 border-slate-800/60 text-slate-500 hover:text-slate-300'
              )}
            >
              {rel}
            </button>
          ))}
        </div>
      </div>

      {/* Filter by Cluster */}
      {clusters.length > 0 && (
        <div className="space-y-1.5">
          <label
            htmlFor="filter-cluster-id"
            className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block"
          >
            Cluster
          </label>
          <select
            id="filter-cluster-id"
            data-testid="filter-cluster-id"
            value={localFilters.cluster_id || ''}
            onChange={(e) => handleChange('cluster_id', e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="">All Clusters</option>
            {clusters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} ({c.member_count} members)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter by Minimum Confidence Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="filter-min-confidence"
            className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block"
          >
            Min Relationship Confidence
          </label>
          <span className="text-xs font-mono text-sky-400">
            {Math.round((localFilters.min_confidence || 0) * 100)}%
          </span>
        </div>
        <input
          id="filter-min-confidence"
          data-testid="filter-min-confidence"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={localFilters.min_confidence || 0}
          onChange={(e) => handleChange('min_confidence', parseFloat(e.target.value))}
          className="w-full accent-sky-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Max Nodes Limit */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="filter-limit"
            className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block"
          >
            Max Nodes (Limit)
          </label>
          <span className="text-xs font-mono text-slate-400">{localFilters.limit || 500}</span>
        </div>
        <select
          id="filter-limit"
          data-testid="filter-limit"
          value={localFilters.limit || 500}
          onChange={(e) => handleChange('limit', parseInt(e.target.value, 10))}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
        >
          <option value={100}>100 nodes</option>
          <option value={250}>250 nodes</option>
          <option value={500}>500 nodes (Default)</option>
          <option value={1000}>1000 nodes</option>
          <option value={2000}>2000 nodes (Maximum)</option>
        </select>
      </div>
    </div>
  );
};
