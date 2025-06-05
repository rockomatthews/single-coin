# High Priority Configuration for Network Congestion

## Current Situation
You're using QuickNode (good!) but still getting timeouts because:
- Priority fees are too low (1,000 microLamports = 0.001 SOL per transaction)
- Network requires much higher fees during congestion

## Quick Fix - Update These Files:

### 1. `/src/utils/solana.ts`
Change all instances of:
```typescript
ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
```
To:
```typescript
ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
```

This appears in 3 places:
- Line ~344 (mint creation)
- Line ~425 (token minting)
- Line ~501 (memo transaction)

### 2. `/src/utils/metaplex.ts`
Change:
```typescript
microLamports: 1000
```
To:
```typescript
microLamports: 50000
```

### 3. `/src/hooks/useTokenCreation.ts`
Change line ~269:
```typescript
ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
```
To:
```typescript
ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
```

## What This Does
- Increases priority fee from 0.001 SOL to 0.05 SOL per transaction
- Total additional cost: ~0.15 SOL for all transactions
- Much higher chance of getting included in blocks

## Alternative: Dynamic Priority Fees
For production, consider using Helius Priority Fee API:
```typescript
const response = await fetch('https://api.helius.xyz/v0/priority-fee-estimate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountKeys: [mintAddress],
    options: { recommended: true }
  })
});
const { priorityFee } = await response.json();
```

## Your Failed Attempts
- Mint `G61MLDVC7EnqAEyp2cFhjxvJrzAPasLDJcErxukXDd1T` - Created, needs tokens minted
- Mint `w4aNbgzhZEDU9Yxgu8L2tpraeaGwf67mfY8ae59Qysj` - Created, needs tokens minted

Both can potentially be recovered if you still have the mint authority! 