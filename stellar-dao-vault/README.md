# Stellar DAO — Governance & Treasury Vault (Testnet)

A production-quality, advanced-scope decentralized autonomous organization (DAO) platform built for the **Stellar Orange Belt developer milestone**. This application features cooperating **Soroban smart contracts** (Governance & Treasury Vault) executing on-chain funds release via inter-contract calls, real-time event streaming, automated CI/CD pipeline validation, and a premium mobile-responsive glassmorphic dashboard.

---

## ⬆️ Level 2 → Level 3 Upgrade

| Feature | Level 2 — Stellar Live Poll | Level 3 — Stellar DAO & Treasury |
|---|---|---|
| **Smart Contracts** | Single contract (`PollContract`) | Multi-contract (`Governance` + `TreasuryVault`) |
| **Contract Calls** | User to Contract | User to Governance → **Inter-Contract call** to Treasury |
| **Core State** | Simple poll question & tally | Proposals list, user voter deposits, and vault assets |
| **Real-Time Feed** | Periodic results polling | Real-time on-chain Event Stream (`proposal_created`, `vote_cast`) |
| **CI/CD Pipeline** | None | GitHub Actions automated compilation & cargo tests |
| **Responsive UI** | Desktop glassmorphic card | Mobile-first dashboard (vault, proposals, timeline, activity feed) |
| **Error Handling** | Basic wallet & duplicate checks | Multi-tier auth checks (caller verification, deposit limits, deadlines) |

---

## Features

- 💼 **Cooperating Smart Contracts (Inter-Contract Call)**: A secure, multi-contract architecture where the **Treasury Vault** holds DAO assets and only releases them when authorized by the **Governance Contract** via a verified on-chain inter-contract call.
- 💰 **Voter Token Deposit & Power**: Users deposit assets into the Governance contract to gain voting weight, matching real-world governance mechanics.
- 🗳️ **DAO Proposal Management**: Create, view, vote on, and execute proposals (release of treasury XLM to a recipient address).
- 📡 **Real-Time On-chain Event Stream**: Subscribes to Soroban RPC event logs to display a live activity timeline of all contract actions (`proposal_created`, `vote_cast`, `proposal_executed`).
- 🤖 **GitHub Actions CI/CD Pipeline**: Fully automated workflow validating contract syntax, compiling WASM modules, and running all unit tests on every commit.
- 📐 **Mobile-Responsive Glassmorphic UI**: Vibrant gradient background, frosted-glass cards, animated progress bars, and custom layouts tailored for both mobile viewports and desktop screens.
- 🧱 **Advanced Error & Loading Guards**: Gracefully handles transaction signatures, caller verification panics, locked deposit withdrawals, and RPC connectivity issues.

---

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Vanilla CSS (Responsive Flexbox/Grid, CSS custom variables, glassmorphic filters, keyframe animations)
- **Stellar Libraries**:
  - `@stellar/stellar-sdk` (Soroban RPC Client, `Contract.call`, `nativeToScVal`, `scValToNative`, `TransactionBuilder`)
  - `@creit.tech/stellar-wallets-kit` (Multi-wallet modal setup, transaction signing)
- **Smart Contracts**: Rust + Soroban SDK v22 (compiled to WASM)

---

## Smart Contracts Architecture

Smart contracts are located in [`contracts/governance/src/lib.rs`](./contracts/governance/src/lib.rs) and [`contracts/treasury/src/lib.rs`](./contracts/treasury/src/lib.rs).

### 1. Governance Contract Interface

| Method | Type | Description |
|---|---|---|
| `initialize(env, treasury_id)` | Write (once) | Stores the Treasury contract ID. |
| `deposit(env, voter, amount)` | Write | Deposits assets to gain voting weight. Enforces `require_auth`. |
| `withdraw(env, voter, amount)` | Write | Withdraws assets if they are not locked in active voting. |
| `propose(env, description, recipient, amount)` | Write | Creates a governance proposal to release treasury funds. |
| `vote(env, voter, proposal_id, approve)` | Write | Casts approval/rejection vote. Weights match voter's deposited balance. |
| `execute(env, proposal_id)` | Write | If passed after deadline, triggers the Treasury vault. |
| `get_proposal(env, proposal_id)` | Read | Returns details of a specific proposal. |

### 2. Treasury Contract Interface

| Method | Type | Description |
|---|---|---|
| `initialize(env, governance_id)` | Write (once) | Stores the authorized Governance contract ID. |
| `release_funds(env, to, amount)` | Write | Sends assets to recipient. **Enforces caller is Governance ID.** |
| `get_balance(env)` | Read | Returns current vault treasury balance. |

