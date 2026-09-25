import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConstellationGraph } from './ConstellationGraph';
import { GraphResponse } from '@/types/graph';

// Mock react-force-graph-2d
vi.mock('react-force-graph-2d', async () => {
  const React = await import('react');
  const MockForceGraph2D = React.forwardRef<
    { zoom: () => number; zoomToFit: () => void },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >(({ graphData, onNodeClick }, ref) => {
    React.useImperativeHandle(ref, () => ({
      zoom: () => 1,
      zoomToFit: () => {},
    }));

    return (
      <div data-testid="force-graph-mock">
        {graphData?.nodes?.map((node: { id: string; name: string }) => (
          <button
            key={node.id}
            data-testid={`graph-node-${node.id}`}
            onClick={() => onNodeClick && onNodeClick(node)}
          >
            {node.name}
          </button>
        ))}
      </div>
    );
  });
  MockForceGraph2D.displayName = 'MockForceGraph2D';
  return { default: MockForceGraph2D };
});

const mockGraphData: GraphResponse = {
  nodes: [
    {
      id: 'entity-1',
      name: 'Neural Networks',
      entity_type: 'concept',
      cluster_id: 'c1',
      is_manual: false,
      degree: 4,
      note_count: 2,
    },
    {
      id: 'entity-2',
      name: 'Backpropagation',
      entity_type: 'concept',
      cluster_id: 'c1',
      is_manual: true,
      degree: 3,
      note_count: 1,
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source_entity_id: 'entity-1',
      target_entity_id: 'entity-2',
      relationship_type: 'prerequisite_of',
      confidence: 0.95,
      is_manual: false,
    },
  ],
  clusters: [{ id: 'c1', label: 'Deep Learning', member_count: 2 }],
  stats: {
    node_count: 2,
    edge_count: 1,
    cluster_count: 1,
    truncated: false,
  },
};

describe('ConstellationGraph (§5.7, §14.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders graph nodes and stats', () => {
    render(<ConstellationGraph workspaceId="ws-1" graphData={mockGraphData} />);

    expect(screen.getByTestId('constellation-graph')).toBeInTheDocument();
    expect(screen.getByTestId('graph-stats-indicator')).toHaveTextContent('2 entities');
    expect(screen.getByTestId('graph-stats-indicator')).toHaveTextContent('1 relationships');
    expect(screen.getByTestId('graph-node-entity-1')).toBeInTheDocument();
    expect(screen.getByTestId('graph-node-entity-2')).toBeInTheDocument();
    expect(screen.queryByTestId('graph-truncation-indicator')).not.toBeInTheDocument();
  });

  it('renders visible truncation indicator when truncated is true', () => {
    const truncatedData: GraphResponse = {
      ...mockGraphData,
      stats: {
        ...mockGraphData.stats,
        node_count: 2500,
        truncated: true,
      },
    };

    render(<ConstellationGraph workspaceId="ws-1" graphData={truncatedData} />);

    const truncationBadge = screen.getByTestId('graph-truncation-indicator');
    expect(truncationBadge).toBeInTheDocument();
    expect(truncationBadge).toHaveTextContent('Graph Truncated:');
    expect(truncationBadge).toHaveTextContent('2500 total entities');
  });

  it('handles node selection on click', () => {
    const onSelect = vi.fn();
    render(
      <ConstellationGraph
        workspaceId="ws-1"
        graphData={mockGraphData}
        onSelectEntity={onSelect}
      />
    );

    fireEvent.click(screen.getByTestId('graph-node-entity-1'));
    expect(onSelect).toHaveBeenCalledWith('entity-1');
  });

  it('renders loading state when isLoading is true', () => {
    render(<ConstellationGraph workspaceId="ws-1" isLoading={true} />);
    expect(screen.getByTestId('graph-loading')).toBeInTheDocument();
    expect(screen.getByText('Aligning constellation...')).toBeInTheDocument();
  });

  it('renders error state and triggers refresh on retry', () => {
    const onRefresh = vi.fn();
    const error = new Error('Network connection timeout');
    render(
      <ConstellationGraph
        workspaceId="ws-1"
        error={error}
        onRefresh={onRefresh}
      />
    );

    expect(screen.getByTestId('graph-error')).toBeInTheDocument();
    expect(screen.getByText('Network connection timeout')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('renders empty state when graphData has no nodes', () => {
    const emptyData: GraphResponse = {
      nodes: [],
      edges: [],
      clusters: [],
      stats: { node_count: 0, edge_count: 0, cluster_count: 0, truncated: false },
    };

    render(<ConstellationGraph workspaceId="ws-1" graphData={emptyData} />);
    expect(screen.getByTestId('graph-empty')).toBeInTheDocument();
    expect(screen.getByText('No Entities in Constellation')).toBeInTheDocument();
  });
});
