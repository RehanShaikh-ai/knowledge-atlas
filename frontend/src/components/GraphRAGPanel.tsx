import React, { useState } from 'react';
import { runGraphRAG } from '@/api/graph_rag';
import { GraphRAGRequest, GraphRAGResponse } from '@/types/graph_rag';
import { CitationCard } from '@/components/rag/CitationCard';
import { renderMarkdown } from '@/lib/markdown';
import { getEntityTypeColor } from '@/lib/graph_constants';
import {
  Sparkles,
  GitFork,
  ArrowRight,
  Send,
  Loader2,
  AlertTriangle,
  Clock,
  Cpu,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GraphRAGPanelProps {
  workspaceId: string;
  onNavigateToNote?: (noteId: string) => void;
  onSelectEntity?: (entityId: string) => void;
  className?: string;
}

export const GraphRAGPanel: React.FC<GraphRAGPanelProps> = ({
  workspaceId,
  onNavigateToNote,
  onSelectEntity,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [maxHops, setMaxHops] = useState<number>(2);
  const [rerank, setRerank] = useState<boolean>(true);
  const [contextLimit, setContextLimit] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<GraphRAGResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Build canonical request. Per contract §9.7 & §18, values greater than 2
    // are NEVER silently capped by the frontend.
    const request: GraphRAGRequest = {
      query: trimmed,
      max_hops: maxHops,
      context_limit: contextLimit,
      rerank,
    };

    try {
      const res = await runGraphRAG(workspaceId, request);
      setResponse(res);
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      const msg = apiErr?.error?.message || (err instanceof Error ? err.message : 'GraphRAG query failed');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResponse(null);
    setError(null);
  };

  return (
    <div
      data-testid="graph-rag-panel"
      className={cn(
        'bg-slate-900/95 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-2xl flex flex-col text-slate-200',
        className
      )}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <GitFork size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-xs tracking-wide uppercase text-slate-200">
              GraphRAG Multi-Hop Retrieval
            </h3>
            <span className="text-[10px] text-slate-400">
              Traverse entities and relationships to answer complex questions
            </span>
          </div>
        </div>
        {response && (
          <button
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <RotateCcw size={12} />
            <span>New Query</span>
          </button>
        )}
      </div>

      {/* Query Form */}
      <form onSubmit={handleSubmit} className="pt-3 space-y-3">
        <div className="relative">
          <textarea
            data-testid="graph-rag-query-input"
            rows={2}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a multi-hop question across your knowledge graph..."
            className="w-full bg-slate-950/80 border border-slate-750 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all resize-none shadow-inner leading-relaxed pr-12"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            data-testid="graph-rag-submit-btn"
            className="absolute right-2.5 bottom-3 p-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Submit GraphRAG query"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>

        {/* Options Row */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400 pt-0.5">
          {/* Max Hops Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="max-hops-select" className="text-[11px] font-medium text-slate-400">
              Max Hops:
            </label>
            <select
              id="max-hops-select"
              data-testid="max-hops-select"
              value={maxHops}
              onChange={(e) => setMaxHops(parseInt(e.target.value, 10))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value={1}>1 Hop (Direct connections)</option>
              <option value={2}>2 Hops (Default multi-hop)</option>
              <option value={3}>3 Hops (Triggers backend validation)</option>
            </select>
          </div>

          {/* Rerank Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={rerank}
              onChange={(e) => setRerank(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0 accent-sky-500"
            />
            <span className="text-[11px]">RRF Reranking</span>
          </label>

          {/* Context Limit */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="context-limit-select" className="text-[11px] font-medium text-slate-400">
              Context:
            </label>
            <select
              id="context-limit-select"
              data-testid="context-limit-select"
              value={contextLimit}
              onChange={(e) => setContextLimit(parseInt(e.target.value, 10))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value={5}>5 chunks</option>
              <option value={10}>10 chunks</option>
              <option value={15}>15 chunks</option>
              <option value={20}>20 chunks</option>
            </select>
          </div>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <div
          data-testid="graph-rag-error"
          className="mt-3 p-3 bg-rose-950/80 border border-rose-800/80 text-rose-300 rounded-xl text-xs flex items-start gap-2 animate-fade-in"
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-400" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Loading Traversal View */}
      {isLoading && (
        <div
          data-testid="graph-rag-loading"
          className="my-6 p-6 bg-slate-950/40 border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 animate-pulse"
        >
          <Loader2 size={28} className="animate-spin text-sky-400" />
          <p className="text-xs font-medium text-slate-300">
            Traversing {maxHops}-hop knowledge graph & retrieving semantic context...
          </p>
          <span className="text-[11px] text-slate-500">
            Combining vector similarity with structural relationships
          </span>
        </div>
      )}

      {/* Results Section */}
      {response && !isLoading && (
        <div data-testid="graph-rag-results" className="mt-4 space-y-4">
          {/* Answer Section */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} />
                Synthesized Answer
              </span>
              <span className="font-mono text-slate-500 text-[10px]">
                {response.latency_ms}ms · {response.model}
              </span>
            </div>
            <div
              data-testid="graph-rag-answer"
              className="text-xs text-slate-200 leading-relaxed font-sans prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(response.answer) }}
            />
          </div>

          {/* Graph Context Box */}
          {response.graph_context && (
            <div
              data-testid="graph-context-box"
              className="p-3.5 bg-slate-950/50 border border-sky-500/30 rounded-xl space-y-2.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                  <GitFork size={14} />
                  <span>Graph Traversal Context</span>
                </div>
                <span
                  data-testid="graph-context-hops"
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-600/40"
                >
                  {response.graph_context.hops} {response.graph_context.hops === 1 ? 'Hop' : 'Hops'} Traversed
                </span>
              </div>

              {/* Traversed Entities */}
              {response.graph_context.entities_traversed?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Entities Traversed ({response.graph_context.entities_traversed.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5" data-testid="traversed-entities-list">
                    {response.graph_context.entities_traversed.map((ent) => (
                      <button
                        key={ent.id}
                        type="button"
                        onClick={() => onSelectEntity && onSelectEntity(ent.id)}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-slate-900 border border-slate-750 hover:border-sky-500/60 transition-colors flex items-center gap-1.5 text-slate-200"
                        title={`Entity type: ${ent.entity_type}`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: getEntityTypeColor(ent.entity_type) }}
                        />
                        <span>{ent.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationships Used */}
              {response.graph_context.relationships_used?.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-slate-850">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Relationships Traversed ({response.graph_context.relationships_used.length})
                  </span>
                  <div className="space-y-1" data-testid="relationships-used-list">
                    {response.graph_context.relationships_used.map((rel) => (
                      <div
                        key={rel.id}
                        className="text-[11px] font-mono text-slate-300 bg-slate-900/60 px-2 py-1 rounded flex items-center gap-1.5 border border-slate-800/60"
                      >
                        <span className="text-slate-200 font-semibold">{rel.source}</span>
                        <ArrowRight size={10} className="text-slate-500 shrink-0" />
                        <span className="text-sky-300 bg-sky-950/80 px-1 rounded text-[10px]">
                          {rel.relationship_type}
                        </span>
                        <ArrowRight size={10} className="text-slate-500 shrink-0" />
                        <span className="text-slate-200 font-semibold">{rel.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Citations */}
          {response.citations?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Cited Source Chunks ({response.citations.length})
              </span>
              <div className="space-y-2" data-testid="graph-rag-citations">
                {response.citations.map((cite, idx) => (
                  <CitationCard
                    key={cite.chunk_id}
                    citation={cite}
                    index={idx + 1}
                    onNavigate={onNavigateToNote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <Cpu size={10} /> Provider: {response.provider} ({response.model})
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> Latency: {response.latency_ms}ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
