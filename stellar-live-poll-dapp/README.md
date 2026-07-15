# Stellar Live Poll — Soroban Smart Contract dApp (Testnet)

A production-quality, intermediate-scope Stellar decentralized application (dApp) built for the **Stellar Yellow Belt developer milestone**. This application allows users to connect any Stellar-compatible wallet via the multi-wallet **StellarWalletsKit**, participate in a live on-chain poll backed by a **Soroban smart contract** deployed on the Stellar Testnet, and see real-time vote results — with full transaction status visibility and graceful error handling.

---

## ⬆️ Level 1 → Level 2 Upgrade

| Feature | Level 1 — Stellar Pay | Level 2 — Stellar Live Poll |
|---|---|---|
| **Blockchain Layer** | Horizon API (Classic Stellar) | Soroban RPC (Smart Contract) |
| **Wallet Support** | Freighter only | Any wallet via StellarWalletsKit |
| **Contract Logic** | None — native XLM payments | Custom Rust/Soroban poll contract |
| **On-chain State** | None | Question, options, vote counts, voter registry |
| **Error Handling** | Basic Horizon errors | 3 typed contract errors |
| **Transaction Visibility** | Hash + explorer link | Status timeline + hash + explorer link |
| **Data Source** | Horizon REST API | Soroban RPC `simulateTransaction` |

---

## Features

- 🔌 **Multi-Wallet Connection via StellarWalletsKit**: Interactive wallet selection modal supporting Freighter, xBull, Albedo, Lobstr, Rabet, and more.
- 🌐 **Network Guard**: Detects non-Testnet wallets and shows a warning banner before allowing any action.
- 🗳️ **Live On-Chain Poll**: Reads the poll question and options from the deployed Soroban contract using `get_question` and `get_options`.
- 📊 **Real-Time Vote Counts**: Fetches current tallies from `get_results` after every successful vote.
- 🛡️ **Has-Voted Check**: Calls `has_voted` on load — if the address already voted, shows results directly.
- ✅ **One-Click Vote**: Full `build → simulate → sign → submit` Soroban cycle in a single button press.
- 🧱 **3 Error Types Handled**:
  1. **AlreadyVoted** — Contract rejects duplicate votes from the same address.
  2. **Signature Rejected** — Wallet popup was dismissed or denied.
  3. **RPC / Network Error** — Node unreachable, insufficient fee, or invalid transaction.
- 📡 **Transaction Status Timeline**: Live status bar progresses through `Building → Simulating → Signing → Submitting → Confirmed / Failed`.
- 🎨 **Premium Glassmorphic Dark UI**: Vibrant animated gradient, frosted-glass cards, micro-animations, and a live results bar chart.

---

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Vanilla CSS (Glassmorphism, CSS animations, custom properties)
- **Stellar Libraries**:
  - `@stellar/stellar-sdk` (Soroban RPC, `Contract.call`, `nativeToScVal`, `scValToNative`, `TransactionBuilder`)
  - `@creit.tech/stellar-wallets-kit` (Multi-wallet modal, `StellarWalletsKit.authModal`, `signTransaction`)
- **Smart Contract**: Rust + Soroban SDK v22 (compiled to WASM, deployed on Stellar Testnet)

---

## Smart Contract

Located at [`contracts/poll/src/lib.rs`](./contracts/poll/src/lib.rs).

### Contract Methods

| Method | Type | Description |
|---|---|---|
| `initialize(question, options)` | Write (once) | Sets the poll question and options. Panics if already called. |
| `vote(voter, option_index)` | Write | Casts a vote. Enforces `require_auth`, rejects duplicates. |
| `get_results()` | Read | Returns `Vec<u32>` of vote counts (parallel to options). |
| `has_voted(voter)` | Read | Returns `bool` — whether the address has already voted. |
| `get_question()` | Read | Returns the poll question `String`. |
| `get_options()` | Read | Returns `Vec<String>` of option labels. |

### Error Strings (Panic Messages)

| Error | Trigger |
|---|---|
| `"AlreadyInitialized"` | `initialize` called more than once |
| `"NoOptions"` | `initialize` called with empty options array |
| `"AlreadyVoted"` | `vote` called by an address that already voted |
| `"InvalidOption"` | `vote` called with an out-of-range index |
| `"NotInitialized"` | `get_question` / `get_options` called before `initialize` |

### Storage Design

```
instance storage  → Question, Options, Counts
                    (TTL auto-bumped on every call — keeps poll alive)

persistent storage → Voted(Address) = bool
                     (survives TTL — prevents re-voting after expiry)
```

