import React, { useState } from 'react';
import type { Proposal } from '../lib/contract';

interface Props {
  proposals: Proposal[];
  voterDeposit: number;
  onVote: (proposalId: number, approve: boolean) => void;
  onExecute: (proposalId: number) => void;
  onCreateProposal: (desc: string, recipient: string, amount: number) => void;
  isActionActive: boolean;
  disabled: boolean;
}

const ProposalList: React.FC<Props> = ({
  proposals,
  voterDeposit,
  onVote,
  onExecute,
  onCreateProposal,
  isActionActive,
  disabled,
}) => {
  // New proposal form state
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amountStr, setAmountStr] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(amountStr);
    if (desc && recipient && !isNaN(amount) && amount > 0) {
      onCreateProposal(desc, recipient, amount);
      setDesc('');
      setRecipient('');
      setAmountStr('');
      setShowForm(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with New Proposal Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Governance Proposals</h2>
        <button
          className="btn-ghost"
          onClick={() => setShowForm(!showForm)}
          disabled={disabled}
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {showForm ? 'Cancel Proposal' : '➕ Create Proposal'}
        </button>
      </div>

      {/* Creation Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="poll-label">Create Governance Proposal</div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.375rem' }}>Description</label>
            <input
              type="text"
              placeholder="e.g. Fund marketing materials for DAO launch"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
              className="poll-option"
              style={{ width: '100%', cursor: 'text', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.375rem' }}>Recipient Address</label>
              <input
                type="text"
                placeholder="G..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                className="poll-option"
                style={{ width: '100%', cursor: 'text', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.375rem' }}>Amount (XLM)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                required
                className="poll-option"
                style={{ width: '100%', cursor: 'text', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isActionActive} style={{ marginTop: '0.5rem' }}>
            Submit Proposal
          </button>
        </form>
      )}

      {/* Proposals List Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {proposals.map((p) => {
          const totalVotes = p.votesYes + p.votesNo;
          const yesPct = totalVotes > 0 ? Math.round((p.votesYes / totalVotes) * 100) : 0;
          const noPct = totalVotes > 0 ? Math.round((p.votesNo / totalVotes) * 100) : 0;

          return (
            <div key={p.id} className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="poll-label">Proposal #{p.id}</span>
                {p.executed ? (
                  <span className="voted-badge">Executed</span>
                ) : totalVotes > 1500 ? (
                  <span className="voted-badge" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)' }}>
                    Passed — Ready
                  </span>
                ) : (
                  <span className="voted-badge" style={{ color: '#818cf8', background: 'rgba(129,140,248,0.1)', borderColor: 'rgba(129,140,248,0.3)' }}>
                    Voting Active
                  </span>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>{p.description}</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
                  Target payout: <strong style={{ color: '#e2e8f0' }}>{p.amount.toLocaleString()} XLM</strong> to{' '}
                  <span style={{ fontFamily: 'monospace' }}>{p.recipient.slice(0, 8)}...{p.recipient.slice(-8)}</span>
                </p>
              </div>

              {/* Vote percentages bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span>Yes ({yesPct}%)</span>
                  <span>No ({noPct}%)</span>
                </div>
                <div style={{ height: '8px', borderRadius: '100px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${yesPct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                  <div style={{ width: `${noPct}%`, height: '100%', background: 'linear-gradient(90deg, #f43f5e, #fda4af)' }} />
                </div>
              </div>

              {/* Voting & execution actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                {!p.executed ? (
                  <>
                    <button
                      className="btn-ghost"
                      onClick={() => onVote(p.id, true)}
                      disabled={disabled || isActionActive || voterDeposit <= 0}
                      style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', borderRadius: '8px', color: '#34d399' }}
                    >
                      👍 Vote YES
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => onVote(p.id, false)}
                      disabled={disabled || isActionActive || voterDeposit <= 0}
                      style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', borderRadius: '8px', color: '#f43f5e' }}
                    >
                      👎 Vote NO
                    </button>
                    {totalVotes > 1500 && (
                      <button
                        className="btn-primary"
                        onClick={() => onExecute(p.id)}
                        disabled={disabled || isActionActive}
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', borderRadius: '8px' }}
                      >
                        ⚡ Execute Payout
                      </button>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Execution transaction confirmed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProposalList;
