// Test QuickNode integration with meme factory UI
// This tests the actual integration flow that users will experience

import { deployTokenViaQuickNodeFunction } from './src/utils/quicknode-polygon.js';

async function testIntegration() {
  console.log('🧪 Testing QuickNode + Meme Factory Integration...');
  
  // Test params that match what the UI will send
  const testUserAddress = '0xe649dd43Eb47d14FD1069C641a5Dfd57456F19eC';
  const testParams = {
    name: 'IntegrationTest',
    symbol: 'ITEST', 
    description: 'Testing the QuickNode integration',
    image: 'https://via.placeholder.com/200?text=Integration+Test',
    blockchain: 'polygon',
    decimals: 18,
    totalSupply: 1000000,
    retentionPercentage: 20,
    revokeUpdateAuthority: true,
    revokeMintAuthority: true,
    createLiquidity: false
  };
  
  const progressCallback = (step, message) => {
    console.log(`📍 Step ${step}: ${message}`);
  };

  try {
    console.log('🚀 Starting deployment via QuickNode integration...');
    
    const result = await deployTokenViaQuickNodeFunction(
      testUserAddress,
      testParams,
      progressCallback
    );
    
    if (result.success) {
      console.log('🎉 INTEGRATION SUCCESS!');
      console.log('✅ Contract Address:', result.contractAddress);
      console.log('🔗 Transaction Hash:', result.deploymentTxHash);
      console.log('🔍 Explorer URL:', result.explorerUrl);
      console.log('💬 Message:', result.message);
      
      console.log('\n🎯 Integration test passed - ready for production use!');
    } else {
      console.log('❌ INTEGRATION FAILED!');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('💥 INTEGRATION CRASHED!', error);
  }
}

// Run the integration test
testIntegration();