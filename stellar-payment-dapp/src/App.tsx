import { useState, useEffect, useCallback } from "react";
import WalletConnect from "./components/WalletConnect";
import BalanceCard from "./components/BalanceCard";
import SendPaymentForm from "./components/SendPaymentForm";
import TransactionResult from "./components/TransactionResult";
import { fetchBalance, fundWithFriendbot, buildPaymentTransaction, submitTransaction } from "./lib/stellar";
import { signTx, getSavedAddress } from "./lib/freighter";

function App() {
  // Wallet Address State
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Balance State
  const [balance, setBalance] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);

  // Friendbot Funding State
  const [isFunding, setIsFunding] = useState<boolean>(false);

  // Transaction Status State
  const [isSubmittingTx, setIsSubmittingTx] = useState<boolean>(false);
  const [txSuccess, setTxSuccess] = useState<boolean | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // 1. Restore persisted session silently (no popup) on mount
  useEffect(() => {
    async function restoreSession() {
      const savedAddress = localStorage.getItem("stellar_dapp_address");
      if (!savedAddress) return;

      // Verify the saved address is still accessible (Freighter still has
      // permission) without re-prompting the user.
      const liveAddress = await getSavedAddress();
      if (liveAddress && liveAddress === savedAddress) {
        setConnectedAddress(liveAddress);
      } else {
        // Permission was revoked or wallet changed — clear stale cache.
        localStorage.removeItem("stellar_dapp_address");
      }
    }
    restoreSession();
  }, []);

  // 2. Fetch balance helper
  const handleFetchBalance = useCallback(async (address: string) => {
    setIsBalanceLoading(true);
    try {
      const bal = await fetchBalance(address);
      setBalance(bal);
    } catch (err: any) {
      console.error("Failed to load balance:", err);
      // We keep existing balance or show error
      setBalance(null);
    } finally {
      setIsBalanceLoading(false);
    }
  }, []);

  // 3. Fetch balance whenever address changes
  useEffect(() => {
    if (connectedAddress) {
      handleFetchBalance(connectedAddress);
    } else {
      setBalance(null);
    }
  }, [connectedAddress, handleFetchBalance]);

  // Wallet Actions
  const handleConnectWallet = (address: string) => {
    setConnectedAddress(address);
    localStorage.setItem("stellar_dapp_address", address);
  };

  const handleDisconnectWallet = () => {
    setConnectedAddress(null);
    setBalance(null);
    localStorage.removeItem("stellar_dapp_address");
    handleResetTransactionState();
  };

  // Friendbot Activation Action
  const handleActivateAccount = async () => {
    if (!connectedAddress) return;
    setIsFunding(true);
    try {
      const success = await fundWithFriendbot(connectedAddress);
      if (success) {
        // Refetch balance after a brief delay to let ledger settle
        setTimeout(() => {
          handleFetchBalance(connectedAddress);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Friendbot funding error:", err);
      alert(`Activation failed: ${err.message}`);
    } finally {
      setIsFunding(false);
    }
  };

  // Transaction Submission Flow
  const handleSendPayment = async (destination: string, amount: string, memo: string) => {
    if (!connectedAddress) return;
    setIsSubmittingTx(true);
    handleResetTransactionState();

    try {
      // Step A: Build transaction on client
      const xdr = await buildPaymentTransaction(connectedAddress, destination, amount, memo);

      // Step B: Sign XDR with Freighter
      const signedXdr = await signTx(xdr);

      // Step C: Submit signed XDR to Horizon
      const result = await submitTransaction(signedXdr);

      // Step D: Surface successful result
      if (result && result.hash) {
        setTxHash(result.hash);
        setTxSuccess(true);
        // Refresh balance to reflect updated amount & fees
        handleFetchBalance(connectedAddress);
      } else {
        throw new Error("Transaction submission returned an invalid result.");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setTxError(err.message || "Failed to submit transaction.");
      setTxSuccess(false);
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleResetTransactionState = () => {
    setTxSuccess(null);
    setTxHash(null);
    setTxError(null);
  };

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-center">
      {/* Container card */}
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-900 glass-card">
          <div className="flex items-center gap-3">
            {/* Pulsing galaxy loader logo */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md shadow-indigo-900/30">
              <span className="font-extrabold text-white text-lg tracking-wider">S</span>
              <span className="absolute inline-flex h-full w-full rounded-xl bg-indigo-400 opacity-20 animate-ping" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white m-0 sm:text-2xl">
                Stellar Pay
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">White Belt Simple dApp</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest bg-emerald-950/20 px-3 py-1 rounded-full border border-emerald-900/30">
              Testnet Only
            </span>
          </div>
        </header>

        {/* Wallet Connect / Installation & Warning State */}
        <WalletConnect
          connectedAddress={connectedAddress}
          onConnect={handleConnectWallet}
          onDisconnect={handleDisconnectWallet}
          isConnecting={isConnecting}
          setIsConnecting={setIsConnecting}
        />

        {/* Dashboard Grid (displays only when address is connected) */}
        {connectedAddress && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Balance Card Column */}
            <div className="md:col-span-2 space-y-6">
              <BalanceCard
                balance={balance}
                isLoading={isBalanceLoading}
                onRefresh={() => handleFetchBalance(connectedAddress)}
                onFund={handleActivateAccount}
                isFunding={isFunding}
              />
            </div>

            {/* Payment Form & Transaction Results Column */}
            <div className="md:col-span-3 space-y-6">
              {txSuccess === null ? (
                <SendPaymentForm
                  balance={balance}
                  onSend={handleSendPayment}
                  isSubmitting={isSubmittingTx}
                  walletConnected={!!connectedAddress}
                />
              ) : (
                <TransactionResult
                  success={txSuccess}
                  txHash={txHash}
                  errorMessage={txError}
                  onReset={handleResetTransactionState}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
