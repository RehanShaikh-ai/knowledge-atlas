import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinkSuggestionPanel } from './LinkSuggestionPanel';
import { SuggestionCard } from './SuggestionCard';
import * as linkSuggestionsApi from '@/api/link_suggestions';
import { LinkSuggestion } from '@/types/link_suggestion';

vi.mock('@/api/link_suggestions', () => ({
  getLinkSuggestions: vi.fn(),
  acceptSuggestion: vi.fn(),
  rejectSuggestion: vi.fn(),
}));

const mockSuggestion: LinkSuggestion = {
  id: 'sug-1',
  workspace_id: 'ws-1',
  source_note_id: 'note-1',
  source_note_title: 'Neural Networks Basics',
  target_note_id: 'note-2',
  target_note_title: 'Gradient Descent Deep Dive',
  confidence: 0.88,
  reason: 'Both notes share entities: Gradient Descent, Weights, Learning Rate',
  status: 'pending',
  shared_entity_ids: ['e1', 'e2', 'e3'],
  created_at: '2026-09-01T00:00:00Z',
  decided_at: null,
};

describe('LinkSuggestionPanel & SuggestionCard (§5.7, §14.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SuggestionCard', () => {
    it('renders note titles, confidence, and reason evidence', () => {
      const onAccept = vi.fn();
      const onReject = vi.fn();

      render(
        <SuggestionCard
          suggestion={mockSuggestion}
          onAccept={onAccept}
          onReject={onReject}
        />
      );

      expect(screen.getByText('Neural Networks Basics')).toBeInTheDocument();
      expect(screen.getByText('Gradient Descent Deep Dive')).toBeInTheDocument();
      expect(screen.getByTestId('suggestion-confidence-sug-1')).toHaveTextContent('88% Match');
      expect(screen.getByTestId('suggestion-reason-sug-1')).toHaveTextContent(
        'Both notes share entities: Gradient Descent'
      );
    });

    it('triggers accept and reject callbacks', () => {
      const onAccept = vi.fn();
      const onReject = vi.fn();

      render(
        <SuggestionCard
          suggestion={mockSuggestion}
          onAccept={onAccept}
          onReject={onReject}
        />
      );

      fireEvent.click(screen.getByTestId('accept-btn-sug-1'));
      expect(onAccept).toHaveBeenCalledWith('sug-1');

      fireEvent.click(screen.getByTestId('reject-btn-sug-1'));
      expect(onReject).toHaveBeenCalledWith('sug-1');
    });
  });

  describe('LinkSuggestionPanel', () => {
    it('fetches and displays pending suggestions', async () => {
      vi.mocked(linkSuggestionsApi.getLinkSuggestions).mockResolvedValue({
        items: [mockSuggestion],
        total: 1,
        page: 1,
        page_size: 50,
      });

      render(
        <LinkSuggestionPanel
          workspaceId="ws-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(linkSuggestionsApi.getLinkSuggestions).toHaveBeenCalledWith('ws-1', {
          status: 'pending',
          page_size: 50,
        });
        expect(screen.getByTestId('suggestion-card-sug-1')).toBeInTheDocument();
        expect(screen.getByText('1 pending review')).toBeInTheDocument();
      });
    });

    it('accepts suggestion, calls API, and removes suggestion without stale state', async () => {
      vi.mocked(linkSuggestionsApi.getLinkSuggestions).mockResolvedValue({
        items: [mockSuggestion],
        total: 1,
        page: 1,
        page_size: 50,
      });
      vi.mocked(linkSuggestionsApi.acceptSuggestion).mockResolvedValue({ id: 'link-1' });

      const onLinkCreated = vi.fn();

      render(
        <LinkSuggestionPanel
          workspaceId="ws-1"
          isOpen={true}
          onClose={vi.fn()}
          onLinkCreated={onLinkCreated}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('accept-btn-sug-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('accept-btn-sug-1'));

      await waitFor(() => {
        expect(linkSuggestionsApi.acceptSuggestion).toHaveBeenCalledWith('sug-1');
        expect(onLinkCreated).toHaveBeenCalled();
        expect(screen.queryByTestId('suggestion-card-sug-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('no-suggestions-state')).toBeInTheDocument();
      });
    });

    it('rejects suggestion, calls API, and removes card', async () => {
      vi.mocked(linkSuggestionsApi.getLinkSuggestions).mockResolvedValue({
        items: [mockSuggestion],
        total: 1,
        page: 1,
        page_size: 50,
      });
      vi.mocked(linkSuggestionsApi.rejectSuggestion).mockResolvedValue({
        ...mockSuggestion,
        status: 'rejected',
      });

      render(
        <LinkSuggestionPanel
          workspaceId="ws-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('reject-btn-sug-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('reject-btn-sug-1'));

      await waitFor(() => {
        expect(linkSuggestionsApi.rejectSuggestion).toHaveBeenCalledWith('sug-1');
        expect(screen.queryByTestId('suggestion-card-sug-1')).not.toBeInTheDocument();
      });
    });
  });
});
