#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, String, Symbol, BytesN, Vec};
use crate::types::{Machine, Order, Review, DataKey};

mod types;
mod events;
mod machines;
mod escrow;
mod reputation;
mod maintenance;

#[cfg(test)]
mod test;

#[contract]
pub struct NextForgeContract;

#[contractimpl]
impl NextForgeContract {
    /// Initialize the contract with the native token (or USDC) address and admin
    pub fn init(env: Env, admin: Address, token_address: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenAddress, &token_address);
    }

    // --- MACHINE MODULE ---

    pub fn register_machine(
        env: Env,
        machine_id: String,
        owner: Address,
        payout_wallet: Address,
        machine_wallet: Address,
        auto_repair: bool,
        machine_type: Symbol,
        price_per_cycle: i128,
        location: String,
        materials: String,
    ) {
        machines::register_machine(&env, machine_id, owner, payout_wallet, machine_wallet, auto_repair, machine_type, price_per_cycle, location, materials);
    }

    pub fn get_machine(env: Env, machine_id: String) -> Machine {
        machines::get_machine(&env, machine_id)
    }

    pub fn list_machines(env: Env) -> Vec<String> {
        machines::list_machines(&env)
    }

    pub fn update_price(env: Env, machine_id: String, new_price: i128) {
        machines::update_price(&env, machine_id, new_price);
    }

    pub fn set_availability(env: Env, machine_id: String, available: bool) {
        machines::set_availability(&env, machine_id, available);
    }

    pub fn verify_machine(env: Env, machine_id: String) {
        machines::verify_machine(&env, machine_id);
    }

    // --- ESCROW MODULE ---

    pub fn create_order(
        env: Env,
        order_id: String,
        buyer: Address,
        machine_id: String,
        description: String,
        total_cycles: u32,
        budget: i128,
    ) {
        escrow::create_order_with_id(&env, order_id, buyer, machine_id, description, total_cycles, budget);
    }

    pub fn start_order(env: Env, order_id: String) {
        escrow::start_order(&env, order_id);
    }

    pub fn complete_cycle(env: Env, order_id: String) {
        escrow::complete_cycle(&env, order_id);
    }

    pub fn open_dispute(env: Env, order_id: String) {
        escrow::open_dispute(&env, order_id);
    }

    pub fn get_order(env: Env, order_id: String) -> Order {
        escrow::get_order(&env, order_id)
    }

    // --- REPUTATION MODULE ---

    pub fn add_review(
        env: Env,
        reviewer: Address,
        machine_id: String,
        order_id: String,
        rating: u32,
        comment_hash: BytesN<32>,
    ) {
        reputation::add_review(&env, reviewer, machine_id, order_id, rating, comment_hash);
    }

    pub fn get_reviews(env: Env, machine_id: String) -> Vec<Review> {
        reputation::get_reviews(&env, machine_id)
    }

    // --- MAINTENANCE MODULE ---

    pub fn set_maintenance_config(
        env: Env,
        admin: Address,
        threshold: u32,
        fee: i128,
        wallet: Address,
    ) {
        maintenance::set_maintenance_config(&env, admin, threshold, fee, wallet);
    }

    pub fn complete_maintenance(env: Env, agent: Address, machine_id: String) {
        maintenance::complete_maintenance(&env, agent, machine_id);
    }
}
