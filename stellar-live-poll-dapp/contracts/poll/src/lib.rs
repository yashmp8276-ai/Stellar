#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Vec,
};

// ─── Storage Key Schema ────────────────────────────────────────────────────
//
//  instance()   → Question, Options, Counts
//    These are read/written on every contract call and are cheap to bump.
//    Using instance storage means the TTL is automatically extended on
//    every invocation, keeping the poll alive as long as it's active.
//
//  persistent() → Voted(Address)
//    Each voter's record must survive indefinitely — we cannot use
//    temporary() here because that expires silently and would allow
//    re-voting after TTL expiry. persistent() is the correct choice.
//
#[contracttype]
pub enum DataKey {
    Question,       // String
    Options,        // Vec<String>
    Counts,         // Vec<u32>  — parallel array with Options
    Voted(Address), // bool — persistent, keyed per-voter
}

#[contract]
pub struct PollContract;

#[contractimpl]
impl PollContract {
    // ──────────────────────────────────────────────────────────────────────
    //  initialize(env, question, options)
    //
    //  One-time setup. Panics if called again after the first init.
    //  No auth guard here — whoever deploys the contract calls initialize
    //  in the same transaction (or the next one). Once set, immutable.
    // ──────────────────────────────────────────────────────────────────────
    pub fn initialize(env: Env, question: String, options: Vec<String>) {
        if env.storage().instance().has(&DataKey::Question) {
            panic!("AlreadyInitialized");
        }
        if options.len() == 0 {
            panic!("NoOptions");
        }

        let n = options.len();
        let mut counts: Vec<u32> = Vec::new(&env);
        for _ in 0..n {
            counts.push_back(0u32);
        }

        env.storage().instance().set(&DataKey::Question, &question);
        env.storage().instance().set(&DataKey::Options, &options);
        env.storage().instance().set(&DataKey::Counts, &counts);
    }

    // ──────────────────────────────────────────────────────────────────────
    //  vote(env, voter, option_index)
    //
    //  Requires voter authorization (Freighter/wallet signature enforced
    //  by the Soroban host via require_auth — not just a courtesy check).
    //  Panics on double-vote or out-of-range option.
    //
    //  Event emitted on success:
    //    topics : (Symbol("vote_cast"), option_index: u32)
    //    data   : new_count: u32
    //
    //  Frontend getEvents() filter:
    //    topicFilters: [["vote_cast", "*"]]
    //    The second topic (option_index) can be matched as wildcard "*"
    //    to receive all vote events, then parsed client-side.
    // ──────────────────────────────────────────────────────────────────────
    pub fn vote(env: Env, voter: Address, option_index: u32) {
        // ① Enforce authorization — the voter's wallet MUST have signed
        //    the transaction. This is actual enforcement, not a check.
        voter.require_auth();

        // ② Reject double-voting using persistent storage (survives TTL).
        if env.storage().persistent().has(&DataKey::Voted(voter.clone())) {
            panic!("AlreadyVoted");
        }

        // ③ Load current counts and validate option index.
        let mut counts: Vec<u32> = env
            .storage()
            .instance()
            .get(&DataKey::Counts)
            .unwrap_or(Vec::new(&env));

        if option_index >= counts.len() {
            panic!("InvalidOption");
        }

        // ④ Increment the relevant option's count.
        let old_count = counts.get(option_index).unwrap_or(0);
        let new_count = old_count + 1;
        counts.set(option_index, new_count);
        env.storage().instance().set(&DataKey::Counts, &counts);

        // ⑤ Persist the voter record so they cannot vote again.
        env.storage()
            .persistent()
            .set(&DataKey::Voted(voter), &true);

        // ⑥ Emit event — shape locked in here so frontend can match it.
        //    topic[0] = symbol "vote_cast"  (9 chars — fits symbol_short!)
        //    topic[1] = option_index (u32)
        //    data     = new_count   (u32)
        env.events().publish(
            (symbol_short!("vote_cast"), option_index),
            new_count,
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    //  get_results(env) → Vec<u32>
    //  Read-only: returns current vote counts for all options (parallel
    //  to the options array stored at init time).
    // ──────────────────────────────────────────────────────────────────────
    pub fn get_results(env: Env) -> Vec<u32> {
        env.storage()
            .instance()
            .get(&DataKey::Counts)
            .unwrap_or(Vec::new(&env))
    }

    // ──────────────────────────────────────────────────────────────────────
    //  has_voted(env, voter) → bool
    //  Read-only: checks persistent storage for the voter's record.
    // ──────────────────────────────────────────────────────────────────────
    pub fn has_voted(env: Env, voter: Address) -> bool {
        env.storage().persistent().has(&DataKey::Voted(voter))
    }

    // ──────────────────────────────────────────────────────────────────────
    //  get_question / get_options — convenience read-only views
    //  (the frontend can also read these once at startup to render the poll)
    // ──────────────────────────────────────────────────────────────────────
    pub fn get_question(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Question)
            .expect("NotInitialized")
    }

    pub fn get_options(env: Env) -> Vec<String> {
        env.storage()
            .instance()
            .get(&DataKey::Options)
            .expect("NotInitialized")
    }
}

// ─── Unit Tests ────────────────────────────────────────────────────────────
//
//  Run with: cargo test
//  No testnet required — soroban-sdk testutils simulate the host in-process.
//  Tests cover all 3 rejection paths (require_auth is mocked via
//  env.mock_all_auths() so we focus on business logic).
//
#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, vec, Env, String};

