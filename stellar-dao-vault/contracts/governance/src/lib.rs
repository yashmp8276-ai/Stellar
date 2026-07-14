#![no_std]

use soroban_sdk::{
    contract, contractclient, contractimpl, contracttype, symbol_short,
    Address, Env, String, Vec,
};

// Define client interface for Treasury contract to perform inter-contract calls
#[contractclient(name = "TreasuryClient")]
pub trait TreasuryTrait {
    fn release_funds(env: Env, to: Address, amount: i128);
}

#[contracttype]
pub struct ProposalInfo {
    pub id: u32,
    pub description: String,
    pub recipient: Address,
    pub amount: i128,
    pub votes_yes: i128,
    pub votes_no: i128,
    pub executed: bool,
}

#[contracttype]
pub enum DataKey {
    Treasury,           // Address
    ProposalCount,      // u32
    Proposal(u32),      // ProposalInfo
    Deposit(Address),   // i128
    Voted(u32, Address), // bool
}

#[contract]
pub struct GovernanceContract;

#[contractimpl]
impl GovernanceContract {
    pub fn initialize(env: Env, treasury: Address) {
        if env.storage().instance().has(&DataKey::Treasury) {
            panic!("AlreadyInitialized");
        }
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::ProposalCount, &0u32);
    }

    pub fn deposit(env: Env, voter: Address, amount: i128) {
        voter.require_auth();
        if amount <= 0 {
            panic!("InvalidAmount");
        }

        let mut balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Deposit(voter.clone()))
            .unwrap_or(0);

        balance += amount;
        env.storage().persistent().set(&DataKey::Deposit(voter), &balance);
    }

    pub fn withdraw(env: Env, voter: Address, amount: i128) {
        voter.require_auth();
        if amount <= 0 {
            panic!("InvalidAmount");
        }

        let mut balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Deposit(voter.clone()))
            .unwrap_or(0);

        if amount > balance {
            panic!("InsufficientDeposit");
        }

        balance -= amount;
        env.storage().persistent().set(&DataKey::Deposit(voter), &balance);
    }

    pub fn propose(env: Env, description: String, recipient: Address, amount: i128) -> u32 {
        if amount <= 0 {
            panic!("InvalidProposalAmount");
        }

        let mut count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0);

        let proposal = ProposalInfo {
            id: count,
            description,
            recipient,
            amount,
            votes_yes: 0,
            votes_no: 0,
            executed: false,
        };

        env.storage().persistent().set(&DataKey::Proposal(count), &proposal);
        env.events().publish((symbol_short!("proposed"), count), count);

        count += 1;
        env.storage().instance().set(&DataKey::ProposalCount, &count);

        proposal.id
    }

    pub fn vote(env: Env, voter: Address, proposal_id: u32, approve: bool) {
        voter.require_auth();

        // 1. Enforce voter deposit power
        let weight: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Deposit(voter.clone()))
            .unwrap_or(0);

        if weight <= 0 {
            panic!("NoVotingPower");
        }

        // 2. Reject double voting on this proposal
        if env.storage().persistent().has(&DataKey::Voted(proposal_id, voter.clone())) {
            panic!("AlreadyVoted");
        }

        // 3. Load proposal
        let mut proposal: ProposalInfo = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .expect("ProposalNotFound");

        if proposal.executed {
            panic!("ProposalAlreadyExecuted");
        }

        // 4. Update vote totals
        if approve {
            proposal.votes_yes += weight;
        } else {
            proposal.votes_no += weight;
        }

        // 5. Save state
        env.storage().persistent().set(&DataKey::Proposal(proposal_id), &proposal);
        env.storage().persistent().set(&DataKey::Voted(proposal_id, voter), &true);

        env.events().publish(
            (symbol_short!("voted"), proposal_id),
            approve,
        );
    }

    pub fn execute(env: Env, proposal_id: u32) {
        let mut proposal: ProposalInfo = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .expect("ProposalNotFound");

        if proposal.executed {
            panic!("AlreadyExecuted");
        }

        // Pass threshold rule: yes votes must exceed no votes, and total yes weight > 1500
        if proposal.votes_yes <= proposal.votes_no || proposal.votes_yes <= 1500 {
            panic!("ProposalNotPassed");
        }

        // Set as executed
        proposal.executed = true;
        env.storage().persistent().set(&DataKey::Proposal(proposal_id), &proposal);

        // Fetch Treasury Contract Address
        let treasury: Address = env
            .storage()
            .instance()
            .get(&DataKey::Treasury)
            .expect("TreasuryAddressMissing");

        // Execute dynamic on-chain INTER-CONTRACT CALL to release funds!
        let treasury_client = TreasuryClient::new(&env, &treasury);
        treasury_client.release_funds(&proposal.recipient, &proposal.amount);

        env.events().publish((symbol_short!("executed"), proposal_id), proposal_id);
    }

    pub fn get_proposal(env: Env, proposal_id: u32) -> ProposalInfo {
        env.storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .expect("ProposalNotFound")
    }

    pub fn get_deposit(env: Env, voter: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Deposit(voter))
            .unwrap_or(0)
    }
}

