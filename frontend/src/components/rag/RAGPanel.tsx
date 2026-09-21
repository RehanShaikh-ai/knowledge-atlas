import React, { useState, useRef, useEffect } from 'react';
import { CitedSource } from '@/types/rag';
import { runRAGStream } from '@/api/rag';
import { CitationCard } from './CitationCard';
import { Sparkles, Loader2, Send, AlertTriangle, MessageSquare, BookOpen, X } from 'lucide-react';

interface RAGPanelProps {
  workspaceId: string;
  onNavigateToNote?: (noteId: string) => void;
  onClose?: () => void;
}

export const RAGPanel: React.FC<RAGPanelProps> = ({ workspaceId, onNavigateToNote, onClose }) => {
  const [query, setQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<CitedSource[]>([]);
  const [metadata, setMetadata] = useState<{ provider?: string, model?: string, latency?: number } | null>(null);
  
  const endOfResponseRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    endOfResponseRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [answer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;

    setError(null);
    setAnswer('');
    setCitations([]);
    setMetadata(null);
    setIsStreaming(true);

    try {
      const stream = runRAGStream(workspaceId, {
        query: query.trim(),
        stream: true,
        context_limit: 5,
        rerank: true,
        search_mode: 'hybrid'
      });

      for await (const event of stream) {
        if (event.type === 'chunk') {
          setAnswer(prev => prev + event.content);
        } else if (event.type === 'done') {
          setCitations(event.citations || []);
          setMetadata({
            provider: event.provider,
            model: event.model,
            latency: event.latency_ms
          });
          setIsStreaming(false);
        }
      }
    } catch (err) {
      const isContextEmpty = err instanceof Error && err.message.includes('RAG_CONTEXT_EMPTY');
      
      if (isContextEmpty) {
        setError(new Error('No relevant information found in your workspace to answer this question.'));
      } else {
        setError(err instanceof Error ? err : new Error('An unexpected error occurred while generating the answer.'));
      }
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="workflow-panel flex flex-col h-full !p-0 overflow-hidden bg-base/95 backdrop-blur-3xl shadow-2xl border-blue-500/20">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-card-border bg-gradient-to-r from-blue-900/20 to-purple-900/10">
        <h2 className="flex items-center gap-2 text-blue-100">
          <Sparkles size={18} className="text-blue-400" />
          AI Assistant
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface1 text-overlay1 hover:text-text transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-surface1 flex flex-col">
        {!answer && !isStreaming && !error && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <MessageSquare size={32} />
            </div>
            <div className="text-center">
              <p className="text-text font-medium text-lg">Ask anything</p>
              <p className="text-subtext0 text-sm max-w-[300px] mt-1">
                The AI will search your workspace and provide an answer with citations.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 mb-6">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="text-red-300 text-[13.5px] leading-relaxed">
              {error.message}
            </div>
          </div>
        )}

        {/* Answer Area */}
        {(answer || isStreaming) && (
          <div className="flex-1 flex flex-col">
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
              {answer ? (
                <div dangerouslySetInnerHTML={{ __html: answer.replace(/\n/g, '<br />') }} />
              ) : (
                <div className="flex items-center gap-2 text-overlay1 animate-pulse">
                  <Sparkles size={14} />
                  Thinking...
                </div>
              )}
              {isStreaming && answer && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-blue-400 animate-pulse align-middle" />
              )}
            </div>

            {/* Citations Area */}
            {!isStreaming && citations.length > 0 && (
              <div className="mt-8 pt-6 border-t border-surface2">
                <h3 className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-wider text-overlay1 mb-4">
                  <BookOpen size={14} />
                  Sources cited
                </h3>
                <div className="grid gap-3">
                  {citations.map((citation, idx) => (
                    <CitationCard 
                      key={citation.chunk_id} 
                      citation={citation} 
                      index={idx + 1}
                      onNavigate={onNavigateToNote} 
                    />
                  ))}
                </div>
                
                {/* Metadata Footer */}
                {metadata && (
                  <div className="mt-6 flex items-center justify-between text-[10px] font-mono text-overlay2 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={10} className="text-blue-500" />
                      Generated by {metadata.provider} • {metadata.model}
                    </span>
                    {metadata.latency && (
                      <span>{metadata.latency}ms</span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div ref={endOfResponseRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-card-border bg-surface0/50">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your notes... (Press Enter to submit)"
            className="w-full bg-base border border-surface2 rounded-xl pl-4 pr-12 py-3 text-[14px] text-text outline-none focus:border-blue-400/50 focus:bg-surface1 focus:shadow-[0_0_15px_rgba(56,189,248,0.1)] transition-all resize-none scrollbar-thin h-[60px] min-h-[60px] max-h-[120px]"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!query.trim() || isStreaming}
            className={`absolute right-3 bottom-3 p-2 rounded-lg flex items-center justify-center transition-all ${
              !query.trim() || isStreaming
                ? 'bg-surface1 text-overlay2 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-400 hover:shadow-[0_0_10px_rgba(56,189,248,0.4)]'
            }`}
          >
            {isStreaming ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} className="ml-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
