#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum DataKey {
    Governance, // Address
    Balance,    // i128
}

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
    pub fn initialize(env: Env, governance: Address, initial_balance: i128) {
        if env.storage().instance().has(&DataKey::Governance) {
            panic!("AlreadyInitialized");
        }
        env.storage().instance().set(&DataKey::Governance, &governance);
        env.storage().instance().set(&DataKey::Balance, &initial_balance);
    }

    pub fn release_funds(env: Env, to: Address, amount: i128) {
        let governance: Address = env
            .storage()
            .instance()
            .get(&DataKey::Governance)
            .expect("NotInitialized");

        // Enforce caller authorization: only the Governance contract can call this method!
        governance.require_auth();

        let mut balance: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Balance)
            .unwrap_or(0);

        if amount > balance {
            panic!("InsufficientVaultBalance");
        }

        balance -= amount;
        env.storage().instance().set(&DataKey::Balance, &balance);

        // In a real-world scenario, we would transfer native or token assets using Token Client:
        // let token_client = token::Client::new(&env, &token_address);
        // token_client.transfer(&env.current_contract_address(), &to, &amount);
    }

    pub fn get_balance(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance)
            .unwrap_or(0)
    }
}

// ─── Unit Tests ────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_release_funds_authorized() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, TreasuryContract);
        let client = TreasuryContractClient::new(&env, &contract_id);

        let gov = Address::generate(&env);
        let recipient = Address::generate(&env);

        client.initialize(&gov, &10000i128);

        // mock_all_auths() covers governance.require_auth(); call directly:
        client.release_funds(&recipient, &1500i128);

        assert_eq!(client.get_balance(), 8500i128);
    }

    #[test]
    #[should_panic] // Must panic because caller is not governance
    fn test_release_funds_unauthorized() {
        let env = Env::default();
        // Do not call mock_all_auths to verify auth enforcement fails on bad caller
        let contract_id = env.register_contract(None, TreasuryContract);
        let client = TreasuryContractClient::new(&env, &contract_id);

        let gov = Address::generate(&env);
        let hacker = Address::generate(&env);
        let recipient = Address::generate(&env);

        client.initialize(&gov, &10000i128);

        // Hacker address tries to call release_funds
        env.as_contract(&hacker, || {
            client.release_funds(&recipient, &1500i128);
        });
    }
}
