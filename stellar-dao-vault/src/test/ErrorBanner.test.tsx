import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBanner from '../components/ErrorBanner';

describe('ErrorBanner', () => {
  it('renders nothing when error is null', () => {
    const { container } = render(<ErrorBanner error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders voted error with shield emoji and red styling', () => {
    const error = {
      type: 'voted' as const,
      title: 'Already Voted',
      desc: 'This address has already voted on this proposal.',
    };
    render(<ErrorBanner error={error} />);
    expect(screen.getByText('Already Voted')).toBeInTheDocument();
    expect(screen.getByText('This address has already voted on this proposal.')).toBeInTheDocument();
    expect(screen.getByText('🛡️')).toBeInTheDocument();
  });

  it('renders rejected error with writing emoji', () => {
    const error = {
      type: 'rejected' as const,
      title: 'Signature Rejected',
      desc: 'You cancelled the transaction.',
    };
    render(<ErrorBanner error={error} />);
    expect(screen.getByText('Signature Rejected')).toBeInTheDocument();
    expect(screen.getByText('✍️')).toBeInTheDocument();
  });

  it('renders rpc error with satellite emoji', () => {
    const error = {
      type: 'rpc' as const,
      title: 'Network Error',
      desc: 'Could not reach Soroban RPC.',
    };
    render(<ErrorBanner error={error} />);
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('📡')).toBeInTheDocument();
  });

  it('applies correct CSS class based on error type', () => {
    const error = {
      type: 'voted' as const,
      title: 'Already Voted',
      desc: 'Duplicate vote.',
    };
    const { container } = render(<ErrorBanner error={error} />);
    const banner = container.firstChild as HTMLElement;
    expect(banner.className).toContain('type-voted');
  });
});
