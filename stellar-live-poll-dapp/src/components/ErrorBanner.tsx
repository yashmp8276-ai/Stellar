import React from 'react';
import type { VoteErrorType } from '../lib/contract';

interface Props {
  error: {
    type: VoteErrorType;
    title: string;
    desc: string;
  } | null;
}

const ErrorBanner: React.FC<Props> = ({ error }) => {
  if (!error) return null;

  let emoji = '⚠️';
  if (error.type === 'wallet_not_found') emoji = '🔌';
  if (error.type === 'voted') emoji = '🛡️';
  if (error.type === 'rejected') emoji = '✍️';
  if (error.type === 'rpc') emoji = '📡';

  return (
    <div className={`error-banner type-${error.type}`}>
      <span className="error-icon">{emoji}</span>
      <div>
        <div className="error-title">{error.title}</div>
        <div className="error-desc">{error.desc}</div>
        {error.type === 'wallet_not_found' && (
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
            style={{ marginTop: '8px' }}
          >
            Download Freighter ↗
          </a>
        )}
        {error.type === 'rejected' && (
          <div className="error-desc" style={{ marginTop: '4px', fontStyle: 'italic', opacity: 0.7 }}>
            You can try again by clicking "Submit Vote" once more.
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorBanner;
