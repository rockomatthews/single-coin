#!/bin/bash

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "Error: .env.local file not found"
  echo "Please run ./run.sh first to create the template file"
  exit 1
fi

# Check if PINATA_JWT exists but NEXT_PUBLIC_PINATA_JWT doesn't
if grep -q "PINATA_JWT=" .env.local && ! grep -q "NEXT_PUBLIC_PINATA_JWT=" .env.local; then
  echo "Found PINATA_JWT but missing NEXT_PUBLIC_PINATA_JWT in .env.local"
  echo "Adding NEXT_PUBLIC_PINATA_JWT with the same value..."
  
  # Get the PINATA_JWT value
  PINATA_JWT_VALUE=$(grep "PINATA_JWT=" .env.local | cut -d'=' -f2)
  
  # Add NEXT_PUBLIC_PINATA_JWT after PINATA_JWT line
  sed -i '' "/PINATA_JWT=.*/a\\
NEXT_PUBLIC_PINATA_JWT=$PINATA_JWT_VALUE
" .env.local
  
  echo "Fixed! Both PINATA_JWT and NEXT_PUBLIC_PINATA_JWT are now set."
else
  echo "Environment variables look good!"
fi

echo "Done checking environment variables." 