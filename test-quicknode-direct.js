// Test QuickNode function directly to verify it works
// This bypasses the UI integration to test just the API call

async function testQuickNodeDirect() {
  console.log('🧪 Testing QuickNode Function Direct API Call...');
  
  // Use the exact same endpoint and format that was proven to work
  const QUICKNODE_FUNCTION_URL = 'https://api.quicknode.com/functions/rest/v1/functions/6e7e0949-40ec-4fe2-be32-46419dfe246c/call';
  
  // You need to set a real API key here for testing
  const API_KEY = 'your-real-api-key-here'; // Replace with actual key
  
  if (API_KEY === 'your-real-api-key-here') {
    console.log('❌ Please set a real QuickNode API key in this test script');
    console.log('💡 Get your API key from: https://www.quicknode.com/endpoints');
    return;
  }
  
  const testPayload = {
    user_data: {
      tokenName: 'FixTest',
      tokenSymbol: 'FTEST',
      totalSupply: '1000000',
      userAddress: '0xe649dd43Eb47d14FD1069C641a5Dfd57456F19eC',
      revokeUpdateAuthority: true,
      revokeMintAuthority: true
    }
  };
  
  console.log('📤 Sending payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await fetch(QUICKNODE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Success response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('🎉 QuickNode function is working correctly!');
      console.log('📍 Contract Address:', result.contractAddress);
      console.log('🔗 Transaction Hash:', result.deploymentTxHash);
    } else {
      console.log('❌ QuickNode function returned failure:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

testQuickNodeDirect();