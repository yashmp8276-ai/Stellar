import React, { useState } from 'react';
import { initKit, openAuthModal, disconnectWallet } from '../lib/wallet';

interface Props {
  address: string | null;
  isConnecting: boolean;
  networkOk: boolean;
  currentNetwork: string;
  onConnect: (addr: string) => void;
  onDisconnect: () => void;
  setIsConnecting: (v: boolean) => void;
}

const WalletConnect: React.FC<Props> = ({
  address, isConnecting, networkOk, currentNetwork,
  onConnect, onDisconnect, setIsConnecting,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await initKit();
      const { address: addr } = await openAuthModal();
      if (addr) onConnect(addr);
    } catch (e: any) {
      console.error('Wallet connect failed:', e?.message || (typeof e === 'object' ? JSON.stringify(e) : e));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try { await disconnectWallet(); } catch { /* ignore */ }
    onDisconnect();
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-6)}`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {address && !networkOk && (
        <div className="network-warning">
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Network Warning</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              Wallet is currently connected to <strong>{currentNetwork || 'Unknown'}</strong>.
              Please switch to <strong style={{ color: '#fff' }}>TESTNET</strong> network.
            </div>
          </div>
        </div>
      )}

      <div className="glass-card wallet-panel">
        <div className="wallet-info">
          <h2>🔗 DAO Wallet</h2>
          <p>{address ? 'Connected to Stellar Testnet' : 'Connect any Stellar wallet to participate in the governance.'}</p>
        </div>

        <div className="wallet-actions">
          {address ? (
            <>
              <div className="address-chip">
                <span>{shortAddr}</span>
                <button className="copy-btn" onClick={copyAddress} title="Copy Address">
                  {copySuccess ? '✅' : '📋'}
                </button>
              </div>
              <button id="disconnect-btn" className="btn-ghost" onClick={handleDisconnect}>
                Disconnect
              </button>
            </>
          ) : (
            <button
              id="connect-wallet-btn"
              className="btn-primary"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? <><span className="spinner" /> Connecting…</> : '🔌 Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
