import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GraphJobIndicator } from './GraphJobIndicator';
import { ExtractionResultSummary } from './ExtractionResultSummary';

describe('GraphJobIndicator & ExtractionResultSummary (§5.7, §14.2)', () => {
  describe('GraphJobIndicator', () => {
    it('renders queued status correctly', () => {
      render(<GraphJobIndicator status="queued" jobType="extract_entities_job" />);

      const indicator = screen.getByTestId('graph-job-indicator');
      expect(indicator).toHaveAttribute('data-status', 'queued');
      expect(screen.getByText('Extraction Queued')).toBeInTheDocument();
      expect(screen.getByText('(extract entities)')).toBeInTheDocument();
    });

    it('renders running status correctly', () => {
      render(<GraphJobIndicator status="running" />);

      const indicator = screen.getByTestId('graph-job-indicator');
      expect(indicator).toHaveAttribute('data-status', 'running');
      expect(screen.getByText('Extracting Knowledge...')).toBeInTheDocument();
    });

    it('renders completed status correctly', () => {
      render(<GraphJobIndicator status="completed" />);

      const indicator = screen.getByTestId('graph-job-indicator');
      expect(indicator).toHaveAttribute('data-status', 'completed');
      expect(screen.getByText('Graph Up to Date')).toBeInTheDocument();
    });

    it('renders failed status with retry button', () => {
      const onRetry = vi.fn();
      render(
        <GraphJobIndicator
          status="failed"
          errorMessage="LLM provider timed out"
          onRetry={onRetry}
        />
      );

      const indicator = screen.getByTestId('graph-job-indicator');
      expect(indicator).toHaveAttribute('data-status', 'failed');
      expect(screen.getByText('Extraction Failed')).toBeInTheDocument();

      const retryBtn = screen.getByTestId('job-retry-btn');
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('ExtractionResultSummary', () => {
    it('renders metrics when extraction is completed', () => {
      const onViewGraph = vi.fn();
      render(
        <ExtractionResultSummary
          status="completed"
          entityCount={42}
          relationshipCount={78}
          notesProcessedCount={15}
          message="Extracted 42 entities, 78 relationships from 15 notes"
          onViewGraph={onViewGraph}
        />
      );

      expect(screen.getByTestId('extraction-result-summary')).toBeInTheDocument();
      expect(screen.getByTestId('extraction-summary-title')).toHaveTextContent('Extraction Completed');
      expect(screen.getByTestId('metric-entity-count')).toHaveTextContent('42');
      expect(screen.getByTestId('metric-relationship-count')).toHaveTextContent('78');
      expect(screen.getByTestId('metric-notes-count')).toHaveTextContent('15');
      expect(screen.getByTestId('extraction-summary-message')).toHaveTextContent(
        'Extracted 42 entities, 78 relationships from 15 notes'
      );

      const viewGraphBtn = screen.getByTestId('view-graph-btn');
      fireEvent.click(viewGraphBtn);
      expect(onViewGraph).toHaveBeenCalled();
    });

    it('renders error state and retry when extraction fails', () => {
      const onRetry = vi.fn();
      render(
        <ExtractionResultSummary
          status="failed"
          message="Extraction timed out after 3 retries"
          onRetry={onRetry}
        />
      );

      expect(screen.getByTestId('extraction-summary-title')).toHaveTextContent('Extraction Incomplete');
      expect(screen.getByText('Extraction timed out after 3 retries')).toBeInTheDocument();

      const retryBtn = screen.getByTestId('extraction-retry-btn');
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalled();
    });
  });
});