// ─── Unit Tests ────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    // Mock target contract to test inter-contract execution logic
    #[contract]
    pub struct MockTreasuryContract;

    #[contractimpl]
    impl MockTreasuryContract {
        pub fn release_funds(env: Env, _to: Address, _amount: i128) {
            // Mock implementation that simply returns
        }
    }

    fn setup() -> (Env, GovernanceContractClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let gov_id = env.register_contract(None, GovernanceContract);
        let gov_client = GovernanceContractClient::new(&env, &gov_id);

        let treasury_id = env.register_contract(None, MockTreasuryContract);
        gov_client.initialize(&treasury_id);

        (env, gov_client, treasury_id)
    }

    #[test]
    fn test_deposit_increases_voting_power() {
        let (env, client, _) = setup();
        let voter = Address::generate(&env);

        client.deposit(&voter, &2000i128);
        assert_eq!(client.get_deposit(&voter), 2000i128);
    }

    #[test]
    fn test_vote_proposal() {
        let (env, client, _) = setup();
        let voter = Address::generate(&env);

        client.deposit(&voter, &2000i128);

        let recipient = Address::generate(&env);
        let desc = String::from_str(&env, "Fund translation efforts");
        let prop_id = client.propose(&desc, &recipient, &1000i128);

        client.vote(&voter, &prop_id, &true);

        let prop = client.get_proposal(&prop_id);
        assert_eq!(prop.votes_yes, 2000i128);
        assert_eq!(prop.votes_no, 0i128);
    }

    #[test]
    #[should_panic(expected = "AlreadyVoted")]
    fn test_double_voting_rejected() {
        let (env, client, _) = setup();
        let voter = Address::generate(&env);

        client.deposit(&voter, &2000i128);
        let recipient = Address::generate(&env);
        let desc = String::from_str(&env, "DAO marketing");
        let prop_id = client.propose(&desc, &recipient, &1000i128);

        client.vote(&voter, &prop_id, &true);
        client.vote(&voter, &prop_id, &true); // Must panic
    }

    #[test]
    fn test_execution_calls_treasury() {
        let (env, client, _) = setup();
        let voter = Address::generate(&env);

        client.deposit(&voter, &2000i128); // yes weight is 2000 (> 1500 threshold)
        let recipient = Address::generate(&env);
        let desc = String::from_str(&env, "Payout developer");
        let prop_id = client.propose(&desc, &recipient, &1000i128);

        client.vote(&voter, &prop_id, &true);

        // Executes successfully calling the MockTreasuryContract release_funds method
        client.execute(&prop_id);

        let prop = client.get_proposal(&prop_id);
        assert!(prop.executed);
    }
}
