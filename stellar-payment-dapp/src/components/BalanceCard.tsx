import React from "react";

interface BalanceCardProps {
  balance: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  onFund: () => void;
  isFunding: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  isLoading,
  onRefresh,
  onFund,
  isFunding,
}) => {
  const isUnfunded = balance === "UNFUNDED";

  const formatBalance = (balStr: string | null) => {
    if (!balStr || balStr === "UNFUNDED") return "0.0000";
    try {
      const parsed = parseFloat(balStr);
      return parsed.toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 7,
      });
    } catch {
      return balStr;
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
      {/* Accent glow in corner */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
          XLM Account Balance
        </h2>
        <button
          id="refresh-balance-btn"
          onClick={onRefresh}
          disabled={isLoading || isFunding}
          className="p-2 rounded-lg bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none group"
          title="Refresh Balance"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-500 ${isLoading ? "animate-spin" : "group-hover:rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 9H18.02"
            />
          </svg>
        </button>
      </div>

      {isLoading ? (
        // Loading Skeleton
        <div className="space-y-3">
          <div className="h-10 w-48 bg-slate-800/60 rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-slate-800/40 rounded-lg animate-pulse" />
        </div>
      ) : isUnfunded ? (
        // Unfunded State UI
        <div className="flex flex-col gap-4 mt-2">
          <div>
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
              Inactive Account
            </span>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              This Stellar public key is not activated on the Testnet ledger. Every Stellar account requires a minimum reserve of 1 XLM. Fund it with Friendbot to activate.
            </p>
          </div>
          <button
            id="fund-friendbot-btn"
            onClick={onFund}
            disabled={isFunding}
            className="w-full mt-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-amber-950/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isFunding ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Funding Account...
              </>
            ) : (
              "Activate with Friendbot (10,000 XLM)"
            )}
          </button>
        </div>
      ) : (
        // Funded State UI
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white tracking-tight font-mono">
              {formatBalance(balance)}
            </span>
            <span className="text-indigo-400 font-bold text-lg font-mono">XLM</span>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 bg-slate-900/30 border border-slate-900/50 p-3 rounded-lg">
            <span className="text-indigo-400 font-bold">💡 Note:</span>
            <span>Includes minimum network reserves. Testnet tokens have no monetary value.</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default BalanceCard;
