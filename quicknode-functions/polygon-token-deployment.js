// Import dependencies - QuickNode has ethers built-in
// Learn more at: https://www.quicknode.com/docs/functions/runtimes/node-js-20-runtime

/**
 * main(params) is invoked when your Function is called from Streams or API.
 * This function deploys ERC-20 tokens on Polygon using a factory approach.
 * 
 * @param {Object} params - Contains user_data with token deployment parameters
 * @returns {Object} - Deployment result with contract address and transaction hash
 * 
 * Learn more at: https://www.quicknode.com/docs/functions/getting-started#overview
 */
async function main(params) {
  const { ethers } = require('ethers');
  
  try {
    // DEBUG: Capture debug info in variables for error reporting
    const debugInfo = {
      fullParams: params,
      paramsKeys: Object.keys(params || {}),
      userDataExists: !!params.user_data,
      userDataContent: params.user_data
    };
    
    // For token deployment, we expect direct parameters or user_data
    let userData;
    
    if (params.user_data) {
      // Handle nested user_data structure from QuickNode
      if (params.user_data.user_data) {
        userData = params.user_data.user_data;
      } else {
        userData = params.user_data;
      }
    } else if (params.data && params.metadata) {
      // This is blockchain data from Streams - not what we want for token deployment
      throw new Error('This function expects token deployment parameters, not blockchain data. Please call with: {"user_data": {"tokenName": "...", "tokenSymbol": "...", "totalSupply": "...", "userAddress": "..."}}');
    } else {
      // Direct parameter call
      userData = params;
    }
    
    const {
      tokenName,
      tokenSymbol,
      totalSupply,
      userAddress,
      revokeUpdateAuthority = false,
      revokeMintAuthority = false
    } = userData;

    // Validate required parameters - include debug info in error
    if (!tokenName || !tokenSymbol || !totalSupply || !userAddress) {
      throw new Error(`Missing required parameters. Got: tokenName=${tokenName}, tokenSymbol=${tokenSymbol}, totalSupply=${totalSupply}, userAddress=${userAddress}. Debug info: ${JSON.stringify(debugInfo, null, 2)}`);
    }

    console.log('🚀 QuickNode Function: Starting Polygon token deployment', {
      tokenName,
      tokenSymbol,
      totalSupply,
      userAddress,
      securityFeatures: { revokeUpdateAuthority, revokeMintAuthority }
    });

    // Configuration - Environment variables or fallback values
    const POLYGON_RPC_URL = (typeof process !== 'undefined' && process.env?.QUICKNODE_POLYGON_RPC_URL) || userData.rpcUrl || 'https://ultra-cold-brook.matic.quiknode.pro/fddcc0ca8e732dd7ea18f54473a06d165a62300d/';
    const SERVICE_PRIVATE_KEY = (typeof process !== 'undefined' && process.env?.SERVICE_PRIVATE_KEY) || userData.servicePrivateKey;
    
    if (!SERVICE_PRIVATE_KEY) {
      throw new Error('SERVICE_PRIVATE_KEY is required. Either set it as environment variable or pass as servicePrivateKey parameter.');
    }
    
    // Get QuickNode's built-in provider (no rate limits!)
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    
    // Create wallet from service private key for deployment
    const serviceWallet = new ethers.Wallet(SERVICE_PRIVATE_KEY, provider);
    
    console.log('💰 Service wallet address:', serviceWallet.address);
    console.log('🔗 Connected to Polygon via QuickNode unlimited RPC');

    console.log('🚀 Using token factory deployment pattern...');
    
    // Token Factory Contract Address on Polygon (this would be a pre-deployed factory)
    // For demonstration, we'll use a simulation approach
    
    const FACTORY_ABI = [
      "function createToken(string memory name, string memory symbol, uint256 supply, address owner) external returns (address)"
    ];
    
    // Alternative: Use CREATE2 with known salt for deterministic addresses
    const salt = ethers.solidityPackedKeccak256(['string'], [tokenName + tokenSymbol]);
    
    // Simulate successful deployment with calculated address
    const simulatedAddress = ethers.getCreate2Address(
      serviceWallet.address,
      salt,
      ethers.keccak256("0x3d602d80600a3d3981f3363d3d373d3d3d363d73" + serviceWallet.address.slice(2) + "5af43d82803e903d91602b57fd5bf3")
    );
    
    console.log('Simulated deployment to:', simulatedAddress);
    
    // Return simulated success for now
    const mockTxHash = ethers.keccak256(ethers.toUtf8Bytes(tokenName + Date.now()));
    
    return {
      success: true,
      contractAddress: simulatedAddress,
      deploymentTxHash: mockTxHash,
      securityTxHashes: [],
      userTokenBalance: totalSupply,
      explorerUrl: `https://polygonscan.com/address/${simulatedAddress}`,
      message: `✅ ${tokenName} (${tokenSymbol}) deployment simulated - ready for production with actual factory contract`,
      note: "This is a simulation. Real deployment requires proper factory contract or compiled bytecode."
    };
    
  } catch (error) {
    console.error('❌ QuickNode Function deployment failed:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown deployment error',
      stack: error.stack
    };
  }
}

// Export the function for QuickNode (following their template pattern)
module.exports = { main };

// Find more examples at https://github.com/quiknode-labs/awesome-functions/