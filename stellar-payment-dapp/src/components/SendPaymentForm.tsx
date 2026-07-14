import React, { useState, useEffect } from "react";
import { StrKey } from "@stellar/stellar-sdk";

interface SendPaymentFormProps {
  balance: string | null;
  onSend: (destination: string, amount: string, memo: string) => Promise<void>;
  isSubmitting: boolean;
  walletConnected: boolean;
}

export const SendPaymentForm: React.FC<SendPaymentFormProps> = ({
  balance,
  onSend,
  isSubmitting,
  walletConnected,
}) => {
  const [destination, setDestination] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [memo, setMemo] = useState<string>("");

  // Validation States
  const [destError, setDestError] = useState<string>("");
  const [amountError, setAmountError] = useState<string>("");
  const [memoError, setMemoError] = useState<string>("");
  const [isFormValid, setIsFormValid] = useState<boolean>(false);

  const isUnfunded = balance === "UNFUNDED";

  // Validate Destination Address
  useEffect(() => {
    if (!destination) {
      setDestError("");
      return;
    }
    if (!StrKey.isValidEd25519PublicKey(destination)) {
      setDestError("Invalid Stellar public key format (must start with 'G').");
    } else {
      setDestError("");
    }
  }, [destination]);

  // Validate Amount
  useEffect(() => {
    if (!amount) {
      setAmountError("");
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setAmountError("Amount must be a positive number.");
      return;
    }

    if (balance && balance !== "UNFUNDED") {
      const balNum = parseFloat(balance);
      const feeBuffer = 0.00001; // Base fee: 100 stroops
      const minimumReserve = 1.0;  // Stellar base reserve
      const maxSpendable = balNum - minimumReserve - feeBuffer;

      if (amtNum > maxSpendable) {
        if (maxSpendable <= 0) {
          setAmountError("Insufficient balance. Need at least 1.00001 XLM for reserve and fee.");
        } else {
          setAmountError(`Insufficient funds. Maximum spendable (accounting for 1 XLM reserve + fee) is ${maxSpendable.toFixed(5)} XLM.`);
        }
      } else {
        setAmountError("");
      }
    } else {
      setAmountError("");
    }
  }, [amount, balance]);

  // Validate Memo (max 28 bytes for text memo)
  useEffect(() => {
    if (!memo) {
      setMemoError("");
      return;
    }
    const byteLength = new Blob([memo]).size;
    if (byteLength > 28) {
      setMemoError(`Memo text is too long (${byteLength}/28 bytes).`);
    } else {
      setMemoError("");
    }
  }, [memo]);

  // Overall form validation check
  useEffect(() => {
    const isDestValid = destination && !destError;
    const isAmtValid = amount && !amountError;
    const isMemoValid = !memoError;

    setIsFormValid(!!(isDestValid && isAmtValid && isMemoValid && walletConnected && !isUnfunded));
  }, [destination, amount, memo, destError, amountError, memoError, walletConnected, isUnfunded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    onSend(destination.trim(), amount.trim(), memo.trim());
  };

  const isDisabled = !walletConnected || isUnfunded || isSubmitting;

  return (
    <div className="p-6 rounded-2xl glass-card">
      <h2 className="text-lg font-bold text-white mb-4 tracking-wide">
        Send Payment
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Destination Field */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Recipient Address
          </label>
          <input
            id="recipient-address-input"
            type="text"
            placeholder="e.g. GC3D... or G-address"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={isDisabled}
            className="w-full px-4 py-3 rounded-xl glass-input text-sm transition-all focus:ring-2 font-mono disabled:opacity-50"
          />
          {destError && (
            <p className="text-red-400 text-xs mt-1.5 font-medium">{destError}</p>
          )}
        </div>

        {/* Amount & Memo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount Field */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Amount (XLM)
            </label>
            <div className="relative">
              <input
                id="payment-amount-input"
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isDisabled}
                className="w-full pl-4 pr-12 py-3 rounded-xl glass-input text-sm transition-all focus:ring-2 font-mono disabled:opacity-50"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <span className="text-slate-400 text-xs font-bold font-mono">XLM</span>
              </div>
            </div>
            {amountError && (
              <p className="text-red-400 text-xs mt-1.5 font-medium">{amountError}</p>
            )}
          </div>

          {/* Memo Field */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Memo <span className="text-slate-500 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="payment-memo-input"
              type="text"
              placeholder="Max 28 chars text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={isDisabled}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm transition-all focus:ring-2 disabled:opacity-50"
            />
            {memoError && (
              <p className="text-red-400 text-xs mt-1.5 font-medium">{memoError}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="submit-payment-btn"
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full mt-4 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm tracking-wide shadow-lg shadow-indigo-950/20 transition-all hover:scale-[1.01] disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Processing Transaction...
            </>
          ) : (
            "Submit Payment"
          )}
        </button>
      </form>
    </div>
  );
};
export default SendPaymentForm;
