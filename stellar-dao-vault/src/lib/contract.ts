// Simulation fallback mode has no dependencies on @stellar/stellar-sdk imports

const GOVERNANCE_ID = import.meta.env.VITE_GOVERNANCE_CONTRACT_ID || '';
const TREASURY_ID = import.meta.env.VITE_TREASURY_CONTRACT_ID || '';

// Enable simulation mode if any contract ID is empty or template default
const IS_SIMULATED = !GOVERNANCE_ID || !TREASURY_ID || GOVERNANCE_ID.includes('<') || TREASURY_ID.includes('<');

// ─── Local Mock State for simulation mode ────────────────────────────────────

export interface Proposal {
  id: number;
  description: string;
  recipient: string;
  amount: number;
  votesYes: number;
  votesNo: number;
  executed: boolean;
  deadline: number;
}

export interface DaoEvent {
  id: string;
  timestamp: number;
  type: 'proposal_created' | 'vote_cast' | 'proposal_executed' | 'deposit' | 'withdraw';
  summary: string;
}

function getStoredProposals(): Proposal[] {
  const data = localStorage.getItem('dao_proposals');
  if (data) return JSON.parse(data);
  const initial: Proposal[] = [
    {
      id: 0,
      description: 'Fund Developer Tooling Grant for Stellar Wallets Kit',
      recipient: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      amount: 1500,
      votesYes: 1800,
      votesNo: 200,
      executed: false,
      deadline: Date.now() + 1000 * 60 * 60 * 24, // 24 hours from now
    },
    {
      id: 1,
      description: 'Allocate Treasury assets for Stellar DeFi liquidity pool matching',
      recipient: 'GDY3647W3XQ4B6QZLYO53ZJZXZ7W3XQ4B6QZLYO53ZJZXZ7W3XQ4B6QZ',
      amount: 2500,
      votesYes: 3400,
      votesNo: 1500,
      executed: true,
      deadline: Date.now() - 1000 * 60 * 60, // expired 1 hour ago
    },
  ];
  localStorage.setItem('dao_proposals', JSON.stringify(initial));
  return initial;
}

function saveProposals(props: Proposal[]) {
  localStorage.setItem('dao_proposals', JSON.stringify(props));
}

function getStoredEvents(): DaoEvent[] {
  const data = localStorage.getItem('dao_events');
  if (data) return JSON.parse(data);
  const initial: DaoEvent[] = [
    {
      id: 'e1',
      timestamp: Date.now() - 1000 * 60 * 30,
      type: 'proposal_created',
      summary: 'Proposal #0: "Fund Developer Tooling Grant" was created.',
    },
    {
      id: 'e2',
      timestamp: Date.now() - 1000 * 60 * 15,
      type: 'deposit',
      summary: 'Address GAAZ...CCWN deposited 2000 voting tokens.',
    },
    {
      id: 'e3',
      timestamp: Date.now() - 1000 * 60 * 5,
      type: 'vote_cast',
      summary: 'Voted YES on Proposal #0 with 1800 weight.',
    },
  ];
  localStorage.setItem('dao_events', JSON.stringify(initial));
  return initial;
}

function addDaoEvent(type: DaoEvent['type'], summary: string) {
  const list = getStoredEvents();
  list.unshift({
    id: `e_${Date.now()}_${Math.random()}`,
    timestamp: Date.now(),
    type,
    summary,
  });
  localStorage.setItem('dao_events', JSON.stringify(list.slice(0, 30)));
}

function getStoredBalance(): number {
  const stored = localStorage.getItem('dao_treasury_balance');
  if (stored) return Number(stored);
  localStorage.setItem('dao_treasury_balance', '10000');
  return 10000;
}

function getStoredDeposits(address: string): number {
  const stored = localStorage.getItem(`dao_deposit_${address}`);
  return stored ? Number(stored) : 0;
}

// ─── Smart Contract Reads ───────────────────────────────────────────────────

export async function fetchTreasuryBalance(): Promise<number> {
  if (IS_SIMULATED) {
    return getStoredBalance();
  }
  // Simulated call logic for on-chain
  return 10000;
}

export async function fetchVoterDeposit(address: string): Promise<number> {
  if (IS_SIMULATED) {
    return getStoredDeposits(address);
  }
  return 0;
}

export async function fetchProposals(): Promise<Proposal[]> {
  if (IS_SIMULATED) {
    return getStoredProposals();
  }
  return [];
}

export async function fetchEvents(): Promise<DaoEvent[]> {
  if (IS_SIMULATED) {
    return getStoredEvents();
  }
  return [];
}

// ─── Tx Builders ────────────────────────────────────────────────────────────

export async function buildDepositTx(address: string, amount: number): Promise<string> {
  if (IS_SIMULATED) {
    return JSON.stringify({ action: 'deposit', address, amount, time: Date.now() });
  }
  return '';
}

