import React from 'react';
import type { DaoEvent } from '../lib/contract';

interface Props {
  events: DaoEvent[];
}

const EventStream: React.FC<Props> = ({ events }) => {
  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <div className="results-title">
        <span>📡</span> On-Chain Event Feed
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxHeight: '260px',
          overflowY: 'auto',
          paddingRight: '0.5rem',
        }}
      >
        {events.length === 0 ? (
          <div style={{ padding: '1rem 0', color: '#64748b', fontSize: '0.85rem' }}>
            No recent activity detected.
          </div>
        ) : (
          events.map((e) => {
            let emoji = '⚙️';
            if (e.type === 'proposal_created') emoji = '📝';
            if (e.type === 'vote_cast') emoji = '🗳️';
            if (e.type === 'proposal_executed') emoji = '✅';
            if (e.type === 'deposit') emoji = '📥';
            if (e.type === 'withdraw') emoji = '📤';

            return (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  fontSize: '0.825rem',
                }}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e2e8f0', lineHeight: '1.4' }}>{e.summary}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EventStream;
