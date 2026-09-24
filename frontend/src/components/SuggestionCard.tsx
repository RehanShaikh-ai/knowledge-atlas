import React from 'react';
import { LinkSuggestion } from '@/types/link_suggestion';
import { Sparkles, ArrowRight, Check, X, FileText, Loader2 } from 'lucide-react';

export interface SuggestionCardProps {
  suggestion: LinkSuggestion;
  onAccept: (suggestionId: string) => Promise<void> | void;
  onReject: (suggestionId: string) => Promise<void> | void;
  onNavigateToNote?: (noteId: string) => void;
  isProcessing?: boolean;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  onNavigateToNote,
  isProcessing = false,
}) => {
  const confPercent = Math.round(suggestion.confidence * 100);

  return (
    <div
      data-testid={`suggestion-card-${suggestion.id}`}
      className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5 shadow-md transition-all hover:border-slate-700/80"
    >
      {/* Header: Note Pair and Confidence */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <FileText size={13} className="text-amber-400 shrink-0" />
            {onNavigateToNote ? (
              <button
                type="button"
                onClick={() => onNavigateToNote(suggestion.source_note_id)}
                className="hover:text-amber-300 hover:underline text-left truncate max-w-[130px]"
                title={suggestion.source_note_title}
              >
                {suggestion.source_note_title}
              </button>
            ) : (
              <span className="truncate max-w-[130px]" title={suggestion.source_note_title}>
                {suggestion.source_note_title}
              </span>
            )}
          </div>

          <ArrowRight size={13} className="text-slate-500 shrink-0" />

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <FileText size={13} className="text-amber-400 shrink-0" />
            {onNavigateToNote ? (
              <button
                type="button"
                onClick={() => onNavigateToNote(suggestion.target_note_id)}
                className="hover:text-amber-300 hover:underline text-left truncate max-w-[130px]"
                title={suggestion.target_note_title}
              >
                {suggestion.target_note_title}
              </button>
            ) : (
              <span className="truncate max-w-[130px]" title={suggestion.target_note_title}>
                {suggestion.target_note_title}
              </span>
            )}
          </div>
        </div>

        {/* Confidence Badge */}
        <span
          data-testid={`suggestion-confidence-${suggestion.id}`}
          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 shrink-0 font-semibold"
        >
          {confPercent}% Match
        </span>
      </div>

      {/* Reason / Evidence */}
      {suggestion.reason && (
        <div
          data-testid={`suggestion-reason-${suggestion.id}`}
          className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850 flex items-start gap-2 leading-relaxed"
        >
          <Sparkles size={13} className="text-amber-400 mt-0.5 shrink-0" />
          <span>{suggestion.reason}</span>
        </div>
      )}

      {/* Shared Entities Count if available */}
      {suggestion.shared_entity_ids && suggestion.shared_entity_ids.length > 0 && (
        <div className="text-[10px] font-mono text-slate-500">
          Shared concepts: {suggestion.shared_entity_ids.length}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
        <button
          type="button"
          onClick={() => onReject(suggestion.id)}
          disabled={isProcessing}
          data-testid={`reject-btn-${suggestion.id}`}
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
          <span>Reject</span>
        </button>
        <button
          type="button"
          onClick={() => onAccept(suggestion.id)}
          disabled={isProcessing}
          data-testid={`accept-btn-${suggestion.id}`}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          <span>Accept Link</span>
        </button>
      </div>
    </div>
  );
};
