import React from "react";

interface TransactionResultProps {
  success: boolean | null;
  txHash: string | null;
  errorMessage: string | null;
  onReset: () => void;
}

export const TransactionResult: React.FC<TransactionResultProps> = ({
  success,
  txHash,
  errorMessage,
  onReset,
}) => {
  if (success === null) return null;

  return (
    <div className="p-6 rounded-2xl glass-card border-l-4 transition-all duration-300 shadow-xl max-w-full overflow-hidden animate-fadeIn">
      {success ? (
        // Success State
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                Transaction Successful!
              </h3>
              <p className="text-xs text-emerald-400 font-medium">
                Payment has been successfully recorded on Stellar Testnet.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 font-mono space-y-2">
            <span className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Transaction Hash
            </span>
            <span className="block text-slate-300 text-xs break-all leading-relaxed select-all">
              {txHash}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              id="view-explorer-btn"
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide rounded-lg text-center transition-all flex items-center justify-center gap-2"
            >
              View on Stellar.Expert
              <span className="text-xs">↗</span>
            </a>
            <button
              id="send-another-btn"
              onClick={onReset}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold tracking-wide rounded-lg transition-all"
            >
              Send Another Payment
            </button>
          </div>
        </div>
      ) : (
        // Failure State
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">
              ✕
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                Transaction Failed
              </h3>
              <p className="text-xs text-rose-400 font-medium">
                The transaction was rejected or failed execution.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/10 border border-rose-500/15">
            <span className="block text-rose-300/80 text-xs font-semibold uppercase tracking-wider mb-1">
              Error Reason
            </span>
            <p className="text-rose-200 text-sm leading-relaxed font-sans">
              {errorMessage || "An unknown error occurred during submission."}
            </p>
          </div>

          <div className="pt-2">
            <button
              id="reset-payment-btn"
              onClick={onReset}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold tracking-wide rounded-lg transition-all"
            >
              Try Again / Reset Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default TransactionResult;
