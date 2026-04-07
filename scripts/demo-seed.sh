#!/bin/bash
set -e

# Loads the .env file to get CONTRACT_ID
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

CONTRACT_ID=${SOROBAN_CONTRACT_ID:-""}

if [ -z "$CONTRACT_ID" ]; then
    echo "❌ SOROBAN_CONTRACT_ID is not set. Run setup.sh first."
    exit 1
fi

echo "🌱 Seeding NextForge Contract: $CONTRACT_ID"

export PATH="$HOME/.cargo/bin:$PATH"

# Initialize the contract (Assuming native XLM for testing)
echo "1️⃣ Initializing contract as NextForge Admin"
# Native XLM on testnet: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
stellar contract invoke --id $CONTRACT_ID --source nextforge-deployer --network testnet -- init \
    --admin nextforge-deployer \
    --token_address CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC || echo "Already initialized"

echo "2️⃣ Registering Machines..."

# Wait for ledger propagation
sleep 2

# We use the deployer as the owner for simplicity in demo
stellar contract invoke --id $CONTRACT_ID --source nextforge-deployer --network testnet -- register_machine \
    --machine_id "M-001" \
    --owner nextforge-deployer \
    --payout_wallet nextforge-deployer \
    --machine_wallet nextforge-deployer \
    --auto_repair true \
    --machine_type "FDM" \
    --price_per_cycle 50000 \
    --location "León, MX" \
    --materials "PLA, PETG, ABS"

stellar contract invoke --id $CONTRACT_ID --source nextforge-deployer --network testnet -- register_machine \
    --machine_id "M-002" \
    --owner nextforge-deployer \
    --payout_wallet nextforge-deployer \
    --machine_wallet nextforge-deployer \
    --auto_repair true \
    --machine_type "CNC" \
    --price_per_cycle 30000 \
    --location "CDMX, MX" \
    --materials "Aluminum, Wood"

stellar contract invoke --id $CONTRACT_ID --source nextforge-deployer --network testnet -- register_machine \
    --machine_id "M-004" \
    --owner nextforge-deployer \
    --payout_wallet nextforge-deployer \
    --machine_wallet nextforge-deployer \
    --auto_repair false \
    --machine_type "INJECTION" \
    --price_per_cycle 120000 \
    --location "GDL, MX" \
    --materials "PP, ABS, Nylon"

echo "3️⃣ Machine Agents: Syncing with Protocol Relay..."
curl -X POST http://localhost:3001/api/webhook/machine_registered -H "Content-Type: application/json" -d '{"machine_id": "M-001", "machine_type": "FDM", "price": 50000, "location": "León, MX", "materials": "PLA, PETG, ABS"}'
curl -X POST http://localhost:3001/api/webhook/machine_registered -H "Content-Type: application/json" -d '{"machine_id": "M-002", "machine_type": "CNC", "price": 30000, "location": "CDMX, MX", "materials": "Aluminum, Wood"}'
curl -X POST http://localhost:3001/api/webhook/machine_registered -H "Content-Type: application/json" -d '{"machine_id": "M-004", "machine_type": "INJECTION", "price": 120000, "location": "GDL, MX", "materials": "PP, ABS, Nylon"}'

echo "4️⃣ Native Protocol: Verifying machines on-chain..."
stellar contract invoke --id $CONTRACT_ID --source nextforge-deployer --network testnet -- verify_machine --machine_id "M-001"
stellar contract invoke --id $CONTRACT_ID --source nextforge-deployer --network testnet -- verify_machine --machine_id "M-002"
stellar contract invoke --id $CONTRACT_ID --source nextforge-deployer --network testnet -- verify_machine --machine_id "M-004"

echo "4️⃣ Fetching registered machines list:"
stellar contract invoke --id $CONTRACT_ID --source nextforge-deployer --network testnet -- list_machines

echo "✅ Seed Complete!"
