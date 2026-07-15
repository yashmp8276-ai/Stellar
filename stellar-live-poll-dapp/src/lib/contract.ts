import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';

const RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || '';
const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE || Networks.TESTNET;

// If contract ID is empty, invalid, or left as placeholder, enable simulation mode
const IS_SIMULATED = !CONTRACT_ID || CONTRACT_ID.includes('<') || CONTRACT_ID.includes('placeholder');

const server = new rpc.Server(RPC_URL, { allowHttp: false });

// ─── Local Mock State for Simulation Mode ────────────────────────────────────
const MOCK_QUESTION = 'What is your favorite Stellar Yellow Belt feature?';
const MOCK_OPTIONS = [
  'Soroban Smart Contracts (Rust)',
  'Multi-Wallet Kit Integration',
  'Transaction Status Timeline',
  'Vibrant CSS Glassmorphic Styling',
];

function getMockResults(): number[] {
  const stored = localStorage.getItem('stellar_poll_mock_results');
  if (stored) return JSON.parse(stored);
  const initial = [42, 28, 35, 19];
  localStorage.setItem('stellar_poll_mock_results', JSON.stringify(initial));
  return initial;
}

function saveMockResults(results: number[]) {
  localStorage.setItem('stellar_poll_mock_results', JSON.stringify(results));
}

function getMockVoted(address: string): boolean {
  const stored = localStorage.getItem(`stellar_poll_voted_${address}`);
  return stored === 'true';
}

function setMockVoted(address: string) {
  localStorage.setItem(`stellar_poll_voted_${address}`, 'true');
}

// ─── Read-only helpers ──────────────────────────────────────────────────────

async function simulateReadOnly(fnName: string, args: xdr.ScVal[] = []): Promise<xdr.ScVal> {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount('GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN');
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call(fnName, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if ('error' in sim) throw new Error(`Simulation error: ${sim.error}`);
  if (!sim.result?.retval) throw new Error('No return value from simulation');
  return sim.result.retval;
}

export async function fetchQuestion(): Promise<string> {
  if (IS_SIMULATED) {
    return MOCK_QUESTION;
  }
  const val = await simulateReadOnly('get_question');
  return scValToNative(val) as string;
}

export async function fetchOptions(): Promise<string[]> {
  if (IS_SIMULATED) {
    return MOCK_OPTIONS;
  }
  const val = await simulateReadOnly('get_options');
  return scValToNative(val) as string[];
}

export async function fetchResults(): Promise<number[]> {
  if (IS_SIMULATED) {
    return getMockResults();
  }
  const val = await simulateReadOnly('get_results');
  const raw = scValToNative(val) as bigint[];
  return raw.map((n) => Number(n));
}

export async function fetchHasVoted(voterAddress: string): Promise<boolean> {
  if (IS_SIMULATED) {
    return getMockVoted(voterAddress);
  }
  const voterArg = new Address(voterAddress).toScVal();
  const val = await simulateReadOnly('has_voted', [voterArg]);
  return scValToNative(val) as boolean;
}

// ─── Vote transaction builder ───────────────────────────────────────────────

export async function buildVoteTransaction(voterAddress: string, optionIndex: number): Promise<string> {
  if (IS_SIMULATED) {
    // Return a mock payload representing the transaction build state
    return JSON.stringify({ voterAddress, optionIndex, timestamp: Date.now() });
  }

  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(voterAddress);
  const voterArg = new Address(voterAddress).toScVal();
  const indexArg = nativeToScVal(optionIndex, { type: 'u32' });

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('vote', voterArg, indexArg))
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  return prepared.toXDR();
}

// ─── Submit signed transaction ──────────────────────────────────────────────

export async function submitVoteTransaction(signedXdr: string): Promise<{ hash: string }> {
  if (IS_SIMULATED) {
    // In simulation mode, parse the mock transaction payload
    const data = JSON.parse(signedXdr);
    const results = getMockResults();

    // Check double vote simulation
    if (getMockVoted(data.voterAddress)) {
      throw new Error('AlreadyVoted');
    }

    // Process vote increment
    results[data.optionIndex] = (results[data.optionIndex] || 0) + 1;
    saveMockResults(results);
    setMockVoted(data.voterAddress);

    // Return a realistic mock transaction hash
    const randomHex = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return { hash: randomHex };
  }

  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const response = await server.sendTransaction(tx);

  if (response.status === 'ERROR') {
    const errMsg = (response as any).errorResult?.toString() || 'Transaction submission failed';
    throw new Error(errMsg);
  }

  // Poll for confirmation
  const hash = response.hash;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const status = await server.getTransaction(hash);
    if (status.status === rpc.Api.GetTransactionStatus.SUCCESS) return { hash };
    if (status.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error('Transaction failed on-chain');
    }
  }
  throw new Error('Transaction confirmation timed out');
}

// ─── Error classifier ───────────────────────────────────────────────────────

export type VoteErrorType = 'wallet_not_found' | 'voted' | 'rejected' | 'rpc' | 'generic';

export function classifyError(err: unknown): { type: VoteErrorType; title: string; desc: string } {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('wallet not found') || lower.includes('not installed') || lower.includes('no wallet') || lower.includes('extension not detected') || lower.includes('install')) {
    return { type: 'wallet_not_found', title: 'Wallet Not Found', desc: 'No Stellar wallet extension detected. Install Freighter or another compatible wallet and refresh.' };
  }
  if (lower.includes('alreadyvoted') || lower.includes('already voted')) {
    return { type: 'voted', title: 'Already Voted', desc: 'This address has already cast a vote in this poll.' };
  }
  if (lower.includes('user declined') || lower.includes('rejected') || lower.includes('cancelled') || lower.includes('canceled') || lower.includes('denied')) {
    return { type: 'rejected', title: 'Signature Rejected', desc: 'The transaction signing was cancelled in your wallet.' };
  }
  if (lower.includes('network') || lower.includes('rpc') || lower.includes('connection') || lower.includes('fetch')) {
    return { type: 'rpc', title: 'Network Error', desc: 'Could not reach the Soroban RPC node. Check your connection and try again.' };
  }
  return { type: 'generic', title: 'Transaction Failed', desc: msg || 'An unknown error occurred. Please try again.' };
}
