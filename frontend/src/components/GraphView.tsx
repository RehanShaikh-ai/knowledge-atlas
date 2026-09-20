import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getWorkspaceGraph } from '@/api/graph';
import { GraphResponse } from '@/types/graph';
import { Loader2, AlertTriangle, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GraphViewProps {
  workspaceId: string;
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

export const GraphView: React.FC<GraphViewProps> = ({ workspaceId, onNodeClick, className }) => {
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>();

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getWorkspaceGraph(workspaceId)
      .then(data => {
        if (mounted) setGraphData(data);
      })
      .catch(err => {
        if (mounted) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [workspaceId]);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isFullscreen, isLoading]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleNodeClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  }, [onNodeClick]);

  if (isLoading) {
    return (
      <div className={cn("flex-1 flex flex-col items-center justify-center p-8 text-slate-400", className)}>
        <Loader2 size={32} className="animate-spin text-sky-400 mb-4" />
        <p>Generating constellation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex-1 p-8", className)}>
        <div className="bg-rose-950/40 border border-rose-800/50 text-rose-300 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load graph</h3>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!graphData) return null;

  // Format data for ForceGraph2D
  const data = {
    nodes: graphData.nodes.map(n => ({ ...n })),
    links: graphData.edges.map(e => ({ source: e.source_note_id, target: e.target_note_id }))
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-[#07090e] border border-slate-700/50 rounded-xl overflow-hidden flex flex-col group",
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl" : className || "flex-1"
      )}
    >
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={toggleFullscreen}
          className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700 p-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors backdrop-blur-sm"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      {graphData.stats.truncated && (
        <div className="absolute top-4 left-4 z-10 bg-amber-950/80 border border-amber-500/50 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm flex items-center gap-2">
          <AlertTriangle size={14} />
          Graph Truncated (Showing 1000 max)
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 z-10 text-xs font-mono text-slate-500 bg-slate-900/60 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
        {graphData.stats.node_count} nodes, {graphData.stats.edge_count} edges
      </div>

      <div className="flex-1 overflow-hidden" style={{ width: '100%', height: '100%' }}>
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={data}
          nodeLabel="title"
          nodeColor={(node: any) => node.degree === 0 ? '#475569' : (node.is_pinned ? '#fbbf24' : '#38bdf8')}
          nodeRelSize={5}
          linkColor={() => 'rgba(148, 163, 184, 0.2)'}
          linkWidth={1}
          onNodeClick={handleNodeClick}
          cooldownTicks={100}
          onEngineStop={() => graphRef.current?.zoomToFit(400, 50)}
          backgroundColor="#07090e"
        />
      </div>
    </div>
  );
};
