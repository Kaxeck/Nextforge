#![no_std]

use soroban_sdk::{symbol_short, Address, Env, String, Symbol};

pub fn machine_registered(env: &Env, machine_id: String) {
    env.events()
        .publish((symbol_short!("machine"), symbol_short!("reg")), machine_id);
}

pub fn order_created(env: &Env, order_id: String, buyer: Address, machine_id: String) {
    env.events()
        .publish((symbol_short!("order"), symbol_short!("created")), (order_id, buyer, machine_id));
}

pub fn escrow_locked(env: &Env, order_id: String, amount: i128) {
    env.events()
        .publish((symbol_short!("escrow"), symbol_short!("locked")), (order_id, amount));
}

pub fn deposit_released(env: &Env, order_id: String, amount: i128) {
    env.events()
        .publish((symbol_short!("deposit"), symbol_short!("rel")), (order_id, amount));
}

pub fn cycle_completed(env: &Env, order_id: String, cycle_num: u32, payment: i128) {
    env.events()
        .publish((symbol_short!("cycle"), symbol_short!("comp")), (order_id, cycle_num, payment));
}

pub fn order_completed(env: &Env, order_id: String, total_paid: i128) {
    env.events()
        .publish((symbol_short!("order"), symbol_short!("comp")), (order_id, total_paid));
}

pub fn order_disputed(env: &Env, order_id: String) {
    env.events()
        .publish((symbol_short!("order"), symbol_short!("disp")), order_id);
}

pub fn review_added(env: &Env, machine_id: String, rating: u32) {
    env.events()
        .publish((symbol_short!("review"), symbol_short!("added")), (machine_id, rating));
}

pub fn reputation_updated(env: &Env, machine_id: String, new_score: u32) {
    env.events()
        .publish((symbol_short!("rep"), symbol_short!("upd")), (machine_id, new_score));
}

pub fn maintenance_triggered(env: &Env, machine_id: String, fee: i128) {
    env.events()
        .publish((symbol_short!("maint"), symbol_short!("trig")), (machine_id, fee));
}

pub fn maintenance_completed(env: &Env, machine_id: String, new_score: u32) {
    env.events()
        .publish((symbol_short!("maint"), symbol_short!("comp")), (machine_id, new_score));
}
