import React, { useState, useEffect } from 'react';
import WalletConnect from './components/WalletConnect';
import TreasuryVault from './components/TreasuryVault';
import ProposalList from './components/ProposalList';
import EventStream from './components/EventStream';
import TxStatus, { type TxStep } from './components/TxStatus';
import ErrorBanner from './components/ErrorBanner';
import {
  initKit,
  getConnectedAddress,
  getConnectedNetwork,
  signTransactionXdr,
  onKitStateUpdate,
} from './lib/wallet';
import {
  fetchTreasuryBalance,
  fetchVoterDeposit,
  fetchProposals,
  fetchEvents,
  buildDepositTx,
  buildWithdrawTx,
  buildVoteTx,
  buildProposeTx,
  buildExecuteTx,
  submitDaoTransaction,
  classifyError,
} from './lib/contract';
import type { Proposal, DaoEvent, DaoErrorType } from './lib/contract';

const App: React.FC = () => {
  // Wallet State
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkOk, setNetworkOk] = useState(true);
  const [currentNetwork, setCurrentNetwork] = useState('');

  // Dao State
  const [loadingDao, setLoadingDao] = useState(true);
  const [vaultBalance, setVaultBalance] = useState(10000);
  const [voterDeposit, setVoterDeposit] = useState(0);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [events, setEvents] = useState<DaoEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Tx Status State
  const [txStep, setTxStep] = useState<TxStep>('idle');
  const [txError, setTxError] = useState<{ type: DaoErrorType; title: string; desc: string } | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // 1. Initialize Wallet Kit Checks
  useEffect(() => {
    async function initCheck() {
      await initKit();
      const addr = await getConnectedAddress();
      if (addr) {
        setAddress(addr);
        await verifyNetwork();
      }
    }
    initCheck();

    const unsubscribe = onKitStateUpdate(async (newAddr) => {
      if (newAddr) {
        setAddress(newAddr);
        await verifyNetwork();
      } else {
        setAddress(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const verifyNetwork = async () => {
    const details = await getConnectedNetwork();
    if (details) {
      setCurrentNetwork(details.network);
      const isTestnet =
        details.network.toUpperCase() === 'TESTNET' ||
        details.networkPassphrase.includes('Test SDF Network');
      setNetworkOk(isTestnet);
    } else {
      setNetworkOk(false);
    }
  };

  // 2. Dao Data Loader
  const loadDaoData = async () => {
    setLoadingDao(true);
    setLoadError(null);
    try {
      const balance = await fetchTreasuryBalance();
      const props = await fetchProposals();
      const list = await fetchEvents();
      setVaultBalance(balance);
      setProposals(props);
      setEvents(list);

      if (address) {
        const deposit = await fetchVoterDeposit(address);
        setVoterDeposit(deposit);
      } else {
        setVoterDeposit(0);
      }
    } catch (e: any) {
      console.error('Failed to load DAO data:', e);
      setLoadError(e?.message || 'Failed to fetch DAO details.');
    } finally {
      setLoadingDao(false);
    }
  };

  useEffect(() => {
    loadDaoData();
  }, [address]);

  // Event stream background auto-refresher (every 4 seconds)
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!loadingDao && !loadError) {
        try {
          const balance = await fetchTreasuryBalance();
          const props = await fetchProposals();
          const list = await fetchEvents();
          setVaultBalance(balance);
          setProposals(props);
          setEvents(list);

          if (address) {
            const deposit = await fetchVoterDeposit(address);
            setVoterDeposit(deposit);
          }
        } catch {
          // ignore background fetch glitches
        }
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [loadingDao, loadError, address]);

  // 3. Dao Action Handlers

  const runDaoTx = async (txBuilder: () => Promise<string>) => {
    if (!address) return;
    setTxError(null);
    setTxHash(null);

    try {
      // 1. Build
      setTxStep('building');
      const preparedXdr = await txBuilder();
      await new Promise((r) => setTimeout(r, 600));

      // 2. Simulate
      setTxStep('simulating');
      await new Promise((r) => setTimeout(r, 600));

      // 3. Sign
      setTxStep('signing');
      let signedXdr: string;
      if (preparedXdr.startsWith('{')) {
        // Bypass real wallet signing if in mock/simulation mode (JSON string)
        signedXdr = preparedXdr;
        await new Promise((r) => setTimeout(r, 600));
      } else {
        const passphrase = import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
        signedXdr = await signTransactionXdr(preparedXdr, {
          networkPassphrase: passphrase,
          address,
        });
      }
      await new Promise((r) => setTimeout(r, 400));

      // 4. Submit
      setTxStep('submitting');
      const { hash } = await submitDaoTransaction(signedXdr);

      // 5. Confirmed
      setTxHash(hash);
      setTxStep('confirmed');

      // Instantly reload DAO state
      await loadDaoData();
    } catch (e: any) {
      console.error('DAO transaction failed:', e?.message || (typeof e === 'object' ? JSON.stringify(e) : e));
      setTxStep('error');
      setTxError(classifyError(e));
    }
  };

  const handleDeposit = (amount: number) => {
    runDaoTx(() => buildDepositTx(address!, amount));
  };

  const handleWithdraw = (amount: number) => {
    runDaoTx(() => buildWithdrawTx(address!, amount));
  };

  const handleVote = (proposalId: number, approve: boolean) => {
    runDaoTx(() => buildVoteTx(address!, proposalId, approve));
  };

  const handleCreateProposal = (description: string, recipient: string, amount: number) => {
    runDaoTx(() => buildProposeTx(address!, description, recipient, amount));
  };

  const handleExecute = (proposalId: number) => {
    runDaoTx(() => buildExecuteTx(address!, proposalId));
  };

  const isTxActive = txStep !== 'idle' && txStep !== 'confirmed' && txStep !== 'error';

  return (
    <div className="app-wrapper">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Header */}
      <header className="glass-card app-header">
        <div className="header-brand">
          <div className="header-logo">
            🏛️
            <div className="ping" />
          </div>
          <div>
            <h1 className="header-title">Stellar DAO Portal</h1>
            <p className="header-subtitle">Governance & Treasury Vault</p>
          </div>
        </div>
        <div className="testnet-badge">
          <span className="testnet-dot" />
          Stellar Testnet
        </div>
      </header>

      {/* Wallet Connect */}
      <WalletConnect
        address={address}
        isConnecting={isConnecting}
        networkOk={networkOk}
        currentNetwork={currentNetwork}
        onConnect={(addr) => setAddress(addr)}
        onDisconnect={() => setAddress(null)}
        setIsConnecting={setIsConnecting}
      />

      {/* Transaction status notifications */}
      <ErrorBanner error={txError} />

      {txStep === 'confirmed' && txHash && (
        <div className="success-banner">
          <span style={{ fontSize: '1.25rem' }}>🎉</span>
          <div>
            <div style={{ fontWeight: 700 }}>Transaction Confirmed!</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              The Governance action has been permanently committed to the ledger.
            </div>
            <div className="success-hash">Hash: {txHash}</div>
            <div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="explorer-link"
              >
                View on Stellar.Expert ↗
              </a>
            </div>
          </div>
        </div>
      )}

      <TxStatus step={txStep} />

      {/* Main Grid */}
      <main style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {loadingDao ? (
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ height: '20px', width: '25%' }} />
            <div className="skeleton" style={{ height: '40px', width: '60%' }} />
            <div className="skeleton" style={{ height: '100px' }} />
          </div>
        ) : loadError ? (
          <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem' }}>🏛️</span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '1rem 0' }}>DAO Portal Offline</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              {loadError}
            </p>
            <button className="btn-primary" onClick={loadDaoData}>
              🔄 Try Reconnect
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Vault Balance & Deposit Portal */}
            <TreasuryVault
              vaultBalance={vaultBalance}
              voterDeposit={voterDeposit}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              isActionActive={isTxActive}
              disabled={!address || !networkOk}
            />

            {/* Event Activity Stream */}
            <EventStream events={events} />

            {/* Governance Proposals list */}
            <ProposalList
              proposals={proposals}
              voterDeposit={voterDeposit}
              onVote={handleVote}
              onExecute={handleExecute}
              onCreateProposal={handleCreateProposal}
              isActionActive={isTxActive}
              disabled={!address || !networkOk}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
