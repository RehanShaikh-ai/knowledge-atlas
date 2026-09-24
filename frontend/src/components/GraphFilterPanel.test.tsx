import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GraphFilterPanel } from './GraphFilterPanel';
import { GraphQueryParams } from '@/types/graph';

describe('GraphFilterPanel (§5.7, §14.2)', () => {
  const initialFilters: GraphQueryParams = {
    entity_type: undefined,
    relationship_type: undefined,
    cluster_id: undefined,
    note_id: undefined,
    min_confidence: 0,
    limit: 500,
  };

  it('renders all filter controls and applies entity type filter', () => {
    const onChange = vi.fn();
    render(<GraphFilterPanel filters={initialFilters} onChange={onChange} />);

    expect(screen.getByTestId('graph-filter-panel')).toBeInTheDocument();
    expect(screen.getByTestId('filter-entity-type')).toBeInTheDocument();
    expect(screen.getByTestId('filter-relationship-type')).toBeInTheDocument();
    expect(screen.getByTestId('filter-min-confidence')).toBeInTheDocument();
    expect(screen.getByTestId('filter-limit')).toBeInTheDocument();

    const entitySelect = screen.getByTestId('filter-entity-type');
    fireEvent.change(entitySelect, { target: { value: 'concept' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ entity_type: 'concept' })
    );
  });

  it('emits changes when relationship type input is modified', () => {
    const onChange = vi.fn();
    render(<GraphFilterPanel filters={initialFilters} onChange={onChange} />);

    const relInput = screen.getByTestId('filter-relationship-type');
    fireEvent.change(relInput, { target: { value: 'prerequisite_of' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ relationship_type: 'prerequisite_of' })
    );
  });

  it('emits changes when minimum confidence slider is adjusted', () => {
    const onChange = vi.fn();
    render(<GraphFilterPanel filters={initialFilters} onChange={onChange} />);

    const confSlider = screen.getByTestId('filter-min-confidence');
    fireEvent.change(confSlider, { target: { value: '0.85' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ min_confidence: 0.85 })
    );
  });

  it('resets filters when reset button is clicked', () => {
    const onChange = vi.fn();
    const activeFilters: GraphQueryParams = {
      entity_type: 'person',
      relationship_type: 'mentions',
      min_confidence: 0.5,
      limit: 100,
    };

    render(<GraphFilterPanel filters={activeFilters} onChange={onChange} />);

    expect(screen.getByTestId('active-filter-badge')).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: undefined,
        relationship_type: undefined,
        min_confidence: 0,
        limit: 500,
      })
    );
  });
});
