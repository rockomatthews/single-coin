#!/bin/bash

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "Creating .env.local file with template values..."
  cat > .env.local << EOF
# Solana RPC
NEXT_PUBLIC_SOLANA_RPC_URL=https://your-quicknode-endpoint.quiknode.pro/your-api-key/
NEXT_PUBLIC_SOLANA_NETWORK=mainnet # or devnet for testing

# Destination wallet for fees
NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS=your-solana-wallet-address-here

# Database configuration (Neon)
DATABASE_URL=postgresql://username:password@endpoint_hostname.neon.tech/dbname?sslmode=require

# Pinata IPFS storage (for token images and metadata)
PINATA_JWT=your-pinata-jwt-token-here
NEXT_PUBLIC_PINATA_JWT=your-pinata-jwt-token-here
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# NFT storage for metadata (optional)
NFT_STORAGE_API_KEY=your-nft-storage-api-key

# Coingecko API (optional, for token price information)
COINGECKO_API_KEY=your-coingecko-api-key

# Platform fee settings (in SOL)
NEXT_PUBLIC_BASE_FEE=0.05
NEXT_PUBLIC_FEE_MULTIPLIER=0.85
NEXT_PUBLIC_FEE_EXPONENT=3
EOF
  echo "Please edit .env.local with your actual keys before running the application."
  echo "At minimum, you need to set NEXT_PUBLIC_SOLANA_RPC_URL and NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS."
  exit 1
fi

# Clear previous build
rm -rf .next

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the application
echo "Starting Coinbull application..."
npm run dev 