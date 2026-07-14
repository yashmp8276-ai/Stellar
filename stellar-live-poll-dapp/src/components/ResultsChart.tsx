import React from 'react';

interface Props {
  options: string[];
  results: number[];
  hasVoted: boolean;
}

const ResultsChart: React.FC<Props> = ({ options, results, hasVoted }) => {
  const totalVotes = results.reduce((a, b) => a + b, 0);

  // Find max votes to determine winner styling
  const maxVotes = Math.max(...results);

  return (
    <div className="glass-card results-card">
      <div className="results-title">
        <span>📊</span> Poll Results {hasVoted && <span className="voted-badge" style={{ marginLeft: 'auto' }}>Voted</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {options.map((opt, i) => {
          const votes = results[i] || 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isWinner = votes > 0 && votes === maxVotes;

          return (
            <div key={i} className="result-row">
              <div className="result-meta">
                <span className="result-option-name">{opt}</span>
                <span className="result-votes">
                  {votes} {votes === 1 ? 'vote' : 'votes'} ({pct}%)
                </span>
              </div>
              <div className="result-bar-bg">
                <div
                  className={`result-bar-fill${isWinner ? ' winner' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="total-votes">
        Total votes cast: <strong>{totalVotes}</strong>
      </div>
    </div>
  );
};

export default ResultsChart;
