#!/bin/bash
set -e

echo "🚀 Setting up NextForge Stellar/Soroban Environment..."

# 1. Ensure target is installed
echo "📦 Adding wasm32v1-none target..."
rustup target add wasm32v1-none

# 2. Check if Stellar CLI is installed
if ! command -v stellar &> /dev/null
then
    echo "⬇️ Installing Stellar CLI..."
    curl -fsSL https://github.com/stellar/stellar-cli/raw/main/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

echo "🔑 Generating Deployer Keypair..."
stellar keys generate --global nextforge-deployer --network testnet || echo "Keypair already exists."

echo "💸 Funding Deployer via Friendbot..."
stellar keys fund nextforge-deployer --network testnet || echo "Already funded or friendbot error."

echo "🏗️ Building NextForge Smart Contract..."
cd contracts
cargo clean
stellar contract build

if [ ! -f target/wasm32v1-none/release/nextforge.wasm ]; then
    echo "❌ Build failed - wasm file not found."
    exit 1
fi

echo "🚀 Deploying to Testnet..."
CONTRACT_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/nextforge.wasm --source nextforge-deployer --network testnet)

echo "✅ Contract Deployed! Contract ID: $CONTRACT_ID"

# 3. Update the .env file in root
cd ..
if grep -q "SOROBAN_CONTRACT_ID=" .env; then
    sed -i "s/SOROBAN_CONTRACT_ID=.*/SOROBAN_CONTRACT_ID=$CONTRACT_ID/" .env
    sed -i "s/VITE_SOROBAN_CONTRACT_ID=.*/VITE_SOROBAN_CONTRACT_ID=$CONTRACT_ID/" .env
else
    echo "SOROBAN_CONTRACT_ID=$CONTRACT_ID" >> .env
    echo "VITE_SOROBAN_CONTRACT_ID=$CONTRACT_ID" >> .env
fi

# Switch env from Solana to Stellar
sed -i "s/VITE_RPC_URL=https:\/\/api.devnet.solana.com/VITE_RPC_URL=https:\/\/soroban-testnet.stellar.org/" .env
sed -i "s/SOLANA_NETWORK=devnet/STELLAR_NETWORK=testnet/" .env

echo "🎉 Setup Complete! NextForge is mapped to testnet contract."
