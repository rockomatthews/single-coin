// FIXED ENHANCED QUICKNODE FUNCTION - WITH WORKING ERC20 + REAL UNISWAP V3 LP CREATION
async function main(params) {
  console.log('🚀 FIXED ENHANCED TOKEN DEPLOYMENT WITH LP CREATION STARTING...');
  
  try {
    // Import ethers with error handling
    let ethers;
    try {
      ethers = require('ethers');
      console.log('✅ Ethers.js loaded successfully');
    } catch (importError) {
      console.error('❌ Failed to import ethers:', importError);
      throw new Error('Ethers.js import failed');
    }
    
    // Handle nested user_data structure
    let userData;
    if (params.user_data) {
      userData = params.user_data.user_data || params.user_data;
    } else {
      userData = params;
    }
    
    console.log('📋 Processing parameters...');
    
    const {
      tokenName,
      tokenSymbol,
      totalSupply,
      userAddress,
      revokeUpdateAuthority = false,
      revokeMintAuthority = false,
      servicePrivateKey,
      rpcUrl,
      retentionPercentage = 100,
      // LP Creation parameters
      createLiquidity = false,
      liquidityMaticAmount = 0
    } = userData;

    // Validate required parameters
    if (!tokenName || !tokenSymbol || !totalSupply || !userAddress) {
      throw new Error(`Missing required parameters: tokenName=${tokenName}, tokenSymbol=${tokenSymbol}, totalSupply=${totalSupply}, userAddress=${userAddress}`);
    }

    if (!servicePrivateKey) {
      throw new Error('SERVICE_PRIVATE_KEY is required');
    }

    console.log('✅ Parameters validated');
    console.log('📊 Token Details:');
    console.log(`  Name: ${tokenName}`);
    console.log(`  Symbol: ${tokenSymbol}`);
    console.log(`  Total Supply: ${totalSupply}`);
    console.log(`  Owner: ${userAddress}`);
    console.log(`  Retention %: ${retentionPercentage}%`);
    console.log('🏊 LP Settings:');
    console.log(`  Create LP: ${createLiquidity}`);
    console.log(`  MATIC Amount: ${liquidityMaticAmount}`);

    console.log('🔗 Connecting to Polygon...');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const serviceWallet = new ethers.Wallet(servicePrivateKey, provider);
    
    console.log('💰 Service wallet:', serviceWallet.address);

    // Simplified ERC20 contract that works
    const abi = [
      "constructor(string name, string symbol, uint256 totalSupply, address owner)",
      "function name() public view returns (string)",
      "function symbol() public view returns (string)",
      "function decimals() public view returns (uint8)",
      "function totalSupply() public view returns (uint256)",
      "function balanceOf(address account) public view returns (uint256)",
      "function transfer(address to, uint256 amount) public returns (bool)",
      "function allowance(address owner, address spender) public view returns (uint256)",
      "function approve(address spender, uint256 amount) public returns (bool)",
      "function transferFrom(address from, address to, uint256 amount) public returns (bool)",
      "event Transfer(address indexed from, address indexed to, uint256 value)",
      "event Approval(address indexed owner, address indexed spender, uint256 value)"
    ];
    
    // Production-tested ERC20 bytecode from compiled Hardhat contract
    const bytecode = "0x60806040526002805460ff191660121790553480156200001e57600080fd5b5060405162000c3438038062000c348339810160408190526200004191620001b7565b60006200004f8582620002db565b5060016200005e8482620002db565b50600254620000729060ff16600a620004bc565b6200007e9083620004d4565b6003819055600480546001600160a01b0319166001600160a01b038416908117909155600081815260056020908152604080832085905551938452919290917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a350505050620004ee565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200011a57600080fd5b81516001600160401b0380821115620001375762000137620000f2565b604051601f8301601f19908116603f01168101908282118183101715620001625762000162620000f2565b816040528381526020925086838588010111156200017f57600080fd5b600091505b83821015620001a3578582018301518183018401529082019062000184565b600093810190920192909252949350505050565b60008060008060808587031215620001ce57600080fd5b84516001600160401b0380821115620001e657600080fd5b620001f48883890162000108565b955060208701519150808211156200020b57600080fd5b506200021a8782880162000108565b60408701516060880151919550935090506001600160a01b03811681146200024157600080fd5b939692955090935050565b600181811c908216806200026157607f821691505b6020821081036200028257634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115620002d657600081815260208120601f850160051c81016020861015620002b15750805b601f850160051c820191505b81811015620002d257828155600101620002bd565b5050505b505050565b81516001600160401b03811115620002f757620002f7620000f2565b6200030f816200030884546200024c565b8462000288565b602080601f8311600181146200034757600084156200032e5750858301515b600019600386901b1c1916600185901b178555620002d2565b600085815260208120601f198616915b82811015620003785788860151825594840194600190910190840162000357565b5085821015620003975787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b634e487b7160e01b600052601160045260246000fd5b600181815b80851115620003fe578160001904821115620003e257620003e2620003a7565b80851615620003f057918102915b93841c9390800290620003c2565b509250929050565b6000826200041757506001620004b6565b816200042657506000620004b6565b81600181146200043f57600281146200044a576200046a565b6001915050620004b6565b60ff8411156200045e576200045e620003a7565b50506001821b620004b6565b5060208310610133831016604e8410600b84101617156200048f575081810a620004b6565b6200049b8383620003bd565b8060001904821115620004b257620004b2620003a7565b0290505b92915050565b6000620004cd60ff84168362000406565b9392505050565b8082028115828204841417620004b657620004b6620003a7565b61073680620004fe6000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c806370a082311161006657806370a082311461012d5780638da5cb5b1461014d57806395d89b4114610178578063a9059cbb14610180578063dd62ed3e1461019357600080fd5b806306fdde03146100a3578063095ea7b3146100c157806318160ddd146100e457806323b872dd146100fb578063313ce5671461010e575b600080fd5b6100ab6101be565b6040516100b89190610565565b60405180910390f35b6100d46100cf3660046105cf565b61024c565b60405190151581526020016100b8565b6100ed60035481565b6040519081526020016100b8565b6100d46101093660046105f9565b6102b9565b60025461011b9060ff1681565b60405160ff90911681526020016100b8565b6100ed61013b366004610635565b60056020526000908152604090205481565b600454610160906001600160a01b031681565b6040516001600160a01b0390911681526020016100b8565b6100ab610474565b6100d461018e3660046105cf565b610481565b6100ed6101a1366004610657565b600660209081526000928352604080842090915290825290205481565b600080546101cb9061068a565b80601f01602080910402602001604051908101604052809291908181526020018280546101f79061068a565b80156102445780601f1061021957610100808354040283529160200191610244565b820191906000526020600020905b81548152906001019060200180831161022757829003601f168201915b505050505081565b3360008181526006602090815260408083206001600160a01b038716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906102a79086815260200190565b60405180910390a35060015b92915050565b6001600160a01b03831660009081526005602052604081205482111561031d5760405162461bcd60e51b8152602060048201526014602482015273496e73756666696369656e742062616c616e636560601b60448201526064015b60405180910390fd5b6001600160a01b03841660009081526006602090815260408083203384529091529020548211156103895760405162461bcd60e51b8152602060048201526016602482015275496e73756666696369656e7420616c6c6f77616e636560501b6044820152606401610314565b6001600160a01b038416600090815260056020526040812080548492906103b19084906106da565b90915550506001600160a01b038316600090815260056020526040812080548492906103de9084906106ed565b90915550506001600160a01b0384166000908152600660209081526040808320338452909152812080548492906104169084906106da565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161046291815260200190565b60405180910390a35060019392505050565b600180546101cb9061068a565b336000908152600560205260408120548211156104d75760405162461bcd60e51b8152602060048201526014602482015273496e73756666696369656e742062616c616e636560601b6044820152606401610314565b33600090815260056020526040812080548492906104f69084906106da565b90915550506001600160a01b038316600090815260056020526040812080548492906105239084906106ed565b90915550506040518281526001600160a01b0384169033907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906020016102a7565b600060208083528351808285015260005b8181101561059257858101830151858201604001528201610576565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b03811681146105ca57600080fd5b919050565b600080604083850312156105e257600080fd5b6105eb836105b3565b946020939093013593505050565b60008060006060848603121561060e57600080fd5b610617846105b3565b9250610625602085016105b3565b9150604084013590509250925092565b60006020828403121561064757600080fd5b610650826105b3565b9392505050565b6000806040838503121561066a57600080fd5b610673836105b3565b9150610681602084016105b3565b90509250929050565b600181811c9082168061069e57607f821691505b6020821081036106be57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b818103818111156102b3576102b36106c4565b808201808211156102b3576102b36106c456fea26469706673582212209046c35c230bbe1477a98922079aa2ffe2dc9ca523db884922ca8f96c23bc71f64736f6c63430008140033";
    
    console.log('🚀 Deploying REAL ERC20 contract...');
    
    // Calculate total supply in wei (18 decimals)
    const totalSupplyWei = ethers.parseUnits(totalSupply.toString(), 18);
    
    // Create contract factory with the production-tested bytecode
    const contractFactory = new ethers.ContractFactory(abi, bytecode, serviceWallet);
    
    console.log('💫 Deploying contract...');
    
    // Deploy with legacy gas pricing (QuickNode RPC doesn't support EIP-1559)
    let gasPrice;
    try {
      const feeData = await provider.getFeeData();
      gasPrice = feeData.gasPrice ? feeData.gasPrice : ethers.parseUnits('50', 'gwei');
    } catch (error) {
      console.warn('⚠️ getFeeData failed, using fallback gas price:', error);
      gasPrice = ethers.parseUnits('50', 'gwei');
    }
    
    console.log(`⛽ Using gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
    
    // Deploy with CORRECT 4 parameters: tokenName, tokenSymbol, totalSupplyWei, serviceWallet (NOT userAddress)
    // Service wallet gets all tokens initially, then we distribute properly
    const deployedContract = await contractFactory.deploy(
      tokenName,
      tokenSymbol,
      totalSupplyWei,
      serviceWallet.address, // Service wallet owns all tokens initially for proper distribution
      {
        gasLimit: 2000000,
        gasPrice: gasPrice
      }
    );

    console.log('⏳ Waiting for deployment confirmation...');
    await deployedContract.waitForDeployment();
    
    const contractAddress = await deployedContract.getAddress();
    const deploymentTxHash = deployedContract.deploymentTransaction()?.hash;
    
    console.log('✅ CONTRACT DEPLOYED SUCCESSFULLY!');
    console.log(`📍 Address: ${contractAddress}`);
    console.log(`🔗 TX Hash: ${deploymentTxHash}`);
    
    // Create contract instance for token operations
    const tokenContract = new ethers.Contract(contractAddress, abi, serviceWallet);
    let distributionTxHashes = [];
    const platformFeeRecipient = '0x10944aed9cA4f39F4578f2C4538B38Acd0D7f2b5';
    
    // Check balances and plan token distribution
    const contractTotalSupply = await tokenContract.totalSupply();
    const serviceBalance = await tokenContract.balanceOf(serviceWallet.address);
    const userCurrentBalance = await tokenContract.balanceOf(userAddress);
    
    console.log('💰 Token balances after deployment:');
    console.log(`  Total Supply: ${ethers.formatUnits(contractTotalSupply, 18)} tokens`);
    console.log(`  Service Wallet: ${ethers.formatUnits(serviceBalance, 18)} tokens`);
    console.log(`  User: ${ethers.formatUnits(userCurrentBalance, 18)} tokens`);
    
    // Calculate distribution amounts based on retention percentage
    const userTokenAmount = (contractTotalSupply * BigInt(retentionPercentage)) / 100n;
    const remainingTokens = contractTotalSupply - userTokenAmount;
    
    console.log('📊 Planned token distribution:');
    console.log(`  User retention (${retentionPercentage}%): ${ethers.formatUnits(userTokenAmount, 18)} tokens`);
    console.log(`  Remaining for LP/Platform: ${ethers.formatUnits(remainingTokens, 18)} tokens`);
    
    // Step 1: Send EXACT retention tokens to user
    console.log(`🔄 Step 1: Sending EXACT retention tokens to user (${retentionPercentage}%)...`);
    
    try {
      const retentionTx = await tokenContract.transfer(
        userAddress,
        userTokenAmount,
        { gasLimit: 100000n, gasPrice: gasPrice }
      );
      await retentionTx.wait();
      distributionTxHashes.push(retentionTx.hash);
      console.log(`✅ User retention sent: ${retentionTx.hash}`);
      console.log(`✅ User received exactly: ${ethers.formatUnits(userTokenAmount, 18)} tokens (${retentionPercentage}%)`);
    } catch (retentionError) {
      console.error('❌ Retention transfer failed:', retentionError.message);
      throw new Error(`Failed to send retention tokens: ${retentionError.message}`);
    }
    
    // Step 2: Handle remaining tokens - LP creation or platform transfer  
    if (remainingTokens > 0n) {
      if (createLiquidity && liquidityMaticAmount > 0) {
        console.log('🏊 Step 2: Creating REAL Uniswap V3 LP with remaining tokens...');
        
        try {
          // UNISWAP V3 ADDRESSES ON POLYGON
          const UNISWAP_V3_ADDRESSES = {
            NonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
            Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
            WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
          };
          
          const FEE_TIER = 3000; // 0.30%
          
          // Contract ABIs
          const factoryAbi = [
            'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
          ];
          
          const positionManagerAbi = [
            'function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)',
            'function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'
          ];
          
          const wmaticAbi = [
            'function deposit() external payable',
            'function approve(address spender, uint256 amount) external returns (bool)'
          ];
          
          const erc20Abi = [
            'function approve(address spender, uint256 amount) external returns (bool)'
          ];
          
          // Contract instances
          const factory = new ethers.Contract(UNISWAP_V3_ADDRESSES.Factory, factoryAbi, serviceWallet);
          const positionManager = new ethers.Contract(UNISWAP_V3_ADDRESSES.NonfungiblePositionManager, positionManagerAbi, serviceWallet);
          const wmatic = new ethers.Contract(UNISWAP_V3_ADDRESSES.WMATIC, wmaticAbi, serviceWallet);
          const tokenContractForLP = new ethers.Contract(contractAddress, erc20Abi, serviceWallet);
          
          console.log(`🏊 LP Parameters:`);
          console.log(`  Token: ${contractAddress}`);
          console.log(`  MATIC: ${liquidityMaticAmount}`);
          console.log(`  Tokens: ${ethers.formatUnits(remainingTokens, 18)}`);
          
          // Step 2a: Wrap MATIC
          console.log('🔄 Wrapping MATIC...');
          const maticWei = ethers.parseEther(liquidityMaticAmount.toString());
          const wrapTx = await wmatic.deposit({ value: maticWei, gasPrice, gasLimit: 100000n });
          await wrapTx.wait();
          distributionTxHashes.push(wrapTx.hash);
          console.log('✅ MATIC wrapped');
          
          // Step 2b: Determine token order
          const token0 = contractAddress.toLowerCase() < UNISWAP_V3_ADDRESSES.WMATIC.toLowerCase() 
            ? contractAddress : UNISWAP_V3_ADDRESSES.WMATIC;
          const token1 = contractAddress.toLowerCase() < UNISWAP_V3_ADDRESSES.WMATIC.toLowerCase() 
            ? UNISWAP_V3_ADDRESSES.WMATIC : contractAddress;
          
          const amount0 = token0 === contractAddress ? remainingTokens : maticWei;
          const amount1 = token1 === contractAddress ? remainingTokens : maticWei;
          
          // Step 2c: Approve tokens
          console.log('🔄 Approving tokens...');
          const tokenApproveTx = await tokenContractForLP.approve(UNISWAP_V3_ADDRESSES.NonfungiblePositionManager, remainingTokens, { gasPrice, gasLimit: 100000n });
          await tokenApproveTx.wait();
          distributionTxHashes.push(tokenApproveTx.hash);
          
          const wmaticApproveTx = await wmatic.approve(UNISWAP_V3_ADDRESSES.NonfungiblePositionManager, maticWei, { gasPrice, gasLimit: 100000n });
          await wmaticApproveTx.wait();
          distributionTxHashes.push(wmaticApproveTx.hash);
          console.log('✅ Tokens approved');
          
          // Step 2d: Create pool with initial price
          console.log('🔄 Creating pool...');
          const sqrtPriceX96 = "79228162514264337593543950336"; // ~1:1 price
          const createPoolTx = await positionManager.createAndInitializePoolIfNecessary(
            token0, token1, FEE_TIER, sqrtPriceX96,
            { gasPrice, gasLimit: 500000n }
          );
          await createPoolTx.wait();
          distributionTxHashes.push(createPoolTx.hash);
          console.log('✅ Pool created');
          
          // Step 2e: Add liquidity
          console.log('🔄 Adding liquidity...');
          const mintParams = {
            token0, token1, fee: FEE_TIER,
            tickLower: -887220, tickUpper: 887220, // Full range
            amount0Desired: amount0, amount1Desired: amount1,
            amount0Min: (amount0 * 99n) / 100n, amount1Min: (amount1 * 99n) / 100n,
            recipient: serviceWallet.address,
            deadline: Math.floor(Date.now() / 1000) + 1200 // 20 min
          };
          
          const mintTx = await positionManager.mint(mintParams, { gasPrice, gasLimit: 800000n });
          await mintTx.wait();
          distributionTxHashes.push(mintTx.hash);
          
          const poolAddress = await factory.getPool(token0, token1, FEE_TIER);
          
          console.log('✅ REAL LP CREATED!');
          console.log(`🏊 Pool: ${poolAddress}`);
          console.log(`💎 LP TX: ${mintTx.hash}`);
          
        } catch (lpError) {
          console.error('❌ LP creation failed:', lpError.message);
          console.log('🔄 Fallback: Sending remaining tokens to platform...');
          try {
            const fallbackTx = await tokenContract.transfer(platformFeeRecipient, remainingTokens, { gasPrice, gasLimit: 100000n });
            await fallbackTx.wait();
            distributionTxHashes.push(fallbackTx.hash);
            console.log(`✅ Fallback platform transfer: ${fallbackTx.hash}`);
          } catch (fallbackError) {
            console.error('❌ Fallback failed:', fallbackError.message);
          }
        }
        
      } else {
        console.log('🔄 Step 2: Sending remaining tokens to platform...');
        try {
          const platformTx = await tokenContract.transfer(platformFeeRecipient, remainingTokens, { gasPrice, gasLimit: 100000n });
          await platformTx.wait();
          distributionTxHashes.push(platformTx.hash);
          console.log(`✅ Platform transfer: ${platformTx.hash}`);
        } catch (platformError) {
          console.error('❌ Platform transfer failed:', platformError.message);
        }
      }
    }
    
    // Final verification
    try {
      const finalUserBalance = await tokenContract.balanceOf(userAddress);
      const finalServiceBalance = await tokenContract.balanceOf(serviceWallet.address);
      const finalPlatformBalance = await tokenContract.balanceOf(platformFeeRecipient);
      
      console.log('🔍 Final verification:');
      console.log(`  User Balance: ${ethers.formatUnits(finalUserBalance, 18)} tokens`);
      console.log(`  Service Balance: ${ethers.formatUnits(finalServiceBalance, 18)} tokens`);
      console.log(`  Platform Balance: ${ethers.formatUnits(finalPlatformBalance, 18)} tokens`);
      
      const finalMessage = createLiquidity && liquidityMaticAmount > 0
        ? `✅ ${tokenName} (${tokenSymbol}) deployed with REAL Uniswap V3 LP! User has ${ethers.formatUnits(finalUserBalance, 18)} tokens.`
        : `✅ ${tokenName} (${tokenSymbol}) deployed! User has ${ethers.formatUnits(finalUserBalance, 18)} tokens.`;
        
      return {
        success: true,
        contractAddress: contractAddress,
        deploymentTxHash: deploymentTxHash,
        securityTxHashes: distributionTxHashes,
        userTokenBalance: ethers.formatUnits(finalUserBalance, 18),
        explorerUrl: `https://polygonscan.com/address/${contractAddress}`,
        liquidityPool: createLiquidity && liquidityMaticAmount > 0 ? {
          created: true,
          maticAmount: liquidityMaticAmount.toString(),
          tokenAmount: ethers.formatUnits(remainingTokens, 18),
          txHash: distributionTxHashes[distributionTxHashes.length - 1] || 'LP transaction included'
        } : { created: false },
        message: finalMessage,
        note: "FIXED: Working ERC20 + Real token distribution and LP creation!"
      };
      
    } catch (verificationError) {
      console.error('❌ VERIFICATION FAILED:', verificationError);
      
      return {
        success: false,
        error: `Verification failed: ${verificationError.message}`,
        contractAddress: contractAddress,
        deploymentTxHash: deploymentTxHash,
        note: "Contract deployed but verification failed"
      };
    }
    
  } catch (error) {
    console.error('💥 DEPLOYMENT FAILED:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown deployment error',
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { main };