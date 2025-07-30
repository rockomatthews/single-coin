# QuickNode Functions Setup for Token Deployment

## Overview
This directory contains QuickNode Functions that handle smart contract deployment on QuickNode's serverless infrastructure, eliminating RPC rate limiting issues.

## Files
- `polygon-token-deployment.js` - OpenZeppelin ERC-20 deployment function for Polygon

## Setup Instructions

### 1. Create QuickNode Account & Function
1. Go to [QuickNode Developer Portal](https://www.quicknode.com/functions)
2. Create a new Function with these settings:
   - **Name**: `polygon-token-deployment`
   - **Runtime**: Node.js v20
   - **Timeout**: 60 seconds
   - **Memory**: 1024 MB

### 2. Deploy the Function
1. Copy the contents of `polygon-token-deployment.js`
2. Paste into QuickNode Functions editor
3. Add environment variables in QuickNode dashboard:
   ```
   QUICKNODE_POLYGON_RPC_URL=https://your-quicknode-polygon-endpoint.com/
   SERVICE_PRIVATE_KEY=your-service-wallet-private-key
   ```

### 3. Get Function API Key
1. In QuickNode dashboard, go to **API Keys**
2. Create a new API key for Functions
3. Copy the key and add to your `.env.local`:
   ```
   NEXT_PUBLIC_QUICKNODE_API_KEY=your-api-key-here
   ```

### 4. Update Environment Variables
Update your `.env.local` with QuickNode configuration:
```env
# QuickNode Functions configuration
NEXT_PUBLIC_QUICKNODE_FUNCTIONS_URL=https://api.quicknode.com/functions/rest/v1
NEXT_PUBLIC_QUICKNODE_API_KEY=your-quicknode-api-key
QUICKNODE_POLYGON_RPC_URL=https://your-polygon-endpoint.quiknode.pro/
SERVICE_PRIVATE_KEY=0x1234...your-service-wallet-private-key
```

### 5. Service Wallet Setup
1. Create a new wallet for deployment services
2. Fund it with ~1 MATIC for gas fees
3. Add private key to `SERVICE_PRIVATE_KEY` environment variable
4. This wallet will deploy contracts but tokens will be minted to users

## Function Architecture

### Input Parameters
```javascript
{
  tokenName: "My Token",
  tokenSymbol: "MTK", 
  totalSupply: 1000000000,
  userAddress: "0x...", // User's MetaMask address
  revokeUpdateAuthority: true,
  revokeMintAuthority: true,
  serviceFeeAmount: "5.0"
}
```

### Output Response
```javascript
{
  success: true,
  contractAddress: "0x...",
  deploymentTxHash: "0x...",
  securityTxHashes: ["0x..."],
  userTokenBalance: "1000000000.0",
  explorerUrl: "https://polygonscan.com/address/0x...",
  message: "✅ Token deployed successfully"
}
```

## Benefits

### 🚀 **No Rate Limits**
- Functions run on QuickNode's dedicated infrastructure
- Unlimited RPC calls during execution
- No more 429 rate limit errors

### ⚡ **Performance**
- Sub-second cold starts
- Global edge deployment
- Automatic scaling

### 💰 **Cost Efficient**
- Pay only for execution time (GB-seconds)
- No server maintenance costs
- Transparent pricing

### 🔒 **Security**
- Private keys never leave QuickNode infrastructure
- Secure environment variables
- IP allowlisting support

## Testing

Test your function with curl:
```bash
curl -X POST https://api.quicknode.com/functions/rest/v1/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "user_data": {
      "tokenName": "Test Token",
      "tokenSymbol": "TEST",
      "totalSupply": 1000000000,
      "userAddress": "0x742d35cc6634c0532925a3b8d900b3deb4ce6234",
      "revokeUpdateAuthority": false,
      "revokeMintAuthority": false
    }
  }'
```

## Monitoring

Monitor function execution in QuickNode dashboard:
- Execution logs
- Performance metrics  
- Error tracking
- Cost analytics

## Next Steps

1. Deploy function to QuickNode
2. Update environment variables
3. Test with your application
4. Consider adding to QuickNode Marketplace for 70% revenue share