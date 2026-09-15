import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage';

describe('HomePage Health State UI (§16, §25, §27)', () => {
  it('renders loading state', () => {
    render(<HomePage healthStatus="loading" onRefreshHealth={vi.fn()} />);
    expect(screen.getByTestId('health-status')).toHaveTextContent(
      'Backend: Loading'
    );
  });

  it('renders connected state', () => {
    render(<HomePage healthStatus="connected" onRefreshHealth={vi.fn()} />);
    expect(screen.getByTestId('health-status')).toHaveTextContent(
      'Backend: Connected'
    );
  });

  it('renders unavailable state', () => {
    render(<HomePage healthStatus="error" onRefreshHealth={vi.fn()} />);
    expect(screen.getByTestId('health-status')).toHaveTextContent(
      'Backend: Unavailable'
    );
  });
});
