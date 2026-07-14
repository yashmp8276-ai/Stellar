import React, { useState, useEffect } from "react";
import { checkIsConnected, connectAndGetAddress, getWalletNetwork } from "../lib/freighter";

interface WalletConnectProps {
  connectedAddress: string | null;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  isConnecting: boolean;
  setIsConnecting: (connecting: boolean) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  connectedAddress,
  onConnect,
  onDisconnect,
  isConnecting,
  setIsConnecting,
}) => {
  const [hasFreighter, setHasFreighter] = useState<boolean | null>(null);
  const [networkError, setNetworkError] = useState<boolean>(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Check Freighter installation and network on mount and interval
  useEffect(() => {
    async function initCheck() {
      const installed = await checkIsConnected();
      setHasFreighter(installed);

      if (installed && connectedAddress) {
        await verifyNetwork();
      }
    }
    initCheck();

    // Set up polling for network changes because Freighter doesn't always trigger events
    const interval = setInterval(async () => {
      const installed = await checkIsConnected();
      if (installed && connectedAddress) {
        await verifyNetwork();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [connectedAddress]);

  const verifyNetwork = async () => {
    const netDetails = await getWalletNetwork();
    if (netDetails) {
      setCurrentNetwork(netDetails.network);
      // We only allow TESTNET for this hackathon dApp
      if (netDetails.network !== "TESTNET") {
        setNetworkError(true);
      } else {
        setNetworkError(false);
      }
    } else {
      setNetworkError(true);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const installed = await checkIsConnected();
      if (!installed) {
        alert(
          "Freighter wallet extension not detected. Please install Freighter and refresh the page."
        );
        setIsConnecting(false);
        return;
      }

      // connectAndGetAddress() calls requestAccess() which triggers the
      // Freighter permission popup and returns the user's public key.
      const address = await connectAndGetAddress();
      if (address) {
        onConnect(address);
        // Verify network immediately after connecting
        const netDetails = await getWalletNetwork();
        if (netDetails) {
          setCurrentNetwork(netDetails.network);
          setNetworkError(netDetails.network !== "TESTNET");
        }
      } else {
        console.warn(
          "Wallet access was rejected by the user or no address returned."
        );
      }
    } catch (err: any) {
      console.error("Connection failed:", err);
      alert(`Connection error: ${err?.message ?? "Unknown error"}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const copyAddress = () => {
    if (connectedAddress) {
      navigator.clipboard.writeText(connectedAddress);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Render download helper if Freighter is not installed
  if (hasFreighter === false) {
    return (
      <div className="w-full p-4 mb-6 rounded-xl border border-red-500/30 bg-red-950/20 text-red-200 text-sm flex flex-col md:flex-row items-center justify-between gap-4 glass-card">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Freighter Extension Not Detected</p>
            <p className="text-xs text-red-300">You need the Freighter browser extension to use this application.</p>
          </div>
        </div>
        <a
          id="download-freighter-btn"
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md shadow-red-950/50"
        >
          Download Freighter
        </a>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Network Warning Banner */}
      {connectedAddress && networkError && (
        <div className="w-full p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-200 text-sm flex items-start gap-3 glass-card animate-pulse">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Network Mismatch</p>
            <p className="text-xs text-amber-300">
              Freighter is currently on <span className="underline font-bold">{currentNetwork || "Unknown"}</span>. 
              Please open Freighter and switch your network to <span className="font-bold text-white">TESTNET</span>.
            </p>
          </div>
        </div>
      )}

      {/* Connection Dashboard / Card */}
      <div className="p-6 rounded-2xl glass-card flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Freighter Integration</h2>
          <p className="text-slate-400 text-xs mt-1">
            {connectedAddress 
              ? "Connected to Stellar Testnet" 
              : "Connect your Freighter wallet to query balance and send payments."}
          </p>
        </div>

        {connectedAddress ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-sm font-mono text-indigo-300 w-full sm:w-auto justify-between">
              <span>
                {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-6)}
              </span>
              <button
                id="copy-address-btn"
                onClick={copyAddress}
                className="text-xs text-slate-400 hover:text-white transition-colors ml-2 focus:outline-none"
                title="Copy Address"
              >
                {copySuccess ? "Copied!" : "📋"}
              </button>
            </div>
            <button
              id="disconnect-wallet-btn"
              onClick={onDisconnect}
              className="px-4 py-2 border border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-lg text-sm font-medium transition-all w-full sm:w-auto"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            id="connect-wallet-btn"
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-950/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none w-full md:w-auto flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Wallet"
            )}
          </button>
        )}
      </div>
    </div>
  );
};
export default WalletConnect;
