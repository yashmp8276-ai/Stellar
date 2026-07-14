import React, { useState } from 'react';

interface Props {
  vaultBalance: number;
  voterDeposit: number;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  isActionActive: boolean;
  disabled: boolean;
}

const TreasuryVault: React.FC<Props> = ({
  vaultBalance,
  voterDeposit,
  onDeposit,
  onWithdraw,
  isActionActive,
  disabled,
}) => {
  const [amountStr, setAmountStr] = useState('');

  const handleAction = (type: 'deposit' | 'withdraw') => {
    const parsed = Number(amountStr);
    if (!isNaN(parsed) && parsed > 0) {
      if (type === 'deposit') {
        onDeposit(parsed);
      } else {
        onWithdraw(parsed);
      }
      setAmountStr('');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="poll-label">Treasury Assets</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            {vaultBalance.toLocaleString()} <span style={{ fontSize: '1rem', color: '#818cf8' }}>XLM</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>DAO treasury vault capital</p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="poll-label" style={{ justifyContent: 'flex-end' }}>Your Voting Weight</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#34d399', letterSpacing: '-0.02em' }}>
            {voterDeposit.toLocaleString()} <span style={{ fontSize: '1rem', color: '#64748b' }}>tokens</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>Deposited governance stake</p>
        </div>
      </div>

      <hr className="section-div" />

      <div>
        <div className="poll-label" style={{ marginBottom: '0.75rem' }}>Staking & Deposits Portal</div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="number"
            placeholder="Enter token amount"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            disabled={disabled || isActionActive}
            className="poll-option"
            style={{
              flex: '1',
              padding: '0.75rem 1.25rem',
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'text',
            }}
          />

          <button
            className="btn-primary"
            onClick={() => handleAction('deposit')}
            disabled={disabled || isActionActive || !amountStr}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}
          >
            Deposit
          </button>

          <button
            className="btn-ghost"
            onClick={() => handleAction('withdraw')}
            disabled={disabled || isActionActive || !amountStr || voterDeposit <= 0}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};

export default TreasuryVault;
