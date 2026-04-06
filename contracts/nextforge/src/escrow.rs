#![no_std]

use soroban_sdk::{token, Address, Env, String};
use crate::types::{DataKey, Order};
use crate::{events, machines, reputation};

pub fn create_order_with_id(
    env: &Env,
    order_id: String,
    buyer: Address,
    machine_id: String,
    description: String,
    total_cycles: u32,
    budget: i128,
) {
    buyer.require_auth();

    if env.storage().persistent().has(&DataKey::Order(order_id.clone())) {
        panic!("Order already exists");
    }

    let machine = machines::get_machine(env, machine_id.clone());
    
    if !machine.is_verified {
        panic!("Machine not verified by NextForge AI");
    }
    
    if budget < machine.price_per_cycle * (total_cycles as i128) {
        panic!("Budget too small");
    }

    // Transfer funds from buyer to the contract itself (escrow)
    let token_addr: Address = env.storage().instance().get(&DataKey::TokenAddress).unwrap();
    let token = token::Client::new(env, &token_addr);
    
    token.transfer(&buyer, &env.current_contract_address(), &budget);

    let order = Order {
        buyer: buyer.clone(),
        machine_id: machine_id.clone(),
        description,
        total_cycles,
        completed_cycles: 0,
        budget,
        price_per_cycle: machine.price_per_cycle,
        status: 0, // 0 = pending
        escrow_amount: budget,
        deposit_released: false,
        created_at: env.ledger().timestamp(),
    };

    env.storage().persistent().set(&DataKey::Order(order_id.clone()), &order);
    
    events::order_created(env, order_id.clone(), buyer, machine_id);
    events::escrow_locked(env, order_id, budget);
}

pub fn start_order(env: &Env, order_id: String) {
    let mut order: Order = env.storage().persistent().get(&DataKey::Order(order_id.clone())).unwrap();
    
    // Only machine owner or buyer can start it
    // For now we don't require specific auth to simplify hackathon demo (agent starts it off-chain)
    
    if order.status != 0 {
        panic!("Order not pending");
    }
    
    order.status = 1; // 1 = active
    
    // Release 50% deposit
    let deposit = order.budget / 2;
    order.escrow_amount -= deposit;
    order.deposit_released = true;
    
    let machine = machines::get_machine(env, order.machine_id.clone());
    
    let token_addr: Address = env.storage().instance().get(&DataKey::TokenAddress).unwrap();
    let token = token::Client::new(env, &token_addr);
    token.transfer(&env.current_contract_address(), &machine.payout_wallet, &deposit);

    env.storage().persistent().set(&DataKey::Order(order_id.clone()), &order);
    events::deposit_released(env, order_id, deposit);
}

pub fn complete_cycle(env: &Env, order_id: String) {
    let mut order: Order = env.storage().persistent().get(&DataKey::Order(order_id.clone())).unwrap();
    
    if order.status != 1 {
        panic!("Order not active");
    }
    
    let machine = machines::get_machine(env, order.machine_id.clone());
    
    order.completed_cycles += 1;
    let payment = order.price_per_cycle;
    order.escrow_amount -= payment;
    
    // Calculate 1% Protocol Fee (100 basis points)
    let fee_bps: i128 = env.storage().instance().get(&DataKey::ProtocolFeeBps).unwrap_or(100);
    let protocol_fee = (payment * fee_bps) / 10000;
    let net_payment = payment - protocol_fee;
    
    let token_addr: Address = env.storage().instance().get(&DataKey::TokenAddress).unwrap();
    let token = token::Client::new(env, &token_addr);
    
    // Transfer net amount to machine payout wallet
    token.transfer(&env.current_contract_address(), &machine.payout_wallet, &net_payment);
    
    // Transfer fee to NextForge Admin
    if protocol_fee > 0 {
        let admin_addr: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        token.transfer(&env.current_contract_address(), &admin_addr, &protocol_fee);
    }
    
    env.storage().persistent().set(&DataKey::Order(order_id.clone()), &order);
    events::cycle_completed(env, order_id.clone(), order.completed_cycles, payment);

    // If all cycles done, auto complete the order
    if order.completed_cycles == order.total_cycles {
        complete_order_internal(env, &mut order, order_id);
    }
}

pub fn complete_order_internal(env: &Env, order: &mut Order, order_id: String) {
    // Release remaining escrow
    let remaining = order.escrow_amount;
    order.escrow_amount = 0;
    order.status = 2; // completed
    
    let machine = machines::get_machine(env, order.machine_id.clone());
    
    if remaining > 0 {
        let fee_bps: i128 = env.storage().instance().get(&DataKey::ProtocolFeeBps).unwrap_or(100);
        let protocol_fee = (remaining * fee_bps) / 10000;
        let net_payment = remaining - protocol_fee;

        let token_addr: Address = env.storage().instance().get(&DataKey::TokenAddress).unwrap();
        let token = token::Client::new(env, &token_addr);
        token.transfer(&env.current_contract_address(), &machine.payout_wallet, &net_payment);

        if protocol_fee > 0 {
            let admin_addr: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
            token.transfer(&env.current_contract_address(), &admin_addr, &protocol_fee);
        }
    }
    
    env.storage().persistent().set(&DataKey::Order(order_id.clone()), &*order);
    events::order_completed(env, order_id, order.budget);
    
    // Update machine reputation
    reputation::update_reputation_internal(env, order.machine_id.clone(), true);
}

pub fn open_dispute(env: &Env, order_id: String) {
    let mut order: Order = env.storage().persistent().get(&DataKey::Order(order_id.clone())).unwrap();
    order.buyer.require_auth();
    
    if order.status != 1 {
        panic!("Cannot dispute");
    }
    
    order.status = 3; // disputed
    let refund = order.escrow_amount;
    order.escrow_amount = 0;
    
    if refund > 0 {
        let token_addr: Address = env.storage().instance().get(&DataKey::TokenAddress).unwrap();
        let token = token::Client::new(env, &token_addr);
        token.transfer(&env.current_contract_address(), &order.buyer, &refund);
    }
    
    env.storage().persistent().set(&DataKey::Order(order_id.clone()), &order);
    events::order_disputed(env, order_id);

    // Update machine rep as failure
    reputation::update_reputation_internal(env, order.machine_id.clone(), false);
}

pub fn get_order(env: &Env, order_id: String) -> Order {
    env.storage().persistent().get(&DataKey::Order(order_id)).unwrap()
}
