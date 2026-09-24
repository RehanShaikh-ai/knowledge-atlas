import React, { useState } from 'react';
import {
  GraphRelationship,
  GraphRelationshipCreate,
  GraphRelationshipUpdate,
} from '@/types/graph_relationship';
import { GraphEntity } from '@/types/graph_entity';
import { createRelationship, updateRelationship } from '@/api/relationships';
import { COMMON_RELATIONSHIP_TYPES } from '@/lib/graph_constants';
import { ApiError } from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2, AlertTriangle, Check, ArrowRight, X } from 'lucide-react';

export interface RelationshipEditorProps {
  workspaceId: string;
  relationship?: GraphRelationship | null; // null/undefined for create, populated for edit
  sourceEntity?: GraphEntity | null;
  availableEntities?: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (relationship: GraphRelationship) => void;
}

export const RelationshipEditor: React.FC<RelationshipEditorProps> = ({
  workspaceId,
  relationship,
  sourceEntity,
  availableEntities = [],
  isOpen,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(relationship);
  const [sourceId, setSourceId] = useState<string>(
    relationship?.source_entity_id || sourceEntity?.id || ''
  );
  const [targetId, setTargetId] = useState<string>(
    relationship?.target_entity_id || ''
  );
  const [relationshipType, setRelationshipType] = useState<string>(
    relationship?.relationship_type || 'related_to'
  );
  const [description, setDescription] = useState<string>(
    relationship?.description || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state on prop changes
  React.useEffect(() => {
    if (relationship) {
      setSourceId(relationship.source_entity_id);
      setTargetId(relationship.target_entity_id);
      setRelationshipType(relationship.relationship_type);
      setDescription(relationship.description || '');
    } else {
      setSourceId(sourceEntity?.id || (availableEntities[0]?.id || ''));
      setTargetId(
        availableEntities.find((e) => e.id !== (sourceEntity?.id || availableEntities[0]?.id))?.id || ''
      );
      setRelationshipType('related_to');
      setDescription('');
    }
    setError(null);
  }, [relationship, sourceEntity, availableEntities, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing) {
      if (!sourceId || !targetId) {
        setError('Both source and target entities must be selected.');
        return;
      }
      if (sourceId === targetId) {
        setError('Self-relationships are not allowed. Source and target must be distinct entities.');
        return;
      }
    }

    const trimmedType = relationshipType.trim();
    if (!trimmedType) {
      setError('Relationship type cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && relationship) {
        const payload: GraphRelationshipUpdate = {
          relationship_type: trimmedType,
          description: description.trim() || null,
        };
        const updated = await updateRelationship(relationship.id, payload);
        onSave(updated);
        onClose();
      } else {
        const payload: GraphRelationshipCreate = {
          source_entity_id: sourceId,
          target_entity_id: targetId,
          relationship_type: trimmedType,
          description: description.trim() || undefined,
        };
        const created = await createRelationship(workspaceId, payload);
        onSave(created);
        onClose();
      }
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.error?.code === 'CONFLICT') {
        setError(`A relationship with type "${trimmedType}" already exists between these two entities.`);
      } else {
        setError(apiErr?.error?.message || 'Failed to save relationship');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h3 className="font-semibold text-sm text-slate-200">
          {isEditing ? 'Edit Relationship' : 'Create Graph Relationship'}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} data-testid="relationship-editor-form" className="p-4 space-y-4">
        {error && (
          <div
            data-testid="relationship-editor-error"
            className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Source and Target Entities (Immutable in edit mode) */}
        {!isEditing ? (
          <div className="space-y-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="space-y-1">
              <label
                htmlFor="rel-source-select"
                className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block"
              >
                Source Entity <span className="text-rose-400">*</span>
              </label>
              <select
                id="rel-source-select"
                data-testid="rel-source-select"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="" disabled>Select source entity</option>
                {availableEntities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center text-slate-500 py-0.5">
              <ArrowRight size={14} />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="rel-target-select"
                className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block"
              >
                Target Entity <span className="text-rose-400">*</span>
              </label>
              <select
                id="rel-target-select"
                data-testid="rel-target-select"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="" disabled>Select target entity</option>
                {availableEntities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Note:</span> Source and target entities are immutable for an existing relationship.
          </div>
        )}

        {/* Relationship Type */}
        <div className="space-y-1.5">
          <label
            htmlFor="rel-type-input"
            className="text-xs font-medium text-slate-300 uppercase tracking-wider block"
          >
            Relationship Type <span className="text-rose-400">*</span>
          </label>
          <input
            id="rel-type-input"
            data-testid="rel-type-input"
            type="text"
            required
            maxLength={100}
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
            placeholder="e.g. prerequisite_of, part_of, contradicts"
            className="w-full bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono transition-all shadow-inner"
          />

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1 pt-1">
            {COMMON_RELATIONSHIP_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setRelationshipType(type)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                  relationshipType === type
                    ? 'bg-sky-950 border-sky-500/60 text-sky-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label
            htmlFor="rel-description-input"
            className="text-xs font-medium text-slate-300 uppercase tracking-wider block"
          >
            Description <span className="text-slate-500 text-[10px] lowercase">(optional)</span>
          </label>
          <textarea
            id="rel-description-input"
            data-testid="rel-description-input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the nature of this connection..."
            className="w-full bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all resize-none shadow-inner leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="relationship-submit-btn"
            disabled={isSubmitting || !relationshipType.trim()}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-sky-500/20"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            <span>{isEditing ? 'Save Changes' : 'Connect Entities'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
