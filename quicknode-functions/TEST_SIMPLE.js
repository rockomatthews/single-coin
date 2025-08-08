async function main(params) {
  console.log('🚀 TEST FUNCTION STARTING...');
  
  try {
    const ethers = require('ethers');
    console.log('✅ Ethers.js loaded successfully');
    
    return {
      success: true,
      message: "Test function works!",
      params: params
    };
    
  } catch (error) {
    console.error('💥 TEST FAILED:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { main };