### Storage Design

```
Governance Contract:
  - Instance Storage   → Treasury ID, Proposal Count
  - Persistent Storage → Proposals(proposal_id) = ProposalInfo
                       → VoterBalances(address) = i128

Treasury Contract:
  - Instance Storage   → Governance ID
  - Persistent Storage → Vault Balance = i128
```

---

## Deployed Contracts (Testnet)

| Contract | Address |
|---|---|
| **Governance Contract** | `[To be filled after deployment]` |
| **Treasury Contract** | `[To be filled after deployment]` |
| **Initialization Transaction** | `[To be filled after deployment]` |

---

## CI/CD Pipeline

The project includes an automated GitHub Actions workflow defined in [`.github/workflows/stellar.yml`](./.github/workflows/stellar.yml):

- Installs Rust Toolchain (`stable-x86_64-pc-windows-gnu` / `linux-gnu`)
- Adds `wasm32-unknown-unknown` compilation target
- Runs Rust Unit Tests across all contracts (`cargo test`)
- Validates clean contract compilation builds

---

## Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ & npm
- [Freighter Wallet](https://www.freighter.app/) extension (configured for Testnet)

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
VITE_GOVERNANCE_CONTRACT_ID=<deployed_governance_id>
VITE_TREASURY_CONTRACT_ID=<deployed_treasury_id>
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

### 4. Run Development Server
```bash
npm run dev
```

---

## Smart Contract Tests

Unit tests are included to validate correctness. To run tests locally:
```bash
# Test Governance
cd contracts/governance
cargo test

# Test Treasury
cd contracts/treasury
cargo test

# Test Frontend (Vitest)
npm run test
```

### ✅ Verified Test Output (2026-07-15)

**Governance Contract** (`contracts/governance/src/lib.rs`) — 4 tests:
```
running 4 tests
test tests::test_execution_calls_treasury ... ok
test tests::test_double_voting_rejected - should panic ... ok
test tests::test_deposit_increases_voting_power ... ok
test tests::test_vote_proposal ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s
```

**Treasury Contract** (`contracts/treasury/src/lib.rs`) — 2 tests:
```
running 2 tests
test tests::test_release_funds_unauthorized - should panic ... ok
test tests::test_release_funds_authorized ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
```

**Frontend — Vitest** (`npm run test`) — 10 tests across 2 files:
```
 RUN  v4.1.10

 ✓ src/test/ErrorBanner.test.tsx (5 tests) 64ms
 ✓ src/test/TreasuryVault.test.tsx (5 tests) 258ms

 Test Files  2 passed (2)
      Tests  10 passed (10)
   Duration  3.89s
```

**Frontend Build** (`npm run build`):
```
vite v8.1.4 building client environment for production...
✓ 333 modules transformed.
dist/index.html                   0.46 kB │ gzip:   0.29 kB
dist/assets/index-CcgwiNxI.css   11.63 kB │ gzip:   3.14 kB
dist/assets/utils-CPrpbW7U.js   124.84 kB │ gzip:  33.87 kB
dist/assets/index-DlKPVhAJ.js   311.86 kB │ gzip: 100.67 kB

✓ built in 611ms
```

---


## Project Structure

```
stellar-dao-vault/
├── .github/
│   └── workflows/
│       └── stellar.yml         # CI/CD pipeline script
├── contracts/
│   ├── governance/
│   │   ├── Cargo.toml          # Governance contract manifest
│   │   └── src/
│   │       └── lib.rs          # Governance smart contract logic
│   └── treasury/
│   │   ├── Cargo.toml          # Treasury contract manifest
│   │   └── src/
│   │       └── lib.rs          # Treasury smart contract logic
├── src/
│   ├── components/
│   │   ├── WalletConnect.tsx   # Multi-wallet kit loader
│   │   ├── TreasuryVault.tsx   # Deposit and balance view
│   │   ├── ProposalList.tsx    # Governance proposals cards
│   │   ├── EventStream.tsx     # Real-time activity event logger
│   │   ├── TxStatus.tsx        # Transaction status timeline
│   │   └── ErrorBanner.tsx     # Specialized error guard
│   ├── lib/
│   │   ├── wallet.ts           # Wallet connection helpers
│   │   └── contract.ts         # Multi-contract reads, writes & simulation
│   ├── App.tsx                 # Dashboard container
│   ├── index.css               # Vanilla CSS design systems
│   └── main.tsx                # Frontend entrypoint
├── .env.example
├── index.html
├── package.json
└── README.md
```
