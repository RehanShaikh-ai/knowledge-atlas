import React, { useEffect, useState, useCallback } from 'react';
import { GraphEntity, EntityProvenanceResponse } from '@/types/graph_entity';
import { GraphResponse, GraphNodeResponse, GraphEdgeResponse } from '@/types/graph';
import { getEntity, getEntityProvenance, deleteEntity } from '@/api/entities';
import { getEntityNeighborhood } from '@/api/graph';
import { getEntityTypeColor } from '@/lib/graph_constants';
import {
  Sparkles,
  User,
  ArrowRight,
  ExternalLink,
  Edit2,
  Trash2,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  FileText,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KnowledgeExplorerProps {
  entityId: string;
  onClose: () => void;
  onSelectEntity?: (entityId: string) => void;
  onNavigateToNote?: (noteId: string) => void;
  onEditEntity?: (entity: GraphEntity) => void;
  onAddRelationship?: (sourceEntity: GraphEntity) => void;
  onEntityDeleted?: (entityId: string) => void;
  className?: string;
}

export const KnowledgeExplorer: React.FC<KnowledgeExplorerProps> = ({
  entityId,
  onClose,
  onSelectEntity,
  onNavigateToNote,
  onEditEntity,
  onAddRelationship,
  onEntityDeleted,
  className,
}) => {
  const [entity, setEntity] = useState<GraphEntity | null>(null);
  const [neighborhood, setNeighborhood] = useState<GraphResponse | null>(null);
  const [provenance, setProvenance] = useState<EntityProvenanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'connections' | 'provenance'>('connections');

  const loadEntityData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [entData, neighData, provData] = await Promise.all([
        getEntity(entityId),
        getEntityNeighborhood(entityId).catch(() => null),
        getEntityProvenance(entityId).catch(() => null),
      ]);

      setEntity(entData);
      setNeighborhood(neighData);
      setProvenance(provData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load entity details';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    loadEntityData();
  }, [loadEntityData]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete entity "${entity?.name}"? All associated relationships will also be removed.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteEntity(entityId);
      if (onEntityDeleted) {
        onEntityDeleted(entityId);
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete entity';
      setError(msg);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <aside
        data-testid="knowledge-explorer"
        className={cn(
          'w-96 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center min-h-[400px]',
          className
        )}
      >
        <Loader2 size={28} className="animate-spin text-sky-400 mb-2" />
        <p className="text-xs text-slate-400">Loading entity details...</p>
      </aside>
    );
  }

  if (error || !entity) {
    return (
      <aside
        data-testid="knowledge-explorer"
        className={cn(
          'w-96 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-2xl flex flex-col',
          className
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-semibold text-rose-400">Entity Error</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle size={24} className="text-rose-400 mb-2" />
          <p className="text-xs text-rose-300">{error || 'Entity not found'}</p>
          <button
            onClick={loadEntityData}
            className="mt-3 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300"
          >
            Retry
          </button>
        </div>
      </aside>
    );
  }

  // Find connected entities in neighborhood
  const connectedNodesMap = new Map<string, GraphNodeResponse>();
  if (neighborhood) {
    neighborhood.nodes.forEach((n) => {
      if (n.id !== entity.id) {
        connectedNodesMap.set(n.id, n);
      }
    });
  }

  // Connections (outgoing and incoming)
  const outgoingLinks: Array<{ edge: GraphEdgeResponse; targetNode?: GraphNodeResponse }> = [];
  const incomingLinks: Array<{ edge: GraphEdgeResponse; sourceNode?: GraphNodeResponse }> = [];

  if (neighborhood) {
    neighborhood.edges.forEach((edge) => {
      if (edge.source_entity_id === entity.id) {
        outgoingLinks.push({
          edge,
          targetNode: connectedNodesMap.get(edge.target_entity_id),
        });
      } else if (edge.target_entity_id === entity.id) {
        incomingLinks.push({
          edge,
          sourceNode: connectedNodesMap.get(edge.source_entity_id),
        });
      }
    });
  }

  const typeColor = getEntityTypeColor(entity.entity_type);

  return (
    <aside
      data-testid="knowledge-explorer"
      className={cn(
        'w-96 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-2xl flex flex-col text-slate-200 z-30',
        className
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border"
              style={{
                borderColor: `${typeColor}50`,
                backgroundColor: `${typeColor}15`,
                color: typeColor,
              }}
            >
              {entity.entity_type}
            </span>
            {entity.is_manual ? (
              <span className="text-[10px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <User size={10} /> Manual
              </span>
            ) : (
              <span className="text-[10px] font-medium text-sky-400 bg-sky-950/60 border border-sky-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={10} /> AI Extracted
              </span>
            )}
          </div>
          <h2
            data-testid="explorer-entity-name"
            className="text-base font-bold text-slate-100 tracking-tight truncate"
            title={entity.name}
          >
            {entity.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors shrink-0"
          aria-label="Close entity explorer"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Entity Description ── */}
      <div className="py-3 border-b border-slate-800/60">
        <p
          data-testid="explorer-entity-description"
          className="text-xs text-slate-300 leading-relaxed italic"
        >
          {entity.description || 'No description available for this entity.'}
        </p>
      </div>

      {/* ── Action Toolbar ── */}
      <div className="flex items-center gap-1.5 py-2.5 border-b border-slate-800/60">
        {onEditEntity && (
          <button
            onClick={() => onEditEntity(entity)}
            className="flex-1 text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            aria-label="Edit entity"
          >
            <Edit2 size={12} /> Edit
          </button>
        )}
        {onAddRelationship && (
          <button
            onClick={() => onAddRelationship(entity)}
            className="flex-1 text-xs font-medium bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            aria-label="Add relationship"
          >
            <Plus size={12} /> Connect
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          aria-label="Delete entity"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center border-b border-slate-800 text-xs font-medium pt-2">
        <button
          onClick={() => setActiveTab('connections')}
          className={cn(
            'flex-1 pb-2 border-b-2 text-center transition-colors',
            activeTab === 'connections'
              ? 'border-sky-400 text-sky-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          Connections ({outgoingLinks.length + incomingLinks.length})
        </button>
        <button
          onClick={() => setActiveTab('provenance')}
          className={cn(
            'flex-1 pb-2 border-b-2 text-center transition-colors',
            activeTab === 'provenance'
              ? 'border-sky-400 text-sky-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          Sources ({provenance?.sources?.length || 0})
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 max-h-[360px] pr-1">
        {activeTab === 'connections' ? (
          <div className="space-y-3" data-testid="explorer-connections">
            {outgoingLinks.length === 0 && incomingLinks.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No active connections in this neighborhood.
              </div>
            ) : (
              <>
                {/* Outgoing relationships */}
                {outgoingLinks.map(({ edge, targetNode }) => (
                  <div
                    key={edge.id}
                    data-testid={`connection-${edge.id}`}
                    className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-sky-300 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/60">
                        {edge.relationship_type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {Math.round(edge.confidence * 100)}% conf
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ArrowRight size={12} className="text-slate-500 shrink-0" />
                        <span className="text-xs text-slate-200 font-medium truncate">
                          {targetNode?.name || edge.target_entity_id}
                        </span>
                      </div>
                      {targetNode && onSelectEntity && (
                        <button
                          onClick={() => onSelectEntity(targetNode.id)}
                          className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 ml-2 shrink-0"
                        >
                          Explore <ExternalLink size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Incoming relationships */}
                {incomingLinks.map(({ edge, sourceNode }) => (
                  <div
                    key={edge.id}
                    data-testid={`connection-${edge.id}`}
                    className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
                        ← {edge.relationship_type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {Math.round(edge.confidence * 100)}% conf
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-slate-200 font-medium truncate">
                          {sourceNode?.name || edge.source_entity_id}
                        </span>
                      </div>
                      {sourceNode && onSelectEntity && (
                        <button
                          onClick={() => onSelectEntity(sourceNode.id)}
                          className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 ml-2 shrink-0"
                        >
                          Explore <ExternalLink size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          /* Provenance / Sources Tab */
          <div className="space-y-2.5" data-testid="explorer-provenance">
            {!provenance || provenance.sources.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No source chunks recorded for this entity.
              </div>
            ) : (
              provenance.sources.map((src) => (
                <div
                  key={src.chunk_id}
                  data-testid={`provenance-source-${src.chunk_id}`}
                  className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText size={12} className="text-amber-400 shrink-0" />
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {src.note_title}
                      </span>
                    </div>
                    {onNavigateToNote && (
                      <button
                        onClick={() => onNavigateToNote(src.note_id)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5 shrink-0"
                      >
                        Open Note <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-3 bg-slate-900/60 p-2 rounded-lg border border-slate-800/50 font-serif leading-relaxed">
                    &ldquo;{src.excerpt}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                    <span className="flex items-center gap-1">
                      <Cpu size={10} /> {src.extraction_model}
                    </span>
                    <span>{Math.round(src.confidence * 100)}% match</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
