import React from 'react';
import {
  Plus,
  Link as LinkIcon,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Cpu,
  RefreshCw,
  Loader2,
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
  activeJobType?: string | null;
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
  activeJobType = null,
  className,
}) => {
  const isExtracting = isJobInProgress && (activeJobType?.startsWith('extract') || activeJobType === 'pending_extract');
  const isReindexing = isJobInProgress && (activeJobType === 'reindex_graph' || activeJobType === 'pending_reindex');

  return (
    <div
      data-testid="graph-edit-toolbar"
      className={cn(
        'flex items-center gap-1.5 bg-slate-950/70 border border-white/[0.08] p-1.5 rounded-2xl backdrop-blur-2xl shadow-2xl shadow-black/50 text-slate-300',
        className
      )}
    >
      {/* Add Entity */}
      <button
        type="button"
        onClick={onAddEntity}
        data-testid="toolbar-add-entity-btn"
        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/25 hover:-translate-y-0.5"
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
        className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] hover:border-white/[0.16] transition-all flex items-center gap-1.5 hover:-translate-y-0.5"
        title="Connect two entities"
      >
        <LinkIcon size={13} />
        <span>Connect</span>
      </button>

      <div className="w-[1px] h-4 bg-white/[0.08] mx-1" />

      {/* Toggle Filters */}
      <button
        type="button"
        onClick={onToggleFilters}
        data-testid="toolbar-toggle-filters-btn"
        className={cn(
          'px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border',
          isFiltersOpen
            ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-sm'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
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
          'px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border',
          isClustersOpen
            ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-sm'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
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
          'px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border',
          isSuggestionsOpen
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
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
          <div className="w-[1px] h-4 bg-white/[0.08] mx-1" />

          {onExtractGraph && (
            <button
              type="button"
              onClick={onExtractGraph}
              disabled={isJobInProgress}
              data-testid="toolbar-extract-btn"
              data-action="extract"
              aria-busy={isExtracting}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border',
                isExtracting
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-sm cursor-not-allowed'
                  : isJobInProgress
                  ? 'border-transparent text-slate-600 opacity-50 cursor-not-allowed'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              )}
              title="Run entity & relationship extraction on notes"
            >
              {isExtracting ? (
                <Loader2 size={13} className="animate-spin text-sky-400" />
              ) : (
                <Cpu size={13} />
              )}
              <span>{isExtracting ? 'Extracting...' : 'Extract'}</span>
            </button>
          )}

          {onReindexGraph && (
            <button
              type="button"
              onClick={onReindexGraph}
              disabled={isJobInProgress}
              data-testid="toolbar-reindex-btn"
              data-action="reindex"
              aria-busy={isReindexing}
              className={cn(
                'px-2 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 border',
                isReindexing
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-sm cursor-not-allowed'
                  : isJobInProgress
                  ? 'border-transparent text-slate-600 opacity-50 cursor-not-allowed'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              )}
              title="Reindex full workspace knowledge graph"
            >
              <RefreshCw
                size={13}
                className={isReindexing ? 'animate-spin text-sky-400' : ''}
              />
              <span>{isReindexing ? 'Reindexing...' : 'Reindex'}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
