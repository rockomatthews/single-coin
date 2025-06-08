# 🚨 CRITICAL PRICING BUG DISCOVERED

## THE ISSUE YOU FOUND

You're absolutely correct! There's a HUGE pricing inconsistency where both liquidity amount AND retention percentage affect pricing, but they're implemented incorrectly in different parts of the codebase.

## BROKEN PRICING EXAMPLES

### Current Broken Logic:
- **Person A**: 0% retention + 10 SOL liquidity = 0.3 SOL platform fee
- **Person B**: 90% retention + 0.1 SOL liquidity = 0.003 SOL platform fee

**This is completely backwards!** Person B should pay WAY more for keeping 90% of tokens!

### Correct Logic Should Be:
- **Person A**: 0% retention + 10 SOL liquidity = 0.01 SOL platform fee
- **Person B**: 90% retention + 0.1 SOL liquidity = ~13 SOL platform fee

## ROOT CAUSE

The code has inconsistent pricing in different files:

**raydium.ts (BROKEN):**
```javascript
const platformFeeSol = platformFeeAmount || (solAmount * 0.03); // WRONG!
```

**raydium-v2.ts (FIXED):**
```javascript  
const platformFeeSol = platformFeeAmount || calculateFee(retentionPercentage || 0); // CORRECT!
```

## FINANCIAL IMPACT

High retention users are getting MASSIVE discounts while liquidity providers are being overcharged!

- Token hoarders (95% retention) should pay ~42 SOL, but only pay 0.003 SOL
- Liquidity providers (5% retention) should pay 0.01 SOL, but pay 0.3 SOL

This could represent thousands of dollars in lost revenue and unfair charging.

## STATUS

- ✅ raydium-v2.ts: FIXED (uses retention-based pricing)
- ❌ raydium.ts: BROKEN (uses liquidity-based pricing)
- ✅ Frontend: Correctly calculates and displays proper pricing

The main pool creation is using raydium-v2.ts (which is fixed), but the legacy raydium.ts still has the bug. 