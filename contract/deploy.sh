#!/bin/bash
# Deploy No Man's Land contract to Sui Testnet
# Run this from the /contract folder
# Requirements: sui CLI installed, testnet wallet with SUI

echo "🏜️  Deploying No Man's Land to Sui Testnet..."

# Check sui CLI exists
if ! command -v sui &> /dev/null; then
  echo "❌ sui CLI not found. Install from: https://docs.sui.io/guides/developer/getting-started/sui-install"
  exit 1
fi

# Switch to testnet
sui client switch --env testnet
echo "✓ Switched to testnet"

# Check balance
echo "✓ Wallet balance:"
sui client balance

# Build first
echo "⟳ Building contract..."
sui move build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✓ Build successful"

# Deploy
echo "⟳ Publishing contract..."
sui client publish --gas-budget 100000000

echo ""
echo "✅ Done! Copy the Package ID from above and add it to your .env:"
echo "VITE_PACKAGE_ID=0x..."
echo "VITE_REGISTRY_ID=0x..."
