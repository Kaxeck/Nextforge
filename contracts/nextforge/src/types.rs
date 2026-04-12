use soroban_sdk::{contracttype, Address, String, Symbol, BytesN};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Machine {
    pub owner: Address,          // dueño responsable
    pub payout_wallet: Address,  // recibe los pagos (storage frío/seguro)
    pub machine_wallet: Address, // firma las transacciones (nodo)
    pub auto_repair: bool,       // mantenimiento autónomo opcional
    pub is_verified: bool,       // verificado por la IA Broker
    pub machine_type: Symbol,    // FDM, CNC, LASER, INJECTION
    pub price_per_cycle: i128,   // en stroops (USDC smallest unit)
    pub location: String,        // "León, MX"
    pub materials: String,       // "PLA, PETG, ABS"
    pub reputation: u32,         // 0-100
    pub total_jobs: u32,
    pub successful_jobs: u32,
    pub is_available: bool,
    pub registered_at: u64,      // ledger timestamp
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Order {
    pub buyer: Address,
    pub machine_id: String,
    pub description: String,
    pub total_cycles: u32,
    pub completed_cycles: u32,
    pub budget: i128,
    pub price_per_cycle: i128,
    pub status: u32,             // 0=pending, 1=active, 2=completed, 3=disputed, 4=cancelled
    pub escrow_amount: i128,
    pub deposit_released: bool,
    pub created_at: u64,
    pub timelock_deadline: u64,
    pub max_spend_limit: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Review {
    pub reviewer: Address,
    pub machine_id: String,
    pub order_id: String,
    pub rating: u32,             // 1-5
    pub comment_hash: BytesN<32>, // IPFS/memo hash
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    TokenAddress,               // Address of native token XLM or USDC SAC
    MaintenanceWallet,
    MaintenanceThreshold,       // default 55
    MaintenanceFee,             // default 0.020 USDC (or XLM)
    ProtocolFeeBps,             // basis points (e.g. 100 = 1%)
    Machine(String),            // machine_id -> Machine
    MachineList,                // Vec<String> de IDs
    Order(String),              // order_id -> Order
    OrderCounter,               // u32 auto-increment
    Review(String, u32),        // (machine_id, index) -> Review
    ReviewCount(String),        // machine_id -> count
}
