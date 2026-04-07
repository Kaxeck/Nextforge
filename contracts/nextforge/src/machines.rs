use soroban_sdk::{Address, Env, String, Symbol, Vec};
use crate::types::{DataKey, Machine};
use crate::events;

pub fn register_machine(
    env: &Env,
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
    // Requires authorization from the owner registering the machine
    owner.require_auth();

    // Check if machine already exists
    if env.storage().persistent().has(&DataKey::Machine(machine_id.clone())) {
        panic!("Machine already registered");
    }

    // Creating initial machine record
    let machine = Machine {
        owner: owner.clone(),
        payout_wallet,
        machine_wallet,
        auto_repair,
        is_verified: false, // Starts as false until AI verifies it
        machine_type,
        price_per_cycle,
        location,
        materials,
        reputation: 50, // Neural starting point
        total_jobs: 0,
        successful_jobs: 0,
        is_available: true,
        registered_at: env.ledger().timestamp(),
    };

    env.storage().persistent().set(&DataKey::Machine(machine_id.clone()), &machine);

    // Add to Machine List
    let mut machine_list: Vec<String> = env
        .storage()
        .persistent()
        .get(&DataKey::MachineList)
        .unwrap_or_else(|| Vec::new(&env));
    
    machine_list.push_back(machine_id.clone());
    env.storage().persistent().set(&DataKey::MachineList, &machine_list);

    // Publish event
    events::machine_registered(env, machine_id);
}

pub fn get_machine(env: &Env, machine_id: String) -> Machine {
    env.storage()
        .persistent()
        .get(&DataKey::Machine(machine_id))
        .unwrap_or_else(|| panic!("Machine not found"))
}

pub fn list_machines(env: &Env) -> Vec<String> {
    env.storage()
        .persistent()
        .get(&DataKey::MachineList)
        .unwrap_or_else(|| Vec::new(&env))
}

pub fn update_price(env: &Env, machine_id: String, new_price: i128) {
    let mut machine = get_machine(env, machine_id.clone());
    machine.owner.require_auth();
    
    machine.price_per_cycle = new_price;
    env.storage().persistent().set(&DataKey::Machine(machine_id), &machine);
}

pub fn set_availability(env: &Env, machine_id: String, available: bool) {
    let mut machine = get_machine(env, machine_id.clone());
    machine.owner.require_auth();
    
    machine.is_available = available;
    env.storage().persistent().set(&DataKey::Machine(machine_id), &machine);
}

pub fn verify_machine(env: &Env, machine_id: String) {
    // Only the admin (AI's wallet) can verify
    let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
    admin.require_auth();

    let mut machine = get_machine(env, machine_id.clone());
    machine.is_verified = true;
    env.storage().persistent().set(&DataKey::Machine(machine_id), &machine);
}
