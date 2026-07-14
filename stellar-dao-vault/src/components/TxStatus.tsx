import React from 'react';

export type TxStep = 'idle' | 'building' | 'simulating' | 'signing' | 'submitting' | 'confirmed' | 'error';

interface Props {
  step: TxStep;
}

const TxStatus: React.FC<Props> = ({ step }) => {
  if (step === 'idle') return null;

  const stepsList: { key: Exclude<TxStep, 'idle'>; label: string; icon: string }[] = [
    { key: 'building', label: '1. Build', icon: '🛠️' },
    { key: 'simulating', label: '2. Simulate', icon: '🧪' },
    { key: 'signing', label: '3. Sign', icon: '✍️' },
    { key: 'submitting', label: '4. Submit', icon: '📡' },
    { key: 'confirmed', label: '5. Confirm', icon: '✅' },
  ];

  const currentIdx = stepsList.findIndex((s) => s.key === step);
  const isError = step === 'error';

  return (
    <div className="glass-card tx-status-card">
      <div className="tx-status-title">Transaction Status Timeline</div>
      <div className="tx-steps">
        {stepsList.map((s, idx) => {
          const isDone = !isError && idx < currentIdx;
          const isActive = !isError && idx === currentIdx;
          const stepFailed = isError && idx === currentIdx;

          let iconClass = 'tx-step-icon';
          if (isDone || step === 'confirmed') iconClass += ' done';
          else if (isActive) iconClass += ' active';
          else if (stepFailed) iconClass += ' error';

          let labelClass = 'tx-step-label';
          if (isDone || step === 'confirmed') labelClass += ' done';
          else if (isActive) labelClass += ' active';

          return (
            <React.Fragment key={s.key}>
              <div className="tx-step">
                <div className={iconClass}>
                  {isDone || step === 'confirmed' ? '✓' : stepFailed ? '✗' : s.icon}
                </div>
                <div className={labelClass}>{s.label}</div>
              </div>
              {idx < stepsList.length - 1 && (
                <div
                  className={`tx-connector${
                    idx < currentIdx || step === 'confirmed' ? ' done' : ''
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default TxStatus;
