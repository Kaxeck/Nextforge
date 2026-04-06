#![no_std]

use soroban_sdk::{Address, BytesN, Env, String, Vec};
use crate::types::{DataKey, Review};
use crate::{events, machines, maintenance};

pub fn update_reputation_internal(env: &Env, machine_id: String, success: bool) {
    let mut machine = machines::get_machine(env, machine_id.clone());
    
    machine.total_jobs += 1;
    if success {
        machine.successful_jobs += 1;
    }
    
    // Base score based on completion rate
    let completion_rate = (machine.successful_jobs * 100) / machine.total_jobs;
    
    // Add logic to get average rating, but for this hackathon version we simplify 
    // and rely heavily on completion rate, adding a static bonus per good review 
    // in `add_review` instead, or calculating it on-the-fly. 
    // Since reading all reviews is expensive on-chain, we keep the score logic simple:
    machine.reputation = completion_rate;
    
    env.storage().persistent().set(&DataKey::Machine(machine_id.clone()), &machine);
    events::reputation_updated(env, machine_id.clone(), machine.reputation);
    
    // Check if we need to trigger maintenance
    maintenance::check_threshold(env, machine_id);
}

pub fn add_review(
    env: &Env,
    reviewer: Address,
    machine_id: String,
    order_id: String,
    rating: u32,
    comment_hash: BytesN<32>,
) {
    reviewer.require_auth();
    
    // Ideally verify that reviewer == order.buyer, skipped for simplicity here.
    if rating < 1 || rating > 5 {
        panic!("Invalid rating");
    }

    let mut count: u32 = env.storage().persistent().get(&DataKey::ReviewCount(machine_id.clone())).unwrap_or(0);
    
    let review = Review {
        reviewer,
        machine_id: machine_id.clone(),
        order_id,
        rating,
        comment_hash,
        timestamp: env.ledger().timestamp(),
    };
    
    env.storage().persistent().set(&DataKey::Review(machine_id.clone(), count), &review);
    
    count += 1;
    env.storage().persistent().set(&DataKey::ReviewCount(machine_id.clone()), &count);
    
    events::review_added(env, machine_id.clone(), rating);

    // Apply quick rating modifier to reputation
    let mut machine = machines::get_machine(env, machine_id.clone());
    if rating >= 4 && machine.reputation < 100 {
        machine.reputation += 1;
    } else if rating <= 2 && machine.reputation > 0 {
        machine.reputation -= 2;
    }
    env.storage().persistent().set(&DataKey::Machine(machine_id.clone()), &machine);
    
    maintenance::check_threshold(env, machine_id);
}

pub fn get_reviews(env: &Env, machine_id: String) -> Vec<Review> {
    let mut reviews = Vec::new(env);
    let count: u32 = env.storage().persistent().get(&DataKey::ReviewCount(machine_id.clone())).unwrap_or(0);
    
    for i in 0..count {
        if let Some(rev) = env.storage().persistent().get(&DataKey::Review(machine_id.clone(), i)) {
            reviews.push_back(rev);
        }
    }
    reviews
}
