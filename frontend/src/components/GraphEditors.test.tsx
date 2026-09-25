import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityEditor } from './EntityEditor';
import { RelationshipEditor } from './RelationshipEditor';
import { GraphEditToolbar } from './GraphEditToolbar';
import * as entitiesApi from '@/api/entities';
import * as relationshipsApi from '@/api/relationships';

vi.mock('@/api/entities', () => ({
  createEntity: vi.fn(),
  updateEntity: vi.fn(),
}));

vi.mock('@/api/relationships', () => ({
  createRelationship: vi.fn(),
  updateRelationship: vi.fn(),
}));

describe('EntityEditor & RelationshipEditor & GraphEditToolbar (§5.7, §14.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('EntityEditor', () => {
    it('creates a new entity on form submit', async () => {
      const onSave = vi.fn();
      const onClose = vi.fn();
      const createdEntity = {
        id: 'new-ent-1',
        workspace_id: 'ws-1',
        name: 'Attention Mechanism',
        entity_type: 'concept' as const,
        description: 'Key component in Transformer models',
        is_manual: true,
        created_at: '',
        updated_at: '',
      };
      vi.mocked(entitiesApi.createEntity).mockResolvedValue(createdEntity);

      render(
        <EntityEditor
          workspaceId="ws-1"
          isOpen={true}
          onClose={onClose}
          onSave={onSave}
        />
      );

      fireEvent.change(screen.getByTestId('entity-name-input'), {
        target: { value: 'Attention Mechanism' },
      });
      fireEvent.change(screen.getByTestId('entity-type-select'), {
        target: { value: 'concept' },
      });
      fireEvent.change(screen.getByTestId('entity-description-input'), {
        target: { value: 'Key component in Transformer models' },
      });

      fireEvent.click(screen.getByTestId('entity-submit-btn'));

      await waitFor(() => {
        expect(entitiesApi.createEntity).toHaveBeenCalledWith('ws-1', {
          name: 'Attention Mechanism',
          entity_type: 'concept',
          description: 'Key component in Transformer models',
        });
        expect(onSave).toHaveBeenCalledWith(createdEntity);
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('updates an existing entity on form submit', async () => {
      const onSave = vi.fn();
      const onClose = vi.fn();
      const existing = {
        id: 'ent-1',
        workspace_id: 'ws-1',
        name: 'Transformer',
        entity_type: 'technology' as const,
        description: 'Original description',
        is_manual: true,
        created_at: '',
        updated_at: '',
      };
      vi.mocked(entitiesApi.updateEntity).mockResolvedValue({
        ...existing,
        description: 'Updated description',
      });

      render(
        <EntityEditor
          workspaceId="ws-1"
          entity={existing}
          isOpen={true}
          onClose={onClose}
          onSave={onSave}
        />
      );

      fireEvent.change(screen.getByTestId('entity-description-input'), {
        target: { value: 'Updated description' },
      });

      fireEvent.click(screen.getByTestId('entity-submit-btn'));

      await waitFor(() => {
        expect(entitiesApi.updateEntity).toHaveBeenCalledWith('ent-1', {
          name: 'Transformer',
          entity_type: 'technology',
          description: 'Updated description',
        });
        expect(onSave).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('handles 409 conflict error when entity name already exists', async () => {
      vi.mocked(entitiesApi.createEntity).mockRejectedValue({
        error: { code: 'CONFLICT', message: 'Entity name already exists' },
      });

      render(
        <EntityEditor
          workspaceId="ws-1"
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      );

      fireEvent.change(screen.getByTestId('entity-name-input'), {
        target: { value: 'Duplicate' },
      });
      fireEvent.click(screen.getByTestId('entity-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('entity-editor-error')).toHaveTextContent(
          'An entity named "Duplicate" already exists'
        );
      });
    });
  });

  describe('RelationshipEditor', () => {
    const available = [
      { id: 'e1', name: 'Neural Networks' },
      { id: 'e2', name: 'Backpropagation' },
    ];

    it('rejects self-relationships with validation message', async () => {
      render(
        <RelationshipEditor
          workspaceId="ws-1"
          availableEntities={available}
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      );

      fireEvent.change(screen.getByTestId('rel-source-select'), {
        target: { value: 'e1' },
      });
      fireEvent.change(screen.getByTestId('rel-target-select'), {
        target: { value: 'e1' },
      });

      fireEvent.click(screen.getByTestId('relationship-submit-btn'));

      expect(screen.getByTestId('relationship-editor-error')).toHaveTextContent(
        'Self-relationships are not allowed'
      );
      expect(relationshipsApi.createRelationship).not.toHaveBeenCalled();
    });

    it('creates relationship when valid', async () => {
      const onSave = vi.fn();
      const onClose = vi.fn();
      const createdRel = {
        id: 'rel-1',
        workspace_id: 'ws-1',
        source_entity_id: 'e1',
        target_entity_id: 'e2',
        relationship_type: 'prerequisite_of',
        confidence: 1.0,
        is_manual: true,
        created_at: '',
        updated_at: '',
      };
      vi.mocked(relationshipsApi.createRelationship).mockResolvedValue(createdRel);

      render(
        <RelationshipEditor
          workspaceId="ws-1"
          availableEntities={available}
          isOpen={true}
          onClose={onClose}
          onSave={onSave}
        />
      );

      fireEvent.change(screen.getByTestId('rel-source-select'), {
        target: { value: 'e1' },
      });
      fireEvent.change(screen.getByTestId('rel-target-select'), {
        target: { value: 'e2' },
      });
      fireEvent.change(screen.getByTestId('rel-type-input'), {
        target: { value: 'prerequisite_of' },
      });

      fireEvent.click(screen.getByTestId('relationship-submit-btn'));

      await waitFor(() => {
        expect(relationshipsApi.createRelationship).toHaveBeenCalledWith('ws-1', {
          source_entity_id: 'e1',
          target_entity_id: 'e2',
          relationship_type: 'prerequisite_of',
          description: undefined,
        });
        expect(onSave).toHaveBeenCalledWith(createdRel);
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('GraphEditToolbar', () => {
    it('emits toolbar action callbacks', () => {
      const onAddEntity = vi.fn();
      const onAddRelationship = vi.fn();
      const onToggleFilters = vi.fn();
      const onToggleClusters = vi.fn();
      const onToggleSuggestions = vi.fn();
      const onExtractGraph = vi.fn();
      const onReindexGraph = vi.fn();

      render(
        <GraphEditToolbar
          onAddEntity={onAddEntity}
          onAddRelationship={onAddRelationship}
          onToggleFilters={onToggleFilters}
          onToggleClusters={onToggleClusters}
          onToggleSuggestions={onToggleSuggestions}
          onExtractGraph={onExtractGraph}
          onReindexGraph={onReindexGraph}
        />
      );

      fireEvent.click(screen.getByTestId('toolbar-add-entity-btn'));
      expect(onAddEntity).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('toolbar-add-relationship-btn'));
      expect(onAddRelationship).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('toolbar-toggle-filters-btn'));
      expect(onToggleFilters).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('toolbar-toggle-clusters-btn'));
      expect(onToggleClusters).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('toolbar-toggle-suggestions-btn'));
      expect(onToggleSuggestions).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('toolbar-extract-btn'));
      expect(onExtractGraph).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('toolbar-reindex-btn'));
      expect(onReindexGraph).toHaveBeenCalled();
    });
  });
});
