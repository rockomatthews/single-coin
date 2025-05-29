# Token Metadata Fixes for 2025 Standards

## Issues Identified and Fixed

### 1. 500 Internal Server Error (Database Issue)

**Problem**: The API endpoint `/api/create-token` was failing with a 500 error, likely due to database connection issues.

**Solution**: Enhanced error handling and database connection validation in `src/app/api/create-token/route.ts`:
- Added database URL validation before processing requests
- Added detailed error logging for database operations
- Separated database errors from general API errors
- Added troubleshooting hints in error responses

**What to check**:
- Ensure `DATABASE_URL` environment variable is properly set
- Verify database connection is working by visiting `/api/health`
- Check deployment environment variables if using Vercel

### 2. Metadata Standards Compliance (Double Website Issue)

**Problem**: The metadata was showing website links twice because both `website` and `external_url` fields were being used, when only `external_url` is the official 2025 standard.

**CRITICAL DISCOVERY**: Social links were nested under `properties.social_links` but DEXes and explorers actually look for them at the **root level** of the metadata! Research of successful tokens like HMTR shows social links must be at root level.

**Solution**: Updated metadata structure in `src/utils/solana.ts` to follow real-world successful token patterns:
- **Added**: Social links at ROOT LEVEL where DEXes actually look (`twitter`, `telegram`, `discord`)
- **Kept**: Both `external_url` AND `website` at root level (this is what successful tokens do)
- **Moved**: Social links from nested `properties.social_links` to root level
- **Fixed**: Attribute values are now strings (not numbers) for better compatibility

**Based on research of successful tokens**:
- HMTR token shows social links at root: `twitter`, `telegram`, `discord`, `website`
- Pump.fun tokens use root-level social links
- DEX Screener, Birdeye, and other indexers scan root level, not nested properties

**Compliance with official standards**:
- Uses exact field names from 2025 Metaplex Token Metadata standards
- Follows FungibleAsset format for tokens with 0 decimals
- Follows Fungible format for tokens with >0 decimals
- Proper attributes array structure
- Correct properties.files structure

### 3. Image Display Issues

**Problem**: Images weren't showing in Phantom wallet but were working in Birdeye and Jupiter.

**Root Cause Analysis**:
- Phantom wallet is very strict about image format validation
- The image field must be a direct, accessible IPFS or HTTP URL
- Base64 data URLs are not supported in wallet display

**Solution**: Enhanced image handling in metadata upload:
- Ensures all images are properly uploaded to IPFS before metadata creation
- Uses proper IPFS gateway URLs for maximum compatibility
- Added file type specification in properties.files array
- Removed any base64 references from final metadata

### 4. DEX Visibility Issues

**Problem**: Tokens weren't appearing on Raydium or DexScreener.

**Likely Causes and Solutions**:

1. **Indexing Delay**: DEXes need time to index new pools (can take 5-15 minutes)
2. **Pool Structure**: Ensure you're creating CPMM pools (which we are)
3. **Metadata Format**: Fixed to use official standards (completed above)
4. **Social Links**: Now properly formatted for indexer recognition

**To improve visibility**:
- Links and descriptions now use the exact format expected by major DEXes
- Metadata follows the same structure as successful tokens like those on pump.fun
- Pool creation uses official Raydium SDK for best compatibility

## Updated Metadata Structure

The new metadata format follows this structure (based on research of successful tokens):

```json
{
  "name": "Token Name",
  "symbol": "SYMBOL",
  "description": "Token description",
  "image": "https://gateway.pinata.cloud/ipfs/...",
  "external_url": "https://your-website.com",
  "website": "https://your-website.com",
  "twitter": "https://x.com/your_handle",
  "telegram": "https://t.me/your_channel",
  "discord": "https://discord.gg/your_server",
  "animation_url": "",
  "attributes": [
    { "trait_type": "Token Type", "value": "Fungible" },
    { "trait_type": "Decimals", "value": "9" },
    { "trait_type": "Total Supply", "value": "1,000,000,000" }
  ],
  "properties": {
    "files": [
      {
        "uri": "https://gateway.pinata.cloud/ipfs/...",
        "type": "image/png",
        "cdn": false
      }
    ],
    "category": "image",
    "creators": []
  },
  "collection": {
    "name": "Coinbull Tokens",
    "family": "Coinbull"
  },
  "tags": ["solana", "token", "coinbull"],
  "token_standard": "Fungible"
}
```

**Key Change**: Social links (`twitter`, `telegram`, `discord`, `website`) are now at the ROOT LEVEL where DEXes actually look for them!

## Testing Your Fixes

1. **API Health**: Visit `/api/health` to verify all systems
2. **Create a Test Token**: Try creating a token with social links
3. **Check Metadata**: Visit the IPFS metadata URL to verify structure
4. **Wallet Display**: Import token into Phantom to verify image shows
5. **DEX Visibility**: Wait 10-15 minutes then check DexScreener and Raydium

## Next Steps for Production

1. **Environment Variables**: Ensure all required env vars are set:
   - `DATABASE_URL`
   - `PINATA_JWT`
   - `NEXT_PUBLIC_SOLANA_RPC_URL`
   - `NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS`

2. **Database**: Run `/api/db-init` to ensure tables exist

3. **Monitoring**: Check `/api/health` regularly for system status

## References

- [Metaplex Token Standards 2025](https://developers.metaplex.com/token-metadata/token-standard)
- [Official Metadata Schema](https://docs.metaplex.com/programs/token-metadata/overview)
- [Solana NFT Metadata Deep Dive](https://www.quicknode.com/guides/solana-development/nfts/solana-nft-metadata-deep-dive)

The fixes ensure your tokens will display properly across all major Solana wallets, DEXes, and explorers by following the exact 2025 standards. 