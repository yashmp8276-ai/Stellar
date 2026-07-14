import React, { useState } from 'react';

interface Props {
  question: string;
  options: string[];
  onVote: (index: number) => void;
  isVoting: boolean;
  disabled: boolean;
}

const PollCard: React.FC<Props> = ({ question, options, onVote, isVoting, disabled }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selected !== null) onVote(selected);
  };

  return (
    <div className="glass-card poll-card">
      <div className="poll-label">Active Poll</div>
      <div className="poll-question">{question}</div>

      <div className="poll-options">
        {options.map((opt, i) => (
          <button
            key={i}
            id={`poll-option-${i}`}
            className={`poll-option${selected === i ? ' selected' : ''}`}
            onClick={() => !disabled && setSelected(i)}
            disabled={disabled || isVoting}
          >
            <div className="option-radio">
              <div className="option-radio-inner" />
            </div>
            <span className="option-label">{opt}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569', marginLeft: 'auto' }}>
              {String.fromCharCode(65 + i)}
            </span>
          </button>
        ))}
      </div>

      <button
        id="submit-vote-btn"
        className="btn-vote"
        onClick={handleSubmit}
        disabled={selected === null || isVoting || disabled}
      >
        {isVoting ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span className="spinner" /> Submitting Vote…
          </span>
        ) : (
          selected !== null ? `✅ Submit Vote — Option ${String.fromCharCode(65 + selected)}` : 'Select an option to vote'
        )}
      </button>
    </div>
  );
};

export default PollCard;