    /// Helper: deploys a fresh contract and calls initialize with 4 options.
    fn setup() -> (Env, PollContractClient<'static>) {
        let env = Env::default();
        // mock_all_auths() satisfies require_auth() for every address in tests
        // without needing real key signatures. This lets us test business
        // logic in isolation.
        env.mock_all_auths();

        let contract_id = env.register_contract(None, PollContract);
        let client = PollContractClient::new(&env, &contract_id);

        let question = String::from_str(&env, "What is your favorite Stellar use case?");
        let options = vec![
            &env,
            String::from_str(&env, "DeFi / Trading"),
            String::from_str(&env, "Payments & Remittance"),
            String::from_str(&env, "NFTs & Tokenization"),
            String::from_str(&env, "Developer Tooling"),
        ];
        client.initialize(&question, &options);

        (env, client)
    }

    // ① Normal vote path: single voter, correct option, count increments.
    #[test]
    fn test_vote_increments_count() {
        let (env, client) = setup();
        let voter = Address::generate(&env);

        // Before voting
        let results_before = client.get_results();
        assert_eq!(results_before.get(0).unwrap(), 0);
        assert!(!client.has_voted(&voter));

        // Cast vote for option 0
        client.vote(&voter, &0u32);

        // After voting
        let results_after = client.get_results();
        assert_eq!(results_after.get(0).unwrap(), 1);
        assert_eq!(results_after.get(1).unwrap(), 0); // Other options unchanged
        assert!(client.has_voted(&voter));
    }

    // ② Multiple different voters, multiple options — all counts correct.
    #[test]
    fn test_multiple_voters_multiple_options() {
        let (env, client) = setup();

        let v1 = Address::generate(&env);
        let v2 = Address::generate(&env);
        let v3 = Address::generate(&env);

        client.vote(&v1, &0u32);
        client.vote(&v2, &2u32);
        client.vote(&v3, &2u32);

        let results = client.get_results();
        assert_eq!(results.get(0).unwrap(), 1);
        assert_eq!(results.get(1).unwrap(), 0);
        assert_eq!(results.get(2).unwrap(), 2);
        assert_eq!(results.get(3).unwrap(), 0);
    }

    // ③ Double-vote rejection — same address, same option.
    //    This is the most critical safety property of the contract.
    #[test]
    #[should_panic(expected = "AlreadyVoted")]
    fn test_double_vote_same_option_rejected() {
        let (env, client) = setup();
        let voter = Address::generate(&env);
        client.vote(&voter, &0u32);
        client.vote(&voter, &0u32); // Must panic
    }

    // ④ Double-vote rejection — same address, *different* option.
    //    Even switching options must not be allowed.
    #[test]
    #[should_panic(expected = "AlreadyVoted")]
    fn test_double_vote_different_option_rejected() {
        let (env, client) = setup();
        let voter = Address::generate(&env);
        client.vote(&voter, &0u32);
        client.vote(&voter, &1u32); // Must also panic
    }

    // ⑤ Out-of-range option index rejection.
    #[test]
    #[should_panic(expected = "InvalidOption")]
    fn test_invalid_option_index_rejected() {
        let (env, client) = setup();
        let voter = Address::generate(&env);
        client.vote(&voter, &99u32); // Far out of range — must panic
    }

    // ⑥ Re-initialization rejected.
    #[test]
    #[should_panic(expected = "AlreadyInitialized")]
    fn test_reinitialize_rejected() {
        let (env, client) = setup();
        let question = String::from_str(&env, "New question?");
        let options = vec![&env, String::from_str(&env, "Yes"), String::from_str(&env, "No")];
        client.initialize(&question, &options); // Must panic
    }

    // ⑦ get_question / get_options return the values set at init.
    #[test]
    fn test_getters_return_initialized_values() {
        let (env, client) = setup();
        let q = client.get_question();
        assert_eq!(q, String::from_str(&env, "What is your favorite Stellar use case?"));
        let opts = client.get_options();
        assert_eq!(opts.len(), 4);
        assert_eq!(opts.get(0).unwrap(), String::from_str(&env, "DeFi / Trading"));
    }
}