---

## Deployed Contract

| Field | Value |
|---|---|
| **Network** | Stellar Testnet |
| **Contract ID** | `[To be filled after deployment]` |
| **Initialization Tx Hash** | `[To be filled after deployment]` |
| **Soroban RPC** | `https://soroban-testnet.stellar.org` |

---

## Installation & Setup

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) v18+ and a Stellar-compatible browser wallet such as [Freighter](https://www.freighter.app/) installed and set to **Testnet**.

### 2. Clone the Repository

```bash
git clone <repository-url>
cd stellar-live-poll-dapp
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_CONTRACT_ID=<your_deployed_contract_id>
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

### 5. Launch the Development Server

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## Stellar Testnet Workflow

1. **Connect Wallet**: Click **"Connect Wallet"** — the StellarWalletsKit modal opens with all supported wallets.
2. **Select Wallet**: Choose Freighter (or any installed wallet) and approve the connection.
3. **View Poll**: Question and options load from the contract. If you already voted, results are shown directly.
4. **Cast Vote**: Select your preferred option and click **"Submit Vote"**.
5. **Approve in Wallet**: Your wallet opens a signing popup — review and approve.
6. **Track Status**: Watch the progress: `Building → Simulating → Signing → Submitting → ✅ Confirmed`.
7. **See Results**: After confirmation, the live bar chart updates. Click **"View on Stellar.Expert"** to inspect on-chain.

---

## Screenshots

### Wallet Selection Modal (StellarWalletsKit)
`[Screenshot: Multi-wallet modal showing Freighter, xBull, Albedo, Rabet, Lobstr options]`

### Poll Voting View
`[Screenshot: Poll card with question, 4 option buttons, and the Submit Vote button]`

### Transaction Status Timeline
`[Screenshot: Status bar showing Building → Simulating → Signing → Submitting, one step active]`

### Successful Vote — Results View
`[Screenshot: Animated bar chart of vote counts, winning option highlighted]`

### Error — Already Voted
`[Screenshot: Red error banner: "You have already voted from this address."]`

### Error — Signature Rejected
`[Screenshot: Orange warning banner: "Transaction signing was cancelled."]`

---

## Running Contract Tests

The contract has 7 unit tests covering all core logic paths. Requires Rust + Cargo:

```bash
cd contracts/poll
cargo test
```

| # | Test | Validates |
|---|---|---|
| 1 | `test_vote_increments_count` | Normal vote path |
| 2 | `test_multiple_voters_multiple_options` | Multiple voters, multiple options |
| 3 | `test_double_vote_same_option_rejected` | `AlreadyVoted` — same option |
| 4 | `test_double_vote_different_option_rejected` | `AlreadyVoted` — different option |
| 5 | `test_invalid_option_index_rejected` | `InvalidOption` — out of range |
| 6 | `test_reinitialize_rejected` | `AlreadyInitialized` |
| 7 | `test_getters_return_initialized_values` | Read-only getters |

### ✅ Verified Test Output (2026-07-15)

```
running 7 tests
test tests::test_getters_return_initialized_values ... ok
test tests::test_reinitialize_rejected - should panic ... ok
test tests::test_invalid_option_index_rejected - should panic ... ok
test tests::test_double_vote_different_option_rejected - should panic ... ok
test tests::test_vote_increments_count ... ok
test tests::test_double_vote_same_option_rejected - should panic ... ok
test tests::test_multiple_voters_multiple_options ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s
```

---


## Project Structure

```
stellar-live-poll-dapp/
├── contracts/
│   └── poll/
│       ├── Cargo.toml          ← Soroban contract manifest
│       └── src/
│           └── lib.rs          ← Poll smart contract + 7 unit tests
├── src/
│   ├── lib/
│   │   ├── wallet.ts           ← StellarWalletsKit init & helpers
│   │   └── contract.ts         ← Soroban RPC calls (read + vote)
│   ├── components/
│   │   ├── WalletConnect.tsx   ← Multi-wallet connect / disconnect
│   │   ├── PollCard.tsx        ← Question + option selection UI
│   │   ├── ResultsChart.tsx    ← Animated bar chart for results
│   │   ├── TxStatus.tsx        ← Transaction status timeline
│   │   └── ErrorBanner.tsx     ← Typed error display
│   ├── App.tsx                 ← Root state orchestration
│   ├── main.tsx                ← React entry point
│   └── index.css               ← Global styles & design tokens
├── .env.example                ← Environment variable template
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```
