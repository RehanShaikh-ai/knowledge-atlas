import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LinkSuggestion } from '@/types/link_suggestion';
import {
  getLinkSuggestions,
  acceptSuggestion,
  rejectSuggestion,
} from '@/api/link_suggestions';
import { SuggestionCard } from './SuggestionCard';
import { Sparkles, X, RefreshCw, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LinkSuggestionPanelProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onLinkCreated?: () => void;
  onNavigateToNote?: (noteId: string) => void;
  className?: string;
}

export const LinkSuggestionPanel: React.FC<LinkSuggestionPanelProps> = ({
  workspaceId,
  isOpen,
  onClose,
  onLinkCreated,
  onNavigateToNote,
  className,
}) => {
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Prevent duplicate requests
  const activeRequestsRef = useRef<Set<string>>(new Set());

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getLinkSuggestions(workspaceId, { status: 'pending', page_size: 50 });
      setSuggestions(res.items);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load link suggestions';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen, fetchSuggestions]);

  const handleAccept = async (suggestionId: string) => {
    if (activeRequestsRef.current.has(suggestionId)) return;
    activeRequestsRef.current.add(suggestionId);
    setProcessingId(suggestionId);
    setError(null);

    try {
      await acceptSuggestion(suggestionId);
      // Remove from pending list cleanly
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      setActionNotice('Link created successfully');
      setTimeout(() => setActionNotice(null), 3000);
      if (onLinkCreated) {
        onLinkCreated();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to accept suggestion';
      setError(msg);
    } finally {
      activeRequestsRef.current.delete(suggestionId);
      setProcessingId(null);
    }
  };

  const handleReject = async (suggestionId: string) => {
    if (activeRequestsRef.current.has(suggestionId)) return;
    activeRequestsRef.current.add(suggestionId);
    setProcessingId(suggestionId);
    setError(null);

    try {
      await rejectSuggestion(suggestionId);
      // Remove from pending list cleanly
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      setActionNotice('Suggestion dismissed');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reject suggestion';
      setError(msg);
    } finally {
      activeRequestsRef.current.delete(suggestionId);
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      data-testid="link-suggestion-panel"
      className={cn(
        'w-96 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl shadow-2xl flex flex-col text-slate-200 z-30',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-xs tracking-wide uppercase text-slate-200">
              AI Link Suggestions
            </h3>
            <span className="text-[10px] text-slate-400">
              {suggestions.length} pending review
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchSuggestions}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Refresh suggestions"
            aria-label="Refresh suggestions"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-amber-400' : ''} />
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
            aria-label="Close suggestions panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="mt-3 p-2 bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mt-3 p-2.5 bg-rose-950/80 border border-rose-800/60 text-rose-300 rounded-xl text-xs flex items-start gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 max-h-[460px] pr-1 mt-1">
        {isLoading && suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 size={24} className="animate-spin text-amber-400 mb-2" />
            <p className="text-xs">Finding shared concepts...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div
            data-testid="no-suggestions-state"
            className="flex flex-col items-center justify-center py-10 text-center px-4"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-500 mb-2.5">
              <Sparkles size={20} />
            </div>
            <h4 className="font-semibold text-xs text-slate-300">No Pending Suggestions</h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">
              When extraction discovers shared concepts across notes, link recommendations appear here.
            </p>
          </div>
        ) : (
          suggestions.map((sug) => (
            <SuggestionCard
              key={sug.id}
              suggestion={sug}
              onAccept={handleAccept}
              onReject={handleReject}
              onNavigateToNote={onNavigateToNote}
              isProcessing={processingId === sug.id}
            />
          ))
        )}
      </div>
    </aside>
  );
};
