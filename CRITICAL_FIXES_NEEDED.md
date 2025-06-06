# CRITICAL SECURITY ISSUES TO FIX

## 1. Token Minting Workflow (CRITICAL)
**Current BROKEN workflow:**
- ALL tokens minted to user wallet first
- User can cancel pool creation and keep everything
- Platform gets nothing, no pool created

**SECURE workflow needed:**
1. Mint ONLY retention amount to user (e.g., 8% of 1B = 80M tokens)
2. Keep mint authority with platform temporarily
3. During pool creation, mint liquidity amount directly to pool vault
4. THEN revoke mint authority
5. All in atomic transactions if possible

## 2. Pool ID Shows as N/A
In `raydium-v2.ts` line 394-398, the pool details mapping is wrong:
```typescript
• Pool ID: ${poolKeys['id'] || 'N/A'}  // Should be poolId
• Token Vault: ${poolKeys['vault'] || 'N/A'}  // Should be vaultA
```

## 3. Transaction Atomicity
Need to ensure:
- Fee payment
- Token minting to user (retention)
- Pool creation
- Token minting to pool
- Authority revocation

All happen atomically or with proper rollback

## 4. Image Not Showing
Check if IPFS gateway URL is being saved correctly to database

## Implementation Plan:
1. Create new secure token creation flow
2. Modify pool creation to mint directly to pool
3. Fix pool details logging
4. Add transaction bundling for atomicity 