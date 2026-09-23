import React, { useState, useRef, useEffect } from 'react';
import { CitedSource, RAGStatusResponse } from '@/types/rag';
import { runRAGStream, getRAGStatus } from '@/api/rag';
import { CitationCard } from './CitationCard';
import {
  Sparkles,
  Loader2,
  Send,
  AlertTriangle,
  MessageSquare,
  BookOpen,
  X,
  RotateCcw,
  User,
  Cpu,
} from 'lucide-react';
import { renderMarkdown } from '@/lib/markdown';

interface RAGPanelProps {
  workspaceId: string;
  onNavigateToNote?: (noteId: string) => void;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: CitedSource[];
  metadata?: { provider?: string; model?: string; latency?: number };
  error?: string;
  aiUnavailable?: boolean;
  aiUnavailableMessage?: string;
  isStreaming?: boolean;
}

export const RAGPanel: React.FC<RAGPanelProps> = ({ workspaceId, onNavigateToNote, onClose }) => {
  const [query, setQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<RAGStatusResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('auto');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Load provider health and model recommendations
  useEffect(() => {
    let mounted = true;
    getRAGStatus(workspaceId)
      .then((res) => {
        if (!mounted) return;
        setStatus(res);
        if (res.current_model) {
          setSelectedModel(res.current_model);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch AI provider status:', err);
      });
    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  const handleClearHistory = () => {
    if (isStreaming) return;
    setMessages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userQuery = query.trim();
    if (!userQuery || isStreaming) return;

    const userMsgId = 'user-' + Date.now();
    const assistantMsgId = 'assistant-' + Date.now();

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: userQuery,
    };

    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      citations: [],
      isStreaming: true,
    };

    // Prepare previous conversation history
    const historyPayload = messages
      .filter((m) => !m.error && !m.aiUnavailable && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setQuery('');
    setIsStreaming(true);

    try {
      const stream = runRAGStream(workspaceId, {
        query: userQuery,
        stream: true,
        context_limit: 5,
        rerank: true,
        search_mode: 'hybrid',
        model: selectedModel,
        history: historyPayload,
      });

      for await (const event of stream) {
        if (event.type === 'chunk') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + event.content }
                : msg
            )
          );
        } else if (event.type === 'done') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    citations: event.citations || [],
                    metadata: {
                      provider: event.provider,
                      model: event.model,
                      latency: event.latency_ms,
                    },
                    isStreaming: false,
                  }
                : msg
            )
          );
          setIsStreaming(false);
        } else if (event.type === 'ai_unavailable') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    aiUnavailable: true,
                    aiUnavailableMessage: event.message,
                    citations: event.citations || [],
                    isStreaming: false,
                  }
                : msg
            )
          );
          setIsStreaming(false);
        } else if (event.type === 'error') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    error: event.message || 'Error occurred while generating response.',
                    isStreaming: false,
                  }
                : msg
            )
          );
          setIsStreaming(false);
        }
      }
    } catch (err) {
      const isContextEmpty = err instanceof Error && err.message.includes('RAG_CONTEXT_EMPTY');
      const errorMessage = isContextEmpty
        ? 'No relevant information found in your workspace to answer this question.'
        : err instanceof Error
        ? err.message
        : 'An unexpected error occurred while generating the answer.';

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, error: errorMessage, isStreaming: false }
            : msg
        )
      );
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
      <div className="flex flex-col gap-2 p-3.5 border-b border-card-border bg-gradient-to-r from-blue-900/20 to-purple-900/10">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-blue-100 text-sm font-semibold">
            <Sparkles size={16} className="text-blue-400 shrink-0 inline-block" aria-hidden="true" focusable="false" />
            <span>AI Assistant</span>
            <kbd className="ml-1 text-[10px] font-mono bg-surface1 px-1.5 py-0.5 rounded text-overlay0 border border-surface2">
              Mod+J
            </kbd>
          </h2>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={isStreaming}
                title="Clear conversation"
                className="p-1.5 rounded-md hover:bg-surface1 text-overlay1 hover:text-text transition-colors text-xs flex items-center gap-1"
              >
                <RotateCcw size={13} className="shrink-0 inline-block" aria-hidden="true" focusable="false" />
                <span className="hidden sm:inline text-[11px]">Clear</span>
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-surface1 text-overlay1 hover:text-text transition-colors"
                title="Close Assistant"
              >
                <X size={16} className="shrink-0 inline-block" aria-hidden="true" focusable="false" />
              </button>
            )}
          </div>
        </div>

        {/* Model Selection Bar */}
        {status?.recommended_models && status.recommended_models.length > 0 && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-surface2/40">
            <div className="flex items-center gap-1.5 text-overlay1 text-[11px] font-mono">
              <Cpu size={12} className="text-blue-400 shrink-0 inline-block" aria-hidden="true" focusable="false" />
              <span>Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isStreaming}
                className="bg-surface1 text-blue-200 border border-surface2 rounded px-2 py-0.5 text-[11px] font-sans focus:outline-none focus:border-blue-400/50 cursor-pointer"
              >
                {status.recommended_models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-crust text-slate-200">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-[10.5px]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status.healthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-overlay1 font-mono uppercase tracking-wider text-[9.5px]">
                {status.healthy ? 'Online' : 'Limited'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-surface1 flex flex-col gap-5">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-60 space-y-3 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <MessageSquare size={28} className="shrink-0 inline-block" aria-hidden="true" focusable="false" />
            </div>
            <div className="text-center">
              <p className="text-text font-medium text-base">Ask anything</p>
              <p className="text-subtext0 text-xs max-w-[280px] mt-1">
                The AI will search your workspace notes and generate responses with grounded citations.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] bg-blue-600/20 border border-blue-500/40 rounded-2xl rounded-tr-sm px-4 py-3 text-slate-100 text-sm shadow-md">
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-blue-300 font-semibold uppercase tracking-wider">
                    <User size={11} className="shrink-0 inline-block" aria-hidden="true" focusable="false" />
                    <span>You</span>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ) : (
                <div className="w-full bg-surface0/60 border border-surface1 rounded-2xl rounded-tl-sm p-4 text-slate-200 text-sm shadow-md">
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] font-mono text-blue-400 font-semibold uppercase tracking-wider">
                    <Sparkles size={11} className="shrink-0 inline-block" aria-hidden="true" focusable="false" />
                    <span>Assistant</span>
                  </div>

                  {msg.error ? (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-red-300 text-xs">
                      <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5 inline-block" aria-hidden="true" focusable="false" />
                      <div>{msg.error}</div>
                    </div>
                  ) : msg.aiUnavailable ? (
                    <div className="space-y-4">
                      {/* Clear Fallback Banner */}
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-200 text-xs shadow-sm">
                        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5 inline-block" aria-hidden="true" focusable="false" />
                        <div>
                          <div className="font-semibold text-amber-100">
                            {msg.citations?.length || 0} relevant note{msg.citations?.length !== 1 ? 's' : ''} found · AI generation unavailable
                          </div>
                          <div className="text-amber-300/80 text-[11px] mt-0.5 leading-normal">
                            No active LLM provider could be reached. Your retrieved knowledge base notes are displayed below.
                          </div>
                        </div>
                      </div>

                      {/* Display retrieved sources */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="pt-1">
                          <h4 className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-overlay1 mb-2.5">
                            <BookOpen size={12} className="shrink-0 inline-block" aria-hidden="true" focusable="false" />
                            <span>Retrieved sources ({msg.citations.length})</span>
                          </h4>
                          <div className="grid gap-2">
                            {msg.citations.map((citation, idx) => (
                              <CitationCard
                                key={citation.chunk_id || idx}
                                citation={citation}
                                index={idx + 1}
                                onNavigate={onNavigateToNote}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="markdown-content max-w-none text-slate-200 leading-relaxed">
                        {msg.content ? (
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                        ) : (
                          <div className="flex items-center gap-2 text-overlay1 animate-pulse text-xs">
                            <Sparkles size={13} className="text-blue-400 shrink-0 inline-block" aria-hidden="true" focusable="false" />
                            <span>Retrieving notes & reasoning...</span>
                          </div>
                        )}
                        {msg.isStreaming && msg.content && (
                          <span className="inline-block w-1.5 h-3.5 ml-1 bg-blue-400 animate-pulse align-middle" />
                        )}
                      </div>

                      {/* Citations */}
                      {msg.citations && msg.citations.length > 0 && !msg.isStreaming && (
                        <div className="mt-4 pt-3 border-t border-surface2">
                          <h4 className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-overlay1 mb-2.5">
                            <BookOpen size={12} className="shrink-0 inline-block" aria-hidden="true" focusable="false" />
                            <span>Sources cited ({msg.citations.length})</span>
                          </h4>
                          <div className="grid gap-2">
                            {msg.citations.map((citation, idx) => (
                              <CitationCard
                                key={citation.chunk_id || idx}
                                citation={citation}
                                index={idx + 1}
                                onNavigate={onNavigateToNote}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Telemetry metadata */}
                      {msg.metadata && !msg.isStreaming && (
                        <div className="mt-3 pt-2 flex items-center justify-between text-[9.5px] font-mono text-overlay2 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Sparkles size={9} className="text-blue-500 shrink-0 inline-block" aria-hidden="true" focusable="false" />
                            <span>
                              {msg.metadata.provider} • {msg.metadata.model}
                            </span>
                          </span>
                          {msg.metadata.latency && <span>{msg.metadata.latency}ms</span>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3.5 border-t border-card-border bg-surface0/50">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your notes... (Press Enter to send)"
            className="w-full bg-base border border-surface2 rounded-xl pl-3.5 pr-11 py-2.5 text-[13.5px] text-text outline-none focus:border-blue-400/50 focus:bg-surface1 focus:shadow-[0_0_15px_rgba(56,189,248,0.1)] transition-all resize-none scrollbar-thin h-[54px] min-h-[54px] max-h-[100px]"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!query.trim() || isStreaming}
            className={`absolute right-2.5 bottom-2.5 p-2 rounded-lg flex items-center justify-center transition-all ${
              !query.trim() || isStreaming
                ? 'bg-surface1 text-overlay2 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-400 hover:shadow-[0_0_10px_rgba(56,189,248,0.4)]'
            }`}
          >
            {isStreaming ? (
              <Loader2 size={15} className="animate-spin shrink-0 inline-block" aria-hidden="true" focusable="false" />
            ) : (
              <Send size={15} className="ml-0.5 shrink-0 inline-block" aria-hidden="true" focusable="false" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
