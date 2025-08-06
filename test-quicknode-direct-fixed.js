// Direct test of QuickNode Function to isolate the 500 error
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testQuickNodeFunction() {
  console.log('🧪 Testing QuickNode Function directly...');
  
  // Environment variables
  const QUICKNODE_API_KEY = process.env.NEXT_PUBLIC_QUICKNODE_API_KEY;
  const SERVICE_PRIVATE_KEY = process.env.SERVICE_PRIVATE_KEY;
  const QUICKNODE_POLYGON_RPC_URL = process.env.QUICKNODE_POLYGON_RPC_URL;
  
  console.log('🔍 Environment check:', {
    hasApiKey: !!QUICKNODE_API_KEY,
    hasPrivateKey: !!SERVICE_PRIVATE_KEY,
    hasRpcUrl: !!QUICKNODE_POLYGON_RPC_URL,
    apiKeyPrefix: QUICKNODE_API_KEY ? QUICKNODE_API_KEY.substring(0, 10) + '...' : 'MISSING',
    rpcUrlPrefix: QUICKNODE_POLYGON_RPC_URL ? QUICKNODE_POLYGON_RPC_URL.substring(0, 50) + '...' : 'MISSING'
  });
  
  if (!QUICKNODE_API_KEY || !SERVICE_PRIVATE_KEY || !QUICKNODE_POLYGON_RPC_URL) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  // QuickNode Function configuration
  const QUICKNODE_FUNCTION_ID = '6e7e0949-40ec-4fe2-be32-46419dfe246c';
  const QUICKNODE_FUNCTION_URL = `https://api.quicknode.com/functions/rest/v1/functions/${QUICKNODE_FUNCTION_ID}/call`;
  
  // Test payload
  const testPayload = {
    tokenName: 'TestToken',
    tokenSymbol: 'TEST',
    totalSupply: 1000000000,
    userAddress: '0xe649dd43Eb47d14FD1069C641a5Dfd57456F19eC',
    revokeUpdateAuthority: false,
    revokeMintAuthority: false,
    servicePrivateKey: SERVICE_PRIVATE_KEY,
    rpcUrl: QUICKNODE_POLYGON_RPC_URL
  };
  
  try {
    console.log('📤 Calling QuickNode Function with payload:', {
      ...testPayload,
      servicePrivateKey: 'REDACTED',
      rpcUrl: testPayload.rpcUrl.substring(0, 50) + '...'
    });
    
    const response = await fetch(QUICKNODE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': QUICKNODE_API_KEY,
      },
      body: JSON.stringify({
        network: 'polygon-mainnet',
        user_data: testPayload
      })
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('📡 Raw response:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ QuickNode Function success:', result);
      } catch (parseError) {
        console.log('✅ QuickNode Function success (non-JSON):', responseText);
      }
    } else {
      console.error('❌ QuickNode Function failed:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error);
  }
}

// Run the test
testQuickNodeFunction().catch(console.error);