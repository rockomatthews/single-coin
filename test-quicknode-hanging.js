// Test script to diagnose QuickNode API hanging issue
// This will help identify exactly why the API call hangs

const { fetch } = require('cross-fetch');
require('dotenv').config({ path: '.env.local' });

async function testQuickNodeHanging() {
  console.log('🔍 Diagnosing QuickNode API hanging issue...');
  
  const QUICKNODE_FUNCTION_URL = 'https://api.quicknode.com/functions/rest/v1/functions/6e7e0949-40ec-4fe2-be32-46419dfe246c/call';
  const API_KEY = process.env.NEXT_PUBLIC_QUICKNODE_API_KEY;
  
  console.log('🔑 API Key status:', API_KEY ? `${API_KEY.slice(0, 8)}...` : 'NOT SET');
  console.log('🎯 Function URL:', QUICKNODE_FUNCTION_URL);
  
  if (!API_KEY || API_KEY === 'your-quicknode-api-key-here') {
    console.log('❌ QuickNode API key not properly configured');
    console.log('💡 Please set NEXT_PUBLIC_QUICKNODE_API_KEY in .env.local');
    return;
  }
  
  const testPayload = {
    user_data: {
      tokenName: 'HangingTest',
      tokenSymbol: 'HANG',
      totalSupply: '1000000',
      userAddress: '0xe649dd43Eb47d14FD1069C641a5Dfd57456F19eC',
      revokeUpdateAuthority: true,
      revokeMintAuthority: true
    }
  };
  
  console.log('📤 Test payload:', JSON.stringify(testPayload, null, 2));
  
  // Test with very short timeout to see if it hangs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('⏰ 5-second timeout reached - request is hanging!');
    controller.abort();
  }, 5000);
  
  try {
    console.log('🌐 Making QuickNode API request (5s timeout)...');
    const startTime = Date.now();
    
    const response = await fetch(QUICKNODE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const endTime = Date.now();
    
    console.log(`⚡ Request completed in ${endTime - startTime}ms`);
    console.log('📡 Response status:', response.status);
    console.log('📋 Response headers:', [...response.headers.entries()]);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Success response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.log('💥 CONFIRMED: QuickNode API call is hanging!');
      console.log('🔍 Possible causes:');
      console.log('   1. Invalid API key');
      console.log('   2. QuickNode function not deployed/active');
      console.log('   3. Network/CORS issues');
      console.log('   4. Function internal error');
    } else {
      console.log('💥 Request failed with error:', error.message);
    }
  }
}

testQuickNodeHanging();