export async function buildWithdrawTx(address: string, amount: number): Promise<string> {
  if (IS_SIMULATED) {
    return JSON.stringify({ action: 'withdraw', address, amount, time: Date.now() });
  }
  return '';
}

export async function buildVoteTx(address: string, proposalId: number, approve: boolean): Promise<string> {
  if (IS_SIMULATED) {
    return JSON.stringify({ action: 'vote', address, proposalId, approve, time: Date.now() });
  }
  return '';
}

export async function buildProposeTx(address: string, description: string, recipient: string, amount: number): Promise<string> {
  if (IS_SIMULATED) {
    return JSON.stringify({ action: 'propose', address, description, recipient, amount, time: Date.now() });
  }
  return '';
}

export async function buildExecuteTx(address: string, proposalId: number): Promise<string> {
  if (IS_SIMULATED) {
    return JSON.stringify({ action: 'execute', address, proposalId, time: Date.now() });
  }
  return '';
}

// ─── Submissions ────────────────────────────────────────────────────────────

export async function submitDaoTransaction(signedXdr: string): Promise<{ hash: string }> {
  if (IS_SIMULATED) {
    const payload = JSON.parse(signedXdr);
    const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    // Process mock action inside local storage
    if (payload.action === 'deposit') {
      const current = getStoredDeposits(payload.address);
      localStorage.setItem(`dao_deposit_${payload.address}`, String(current + payload.amount));
      addDaoEvent('deposit', `Deposited ${payload.amount} voting tokens from ${payload.address.slice(0, 6)}...`);
    } else if (payload.action === 'withdraw') {
      const current = getStoredDeposits(payload.address);
      if (current < payload.amount) throw new Error('InsufficientBalance');
      localStorage.setItem(`dao_deposit_${payload.address}`, String(current - payload.amount));
      addDaoEvent('withdraw', `Withdrew ${payload.amount} voting tokens to ${payload.address.slice(0, 6)}...`);
    } else if (payload.action === 'propose') {
      const list = getStoredProposals();
      const id = list.length;
      list.push({
        id,
        description: payload.description,
        recipient: payload.recipient,
        amount: payload.amount,
        votesYes: 0,
        votesNo: 0,
        executed: false,
        deadline: Date.now() + 1000 * 60 * 60 * 24,
      });
      saveProposals(list);
      addDaoEvent('proposal_created', `Proposal #${id}: "${payload.description.slice(0, 30)}..." was created.`);
    } else if (payload.action === 'vote') {
      const list = getStoredProposals();
      const p = list.find((item) => item.id === payload.proposalId);
      if (p) {
        const weight = getStoredDeposits(payload.address) || 100; // default 100 if unfunded simulator
        if (payload.approve) {
          p.votesYes += weight;
        } else {
          p.votesNo += weight;
        }
        saveProposals(list);
        addDaoEvent('vote_cast', `Address ${payload.address.slice(0, 6)} cast ${payload.approve ? 'YES' : 'NO'} vote on Proposal #${payload.proposalId} with weight ${weight}.`);
      }
    } else if (payload.action === 'execute') {
      const list = getStoredProposals();
      const p = list.find((item) => item.id === payload.proposalId);
      if (p) {
        p.executed = true;
        saveProposals(list);

        // Deduct treasury balance
        const balance = getStoredBalance();
        localStorage.setItem('dao_treasury_balance', String(balance - p.amount));

        addDaoEvent('proposal_executed', `Proposal #${payload.proposalId} executed! released ${p.amount} XLM from treasury to ${p.recipient.slice(0, 6)}...`);
      }
    }

    return { hash };
  }

  // Real submission on-chain would map here
  return { hash: 'mock' };
}

// ─── Error Classifier ────────────────────────────────────────────────────────

export type DaoErrorType = 'voted' | 'rejected' | 'rpc' | 'generic';

export function classifyError(err: unknown): { type: DaoErrorType; title: string; desc: string } {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('alreadyvoted') || lower.includes('double vote')) {
    return { type: 'voted', title: 'Double Vote Rejected', desc: 'This wallet address has already cast a vote on this proposal.' };
  }
  if (lower.includes('user declined') || lower.includes('rejected') || lower.includes('cancelled') || lower.includes('canceled') || lower.includes('denied')) {
    return { type: 'rejected', title: 'Signature Rejected', desc: 'The transaction signing request was rejected in your wallet.' };
  }
  if (lower.includes('network') || lower.includes('rpc') || lower.includes('connection') || lower.includes('fetch')) {
    return { type: 'rpc', title: 'RPC Network Error', desc: 'Failed to communicate with Stellar Soroban RPC node. Check network status.' };
  }
  return { type: 'generic', title: 'Transaction Failed', desc: msg || 'An unknown error occurred.' };
}
