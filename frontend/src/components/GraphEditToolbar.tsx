import React from 'react';
import {
  Plus,
  Link as LinkIcon,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GraphEditToolbarProps {
  onAddEntity: () => void;
  onAddRelationship: () => void;
  onToggleFilters: () => void;
  isFiltersOpen?: boolean;
  activeFilterCount?: number;
  onToggleClusters: () => void;
  isClustersOpen?: boolean;
  onToggleSuggestions: () => void;
  isSuggestionsOpen?: boolean;
  pendingSuggestionCount?: number;
  onExtractGraph?: () => void;
  onReindexGraph?: () => void;
  isJobInProgress?: boolean;
  className?: string;
}

export const GraphEditToolbar: React.FC<GraphEditToolbarProps> = ({
  onAddEntity,
  onAddRelationship,
  onToggleFilters,
  isFiltersOpen = false,
  activeFilterCount = 0,
  onToggleClusters,
  isClustersOpen = false,
  onToggleSuggestions,
  isSuggestionsOpen = false,
  pendingSuggestionCount = 0,
  onExtractGraph,
  onReindexGraph,
  isJobInProgress = false,
  className,
}) => {
  return (
    <div
      data-testid="graph-edit-toolbar"
      className={cn(
        'flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/90 p-1.5 rounded-2xl backdrop-blur-xl shadow-2xl text-slate-300',
        className
      )}
    >
      {/* Add Entity */}
      <button
        type="button"
        onClick={onAddEntity}
        data-testid="toolbar-add-entity-btn"
        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm shadow-sky-500/20"
        title="Create new entity"
      >
        <Plus size={14} />
        <span>Entity</span>
      </button>

      {/* Add Relationship */}
      <button
        type="button"
        onClick={onAddRelationship}
        data-testid="toolbar-add-relationship-btn"
        className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 transition-colors flex items-center gap-1.5"
        title="Connect two entities"
      >
        <LinkIcon size={13} />
        <span>Connect</span>
      </button>

      <div className="w-[1px] h-4 bg-slate-800 mx-1" />

      {/* Toggle Filters */}
      <button
        type="button"
        onClick={onToggleFilters}
        data-testid="toolbar-toggle-filters-btn"
        className={cn(
          'px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 border',
          isFiltersOpen
            ? 'bg-sky-950/80 border-sky-500/60 text-sky-300'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        )}
        title="Filter graph nodes & relationships"
      >
        <SlidersHorizontal size={13} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono flex items-center justify-center border border-sky-500/40">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Toggle Clusters */}
      <button
        type="button"
        onClick={onToggleClusters}
        data-testid="toolbar-toggle-clusters-btn"
        className={cn(
          'px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 border',
          isClustersOpen
            ? 'bg-sky-950/80 border-sky-500/60 text-sky-300'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        )}
        title="View semantic concept clusters"
      >
        <Layers size={13} />
        <span>Clusters</span>
      </button>

      {/* Toggle Link Suggestions */}
      <button
        type="button"
        onClick={onToggleSuggestions}
        data-testid="toolbar-toggle-suggestions-btn"
        className={cn(
          'px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 border',
          isSuggestionsOpen
            ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        )}
        title="Review AI note link suggestions"
      >
        <Sparkles size={13} className="text-amber-400" />
        <span>Suggestions</span>
        {pendingSuggestionCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/40">
            {pendingSuggestionCount}
          </span>
        )}
      </button>

      {(onExtractGraph || onReindexGraph) && (
        <>
          <div className="w-[1px] h-4 bg-slate-800 mx-1" />

          {onExtractGraph && (
            <button
              type="button"
              onClick={onExtractGraph}
              disabled={isJobInProgress}
              data-testid="toolbar-extract-btn"
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Run entity & relationship extraction on notes"
            >
              <Cpu size={13} />
              <span>Extract</span>
            </button>
          )}

          {onReindexGraph && (
            <button
              type="button"
              onClick={onReindexGraph}
              disabled={isJobInProgress}
              data-testid="toolbar-reindex-btn"
              className="px-2 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors flex items-center gap-1 disabled:opacity-50"
              title="Reindex full workspace knowledge graph"
            >
              <RefreshCw size={13} className={isJobInProgress ? 'animate-spin text-sky-400' : ''} />
              <span>Reindex</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
