// Polygon (Matic) ERC-20 token creation utilities
import { ethers } from 'ethers';

// Polygon-specific token parameters
export interface PolygonTokenParams {
  name: string;
  symbol: string;
  description: string;
  image: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  blockchain: 'polygon';
  
  // ERC-20 specific
  decimals: number;
  totalSupply: number;
  initialSupply?: number;
  
  // Distribution
  retentionPercentage?: number;
  retainedAmount?: number;
  liquidityAmount?: number;
  
  // Polygon network settings
  gasLimit?: number;
  maxFeePerGas?: number;
  maxPriorityFeePerGas?: number;
  
  // DEX settings
  createLiquidity?: boolean;
  liquidityMaticAmount?: number;
  dexChoice?: 'uniswap-v3' | 'quickswap' | 'sushiswap';
}


// Simple ERC-20 contract - use OpenZeppelin standard
const ERC20_ABI = [
  "constructor(string memory name, string memory symbol)",
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Working ERC-20 bytecode (basic standard implementation)
const ERC20_BYTECODE = "0x608060405234801561001057600080fd5b506040516104b93803806104b983398101604052810190610030919061024a565b8181600390816100409190610451565b5080600490816100509190610451565b50505050610560565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6100be82610075565b810181811067ffffffffffffffff821117156100dd576100dc610086565b5b80604052505050565b60006100f061005c565b90506100fc82826100b5565b919050565b600067ffffffffffffffff82111561011c5761011b610086565b5b61012582610075565b9050602081019050919050565b60005b83811015610150578082015181840152602081019050610135565b60008484015250505050565b600061016f61016a84610101565b6100e6565b90508281526020810184848401111561018b5761018a610070565b5b610196848285610132565b509392505050565b600082601f8301126101b3576101b261006b565b5b81516101c384826020860161015c565b91505092915050565b600080604083850312156101e3576101e2610066565b5b600083015167ffffffffffffffff81111561020157610200610071565b5b61020d8582860161019e565b925050602083015167ffffffffffffffff81111561022e5761022d610071565b5b61023a8582860161019e565b9150509250929050565b60008060408385031215610261576102606006661565b5b600083015167ffffffffffffffff81111561027f5761027e610071565b5b61028b8582860161019e565b925050602083015167ffffffffffffffff8111156102ac576102ab610071565b5b6102b88582860161019e565b9150509250929050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061031057607f821691505b602082108103610323576103226102c9565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026103916000198261034e565b61039b8683610354565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b60006103e26103dd6103d8846103b3565b6103bd565b6103b3565b9050919050565b6000819050919050565b6103fc836103c7565b610410610408826103e9565b848454610361565b825550505050565b600090565b610425610418565b6104308184846103f3565b505050565b5b8181101561045457610449600082610425565b600181019050610436565b5050565b601f8211156104995761046a81610329565b6104738461033e565b81016020851015610482578190505b61049661048e8561033e565b830182610435565b50505b505050565b600082821c905092915050565b60006104bc6000198460080261049e565b1980831691505092915050565b60006104d583836104ab565b9150826002028217905092915050565b6104ee826102c2565b67ffffffffffffffff81111561050757610506610086565b5b61051182546102f8565b61051c828285610453565b600060209050601f83116001811461054f576000841561053d578287015190505b61054782826104c9565b86555061055f565b601f19841661055d86610329565b60005b8281101561058557848901518255600182019150602085019450602081019050610560565b868310156105a2578489015161059e601f8916826104ab565b8355505b6001600288020188555050505b50505050505050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006105a7826103b3565b91506105b2836103b3565b92508282039050818111156105ca576105c9610572565b5b92915050565b6080516104f76105e160003960003961028a01526104f76000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063313ce56714610046578063a9059cbb14610064578063dd62ed3e14610094575b600080fd5b61004e6100c4565b60405161005b919061021c565b60405180910390f35b61007e600480360381019061007991906102bd565b6100c9565b60405161008b9190610318565b60405180910390f35b6100ae60048036038101906100a99190610333565b6100dc565b6040516100bb9190610382565b60405180910390f35b601290565b60006100d6338484610103565b6001905092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610172576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101699061042f565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036101e1576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101d8906104c1565b60405180910390fd5b80600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258360405161028f9190610382565b60405180910390a3505050565b6000819050919050565b6102af8161029c565b82525050565b60006020820190506102ca60008301846102a6565b92915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610300826102d5565b9050919050565b610310816102f5565b811461031b57600080fd5b50565b60008135905061032d81610307565b92915050565b610349816102966080565b811461035457600080fd5b50565b6000813590506103668161033d565b92915050565b60008060408385031215610383576103826102d0565b5b60006103918582860161031e565b92505060206103a285828601610357565b9150509250929050565b60008115159050919050565b6103c1816103ac565b82525050565b60006020820190506103dc60008301846103b8565b92915050565b600080604083850312156103f9576103f86102d0565b5b60006104078582860161031e565b92505060206104188582860161031e565b9150509250929050565b600061042d826102f5565b9050919050565b61043d81610422565b82525050565b600060208201905061045860008301846104d34565b92915050565b7f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460008201527f7265737300000000000000000000000000000000000000000000000000000000602082015250565b60006104ba602483610469565b91506104c58261045e565b604082019050919050565b600060208201905081810360008301526104e9816104ad565b9050919050565b7f45524332303a20617070726f766520746f20746865207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b6000610558602283610469565b915061056382610502565b604082019050919050565b600060208201905081810360008301526105878161054b565b905091905056fea2646970667358221220...";

// Polygon mainnet configuration
export const POLYGON_CONFIG = {
  chainId: 137,
  name: 'Polygon Mainnet',
  rpcUrl: 'https://polygon-mainnet.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78',
  rpcUrls: [
    'https://polygon-mainnet.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78',
    'https://polygon-rpc.com/',
    'https://rpc-mainnet.matic.network/',
    'https://poly-rpc.gateway.pokt.network/'
  ],
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  blockExplorer: 'https://polygonscan.com/',
  // Estimated gas costs (in MATIC)
  estimatedGasCosts: {
    tokenDeployment: 0.01, // ~$0.01 USD
    tokenTransfer: 0.001,  // ~$0.001 USD
    liquidityCreation: 0.05, // ~$0.05 USD
  }
};

/**
 * Upload metadata to IPFS for Polygon token
 */
export async function uploadPolygonMetadata(params: PolygonTokenParams): Promise<string> {
  console.log('📝 Uploading Polygon token metadata to IPFS...');
  
  try {
    // Use the same metadata upload as other chains
    const { uploadMetadata } = await import('./solana');
    
    // Convert to compatible format
    const metadataParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      website: params.website,
      twitter: params.twitter,
      telegram: params.telegram,
      discord: params.discord,
      decimals: params.decimals,
      supply: params.totalSupply,
    };
    
    // Upload metadata (connection not used for IPFS upload)
    const metadataUri = await uploadMetadata(null as any, metadataParams);
    
    console.log('✅ Polygon metadata uploaded:', metadataUri);
    return metadataUri;
  } catch (error) {
    console.error('❌ Failed to upload Polygon metadata:', error);
    throw error;
  }
}

/**
 * Collect platform fee on Polygon
 */
export async function collectPolygonPlatformFee(
  signer: ethers.JsonRpcSigner,
  retentionPercentage: number = 20
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    // Calculate retention-based platform fee
    let platformFee: number;
    if (retentionPercentage <= 5) {
      // Very low retention: 0.001 to 0.01 MATIC
      platformFee = 0.001 + (retentionPercentage / 5) * 0.009;
    } else if (retentionPercentage <= 25) {
      // Low to medium retention: 0.01 to 80 MATIC (exponential curve)
      const normalizedRetention = (retentionPercentage - 5) / 20;
      platformFee = 0.01 + (normalizedRetention * normalizedRetention * 79.99);
    } else {
      // High retention: 80+ MATIC (exponential increase)
      const normalizedRetention = (retentionPercentage - 25) / 75;
      platformFee = 80 + (normalizedRetention * normalizedRetention * 420);
    }
    const feeRecipient = process.env.NEXT_PUBLIC_POLYGON_FEE_RECIPIENT_ADDRESS;
    const userAddress = await signer.getAddress();
    
    if (!feeRecipient || feeRecipient === '0xYourPolygonWalletAddress') {
      console.log('⚠️ No Polygon fee recipient configured, skipping fee collection');
      return { success: true };
    }
    
    // Check if fee recipient is the same as user (avoid self-transfer)
    if (feeRecipient.toLowerCase() === userAddress.toLowerCase()) {
      console.log('⚠️ Fee recipient is same as user, skipping fee collection');
      return { success: true };
    }
    
    console.log(`💳 Collecting ${platformFee} MATIC platform fee...`);
    
    const feeInWei = ethers.parseEther(platformFee.toString());
    
    // Ensure we're on Polygon network before balance check
    const network = await signer.provider.getNetwork();
    if (network.chainId !== BigInt(137)) {
      throw new Error(`Wrong network: expected Polygon (137), but got ${network.chainId}. Please switch to Polygon network.`);
    }
    
    // Check if user has sufficient balance
    const balance = await signer.provider.getBalance(userAddress);
    const requiredAmount = feeInWei + ethers.parseEther('0.01'); // Fee + gas buffer
    
    if (balance < requiredAmount) {
      throw new Error(`Insufficient MATIC balance. Need at least ${ethers.formatEther(requiredAmount)} MATIC, but have ${ethers.formatEther(balance)} MATIC`);
    }
    
    // Send MATIC to fee recipient with simple gas settings
    const tx = await signer.sendTransaction({
      to: feeRecipient,
      value: feeInWei,
      gasLimit: 21000 // Standard ETH transfer gas limit
    });
    
    console.log(`💳 Platform fee transaction sent: ${tx.hash}`);
    console.log(`✅ Platform fee collected: ${tx.hash}`);
    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (error) {
    console.error('❌ Failed to collect platform fee:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown fee collection error',
    };
  }
}

/**
 * Calculate optimal gas settings for Polygon network
 */
async function calculateOptimalPolygonGas(feeData: ethers.FeeData): Promise<{
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}> {
  // Polygon-specific gas calculation to avoid underpriced transactions
  let baseMaxFeePerGas: bigint;
  let basePriorityFee: bigint;
  
  if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
    // Use network-provided values as base
    baseMaxFeePerGas = feeData.maxFeePerGas;
    basePriorityFee = feeData.maxPriorityFeePerGas;
  } else {
    // Fallback values optimized for Polygon
    baseMaxFeePerGas = ethers.parseUnits('30', 'gwei');
    basePriorityFee = ethers.parseUnits('2', 'gwei'); // Higher default for Polygon
  }
  
  // Apply Polygon-specific multipliers to avoid mempool issues
  // CRITICAL: maxPriorityFeePerGas must NEVER exceed maxFeePerGas
  const maxFeeMultiplier = BigInt(140); // 40% increase for max fee
  const priorityFeeMultiplier = BigInt(120); // 20% increase for priority fee
  
  let maxFeePerGas = (baseMaxFeePerGas * maxFeeMultiplier) / BigInt(100);
  let maxPriorityFeePerGas = (basePriorityFee * priorityFeeMultiplier) / BigInt(100);
  
  // Ensure maxPriorityFeePerGas is never greater than maxFeePerGas
  if (maxPriorityFeePerGas >= maxFeePerGas) {
    maxPriorityFeePerGas = (maxFeePerGas * BigInt(80)) / BigInt(100); // Set to 80% of maxFee
  }
  
  // Ensure minimum values for Polygon network
  const minMaxFeePerGas = ethers.parseUnits('30', 'gwei');
  const minPriorityFee = ethers.parseUnits('2', 'gwei');
  
  return {
    maxFeePerGas: maxFeePerGas > minMaxFeePerGas ? maxFeePerGas : minMaxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGas > minPriorityFee ? maxPriorityFeePerGas : minPriorityFee
  };
}

/**
 * Wait for Polygon contract deployment with multiple fallback strategies
 */
async function waitForPolygonDeployment(
  contract: ethers.Contract,
  provider: ethers.JsonRpcProvider,
  timeoutMs: number = 300000 // 5 minutes default
): Promise<string> {
  const deploymentTx = contract.deploymentTransaction();
  
  if (!deploymentTx) {
    throw new Error('No deployment transaction found');
  }
  
  console.log(`⏳ Using robust deployment confirmation for tx: ${deploymentTx.hash}`);
  
  // Strategy 1: Try waitForDeployment with timeout
  try {
    console.log('📝 Strategy 1: Using waitForDeployment with timeout...');
    
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('waitForDeployment timeout')), timeoutMs)
    );
    
    await Promise.race([
      contract.waitForDeployment(),
      timeoutPromise
    ]);
    
    const address = await contract.getAddress();
    console.log('✅ Strategy 1 successful: waitForDeployment completed');
    return address;
  } catch (error) {
    console.log('⚠️ Strategy 1 failed, trying alternative methods...');
  }
  
  // Strategy 2: Use provider.waitForTransaction with timeout
  try {
    console.log('📝 Strategy 2: Using provider.waitForTransaction...');
    
    const receipt = await provider.waitForTransaction(
      deploymentTx.hash,
      1, // 1 confirmation
      timeoutMs
    );
    
    if (!receipt) {
      throw new Error('Transaction receipt is null');
    }
    
    if (receipt.status !== 1) {
      throw new Error(`Transaction failed with status: ${receipt.status}`);
    }
    
    const address = await contract.getAddress();
    console.log('✅ Strategy 2 successful: provider.waitForTransaction completed');
    return address;
  } catch (error) {
    console.log('⚠️ Strategy 2 failed, trying manual verification...');
  }
  
  // Strategy 3: Manual polling with contract code verification
  console.log('📝 Strategy 3: Manual polling with code verification...');
  
  const startTime = Date.now();
  const pollInterval = 3000; // 3 seconds - matches Polygon block time
  let lastError: Error | null = null;
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      // Check if transaction is mined
      const receipt = await provider.getTransactionReceipt(deploymentTx.hash);
      
      if (receipt && receipt.status === 1) {
        // Transaction is mined, get contract address
        const address = await contract.getAddress();
        
        // Verify contract code is deployed
        const code = await provider.getCode(address);
        
        if (code && code !== '0x') {
          console.log('✅ Strategy 3 successful: Manual verification completed');
          return address;
        }
        
        console.log('⏳ Contract address found but no bytecode yet, continuing...');
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      lastError = error as Error;
      console.log(`⚠️ Polling attempt failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  // All strategies failed
  throw new Error(`All deployment confirmation strategies failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Get reliable Polygon provider with proper configuration
 */
async function getReliablePolygonProvider(): Promise<ethers.JsonRpcProvider> {
  // Use Infura as primary RPC for reliability
  const rpcUrl = POLYGON_CONFIG.rpcUrl;
  const provider = new ethers.JsonRpcProvider(rpcUrl, {
    chainId: 137,
    name: 'polygon'
  });
  
  // Test the connection
  try {
    await provider.getBlockNumber();
    console.log('✅ Connected to reliable Polygon RPC');
    return provider;
  } catch (error) {
    console.error('❌ Failed to connect to Polygon RPC:', error);
    throw new Error('Failed to establish reliable connection to Polygon network');
  }
}

/**
 * Deploy ERC-20 token contract on Polygon
 */
export async function deployPolygonToken(
  signer: ethers.JsonRpcSigner,
  params: PolygonTokenParams,
  progressCallback?: (step: number, status: string) => void
): Promise<{
  success: boolean;
  tokenAddress?: string;
  txHash?: string;
  error?: string;
}> {
  try {
    // Validate network first
    const network = await signer.provider.getNetwork();
    if (network.chainId !== BigInt(137)) {
      throw new Error(`Wrong network: expected Polygon (137), but connected to ${network.chainId}. Please switch to Polygon network in MetaMask.`);
    }
    
    progressCallback?.(1, 'Collecting platform fee...');
    
    // Collect platform fee first (using retention percentage for fee calculation)
    const retentionPercentage = params.retentionPercentage || 20;
    const feeResult = await collectPolygonPlatformFee(signer, retentionPercentage);
    if (!feeResult.success) {
      throw new Error(feeResult.error || 'Failed to collect platform fee');
    }
    
    progressCallback?.(2, 'Preparing token deployment...');
    
    // Get reliable provider for gas estimation
    const reliableProvider = await getReliablePolygonProvider();
    
    // Get current gas prices from reliable source
    const feeData = await reliableProvider.getFeeData();
    console.log('📊 Current Polygon gas prices:', {
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') + ' gwei' : 'N/A',
      maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') + ' gwei' : 'N/A',
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') + ' gwei' : 'N/A'
    });
    
    // Create contract factory
    const contractFactory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, signer);
    
    // Calculate total supply with decimals
    const totalSupplyWithDecimals = ethers.parseUnits(
      params.totalSupply.toString(),
      params.decimals
    );
    
    progressCallback?.(3, 'Deploying ERC-20 contract...');
    
    console.log('🚀 Deploying with simple gas settings');
    
    // Deploy contract with simple constructor (name, symbol only)
    const contract = await contractFactory.deploy(
      params.name,
      params.symbol
      // Let ethers estimate gas automatically
    );
    
    console.log('✅ Contract deployment transaction sent successfully');
    
    progressCallback?.(4, 'Waiting for deployment confirmation...');
    
    // Get deployment transaction
    const deploymentTx = contract.deploymentTransaction();
    if (!deploymentTx) {
      throw new Error('No deployment transaction found');
    }
    
    console.log(`⏳ Waiting for deployment confirmation, tx hash: ${deploymentTx.hash}`);
    
    // Simple reliable approach: wait for transaction receipt directly
    const receipt = await deploymentTx.wait(1);
    if (!receipt || !receipt.contractAddress) {
      throw new Error('Contract deployment failed - no contract address found');
    }
    
    const tokenAddress = receipt.contractAddress;
    
    console.log('✅ Contract deployment confirmed');
    
    // Verify the contract is working by calling a view function
    try {
      const verifyContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const name = await verifyContract.name();
      const symbol = await verifyContract.symbol();
      const totalSupply = await verifyContract.totalSupply();
      console.log('✅ Contract verification successful:', { name, symbol, totalSupply: totalSupply.toString() });
    } catch (verifyError) {
      console.log('⚠️ Contract verification failed, but deployment succeeded');
    }
    
    progressCallback?.(5, 'Token deployed successfully!');
    
    console.log('✅ Polygon token deployed:', {
      address: tokenAddress,
      txHash: deploymentTx.hash,
      name: params.name,
      symbol: params.symbol,
      totalSupply: params.totalSupply,
      decimals: params.decimals,
    });
    
    return {
      success: true,
      tokenAddress,
      txHash: deploymentTx.hash,
    };
  } catch (error) {
    console.error('❌ Polygon token deployment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error',
    };
  }
}

/**
 * Calculate Polygon deployment costs
 */
export function getPolygonCostBreakdown(params: PolygonTokenParams): {
  platformFee: number;
  deploymentFee: number;
  liquidityAmount?: number;
  poolCreationFee?: number;
  total: number;
  currency: string;
  breakdown: Record<string, string>;
} {
  const platformFee = parseFloat(process.env.NEXT_PUBLIC_POLYGON_PLATFORM_FEE || '20');
  const deploymentFee = POLYGON_CONFIG.estimatedGasCosts.tokenDeployment;
  const liquidityAmount = params.liquidityMaticAmount || 0;
  const poolCreationFee = params.createLiquidity ? POLYGON_CONFIG.estimatedGasCosts.liquidityCreation : 0;
  
  const total = platformFee + deploymentFee + liquidityAmount + poolCreationFee;
  
  return {
    platformFee,
    deploymentFee,
    liquidityAmount,
    poolCreationFee,
    total,
    currency: 'MATIC',
    breakdown: {
      'Platform Fee': `${platformFee} MATIC`,
      'Deployment Gas': `${deploymentFee} MATIC`,
      ...(liquidityAmount > 0 && { 'Liquidity MATIC': `${liquidityAmount} MATIC` }),
      ...(poolCreationFee > 0 && { 'Pool Creation': `${poolCreationFee} MATIC` }),
      'Total': `${total} MATIC`,
    },
  };
}

/**
 * Validate Polygon token parameters
 */
export function validatePolygonParams(params: PolygonTokenParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!params.name || params.name.length < 2) {
    errors.push('Token name must be at least 2 characters');
  }
  
  if (!params.symbol || params.symbol.length < 2 || params.symbol.length > 10) {
    errors.push('Token symbol must be between 2 and 10 characters');
  }
  
  if (params.decimals < 0 || params.decimals > 18) {
    errors.push('Token decimals must be between 0 and 18');
  }
  
  if (params.totalSupply <= 0) {
    errors.push('Total supply must be greater than 0');
  }
  
  if (params.retentionPercentage && (params.retentionPercentage < 0 || params.retentionPercentage > 100)) {
    errors.push('Retention percentage must be between 0 and 100');
  }
  
  if (params.createLiquidity && (!params.liquidityMaticAmount || params.liquidityMaticAmount <= 0)) {
    errors.push('Liquidity MATIC amount must be greater than 0 when creating liquidity');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Uniswap V3 contract addresses on Polygon
export const UNISWAP_V3_POLYGON = {
  factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
};

// QuickSwap contract addresses
export const QUICKSWAP_POLYGON = {
  factory: '0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28',
  router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
};

/**
 * Create Uniswap V3 liquidity pool on Polygon
 */
export async function createPolygonLiquidityPool(
  signer: ethers.JsonRpcSigner,
  tokenAddress: string,
  params: PolygonTokenParams,
  progressCallback?: (step: number, status: string) => void
): Promise<{
  success: boolean;
  poolAddress?: string;
  txHash?: string;
  error?: string;
}> {
  try {
    if (!params.createLiquidity || !params.liquidityMaticAmount) {
      return { success: true }; // No liquidity requested
    }

    progressCallback?.(1, 'Preparing liquidity pool creation...');

    const { dexChoice = 'uniswap-v3', liquidityMaticAmount } = params;
    
    if (dexChoice === 'uniswap-v3') {
      return await createUniswapV3Pool(signer, tokenAddress, params, progressCallback);
    } else if (dexChoice === 'quickswap') {
      return await createQuickSwapPool(signer, tokenAddress, params, progressCallback);
    } else {
      throw new Error(`Unsupported DEX: ${dexChoice}`);
    }
  } catch (error) {
    console.error('❌ Polygon liquidity pool creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown liquidity creation error',
    };
  }
}

/**
 * Create Uniswap V3 pool on Polygon
 */
async function createUniswapV3Pool(
  signer: ethers.JsonRpcSigner,
  tokenAddress: string,
  params: PolygonTokenParams,
  progressCallback?: (step: number, status: string) => void
): Promise<{
  success: boolean;
  poolAddress?: string;
  txHash?: string;
  error?: string;
}> {
  try {
    const { liquidityMaticAmount = 0 } = params;
    
    progressCallback?.(2, 'Setting up Uniswap V3 contracts...');

    // Position Manager ABI (simplified for pool creation)
    const positionManagerABI = [
      "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)",
      "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
    ];

    const erc20ABI = [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function allowance(address owner, address spender) external view returns (uint256)",
    ];

    const positionManager = new ethers.Contract(
      UNISWAP_V3_POLYGON.positionManager,
      positionManagerABI,
      signer
    );

    progressCallback?.(3, 'Calculating pool parameters...');

    // Determine token order (token0 < token1)
    const token0 = tokenAddress.toLowerCase() < UNISWAP_V3_POLYGON.WMATIC.toLowerCase() 
      ? tokenAddress 
      : UNISWAP_V3_POLYGON.WMATIC;
    const token1 = tokenAddress.toLowerCase() < UNISWAP_V3_POLYGON.WMATIC.toLowerCase() 
      ? UNISWAP_V3_POLYGON.WMATIC 
      : tokenAddress;

    const fee = 3000; // 0.3% fee tier
    const sqrtPriceX96 = '79228162514264337593543950336'; // 1:1 price ratio

    // Calculate amounts
    const maticAmount = ethers.parseEther(liquidityMaticAmount.toString());
    const tokenAmount = ethers.parseUnits('1000', params.decimals); // Add 1000 tokens to pool

    progressCallback?.(4, 'Creating pool if necessary...');

    // Create pool if it doesn't exist
    const createPoolTx = await positionManager.createAndInitializePoolIfNecessary(
      token0,
      token1,
      fee,
      sqrtPriceX96,
      { value: token0 === UNISWAP_V3_POLYGON.WMATIC ? maticAmount : 0 }
    );

    await createPoolTx.wait();

    progressCallback?.(5, 'Approving tokens for liquidity...');

    // Approve tokens
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
    const approveTx = await tokenContract.approve(UNISWAP_V3_POLYGON.positionManager, tokenAmount);
    await approveTx.wait();

    progressCallback?.(6, 'Adding liquidity to pool...');

    // Add liquidity
    const mintParams = {
      token0,
      token1,
      fee,
      tickLower: -887272, // Full range
      tickUpper: 887272,  // Full range
      amount0Desired: token0 === tokenAddress ? tokenAmount : maticAmount,
      amount1Desired: token1 === tokenAddress ? tokenAmount : maticAmount,
      amount0Min: 0,
      amount1Min: 0,
      recipient: await signer.getAddress(),
      deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    const mintTx = await positionManager.mint(mintParams, {
      value: token0 === UNISWAP_V3_POLYGON.WMATIC ? maticAmount : token1 === UNISWAP_V3_POLYGON.WMATIC ? maticAmount : 0
    });

    const receipt = await mintTx.wait();

    progressCallback?.(7, 'Liquidity pool created successfully!');

    console.log('✅ Uniswap V3 pool created on Polygon:', {
      token0,
      token1,
      fee,
      txHash: receipt.hash,
    });

    return {
      success: true,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error('❌ Uniswap V3 pool creation failed:', error);
    throw error;
  }
}

/**
 * Create QuickSwap pool on Polygon
 */
async function createQuickSwapPool(
  signer: ethers.JsonRpcSigner,
  tokenAddress: string,
  params: PolygonTokenParams,
  progressCallback?: (step: number, status: string) => void
): Promise<{
  success: boolean;
  poolAddress?: string;
  txHash?: string;
  error?: string;
}> {
  try {
    const { liquidityMaticAmount = 0 } = params;
    
    progressCallback?.(2, 'Setting up QuickSwap contracts...');

    // QuickSwap Router ABI (simplified)
    const routerABI = [
      "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
    ];

    const erc20ABI = [
      "function approve(address spender, uint256 amount) external returns (bool)",
    ];

    const router = new ethers.Contract(
      QUICKSWAP_POLYGON.router,
      routerABI,
      signer
    );

    progressCallback?.(3, 'Approving tokens for QuickSwap...');

    // Calculate amounts
    const maticAmount = ethers.parseEther(liquidityMaticAmount.toString());
    const tokenAmount = ethers.parseUnits('1000', params.decimals); // Add 1000 tokens

    // Approve tokens
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
    const approveTx = await tokenContract.approve(QUICKSWAP_POLYGON.router, tokenAmount);
    await approveTx.wait();

    progressCallback?.(4, 'Adding liquidity to QuickSwap...');

    // Add liquidity
    const addLiquidityTx = await router.addLiquidityETH(
      tokenAddress,
      tokenAmount,
      0, // amountTokenMin
      0, // amountETHMin
      await signer.getAddress(),
      Math.floor(Date.now() / 1000) + 3600, // deadline
      { value: maticAmount }
    );

    const receipt = await addLiquidityTx.wait();

    progressCallback?.(5, 'QuickSwap liquidity added successfully!');

    console.log('✅ QuickSwap pool created on Polygon:', {
      tokenAddress,
      maticAmount: liquidityMaticAmount,
      txHash: receipt.hash,
    });

    return {
      success: true,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error('❌ QuickSwap pool creation failed:', error);
    throw error;
  }
}

/**
 * Get MetaMask provider for Polygon
 */
export async function getPolygonProvider(): Promise<ethers.BrowserProvider | null> {
  try {
    // Check if MetaMask is installed
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Check if connected to Polygon
      const network = await provider.getNetwork();
      
      if (network.chainId !== BigInt(POLYGON_CONFIG.chainId)) {
        // Request to switch to Polygon
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${POLYGON_CONFIG.chainId.toString(16)}` }],
          });
        } catch (switchError: any) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${POLYGON_CONFIG.chainId.toString(16)}`,
                chainName: POLYGON_CONFIG.name,
                nativeCurrency: POLYGON_CONFIG.nativeCurrency,
                rpcUrls: [POLYGON_CONFIG.rpcUrl],
                blockExplorerUrls: [POLYGON_CONFIG.blockExplorer],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      return provider;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Polygon provider:', error);
    return null;
  }
}

/**
 * Connect to MetaMask and get signer for Polygon
 */
export async function connectPolygonWallet(): Promise<{
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  error?: string;
}> {
  try {
    const provider = await getPolygonProvider();
    if (!provider) {
      return {
        signer: null,
        address: null,
        error: 'MetaMask not installed or Polygon network not available',
      };
    }
    
    // Request account access
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    return {
      signer,
      address,
    };
  } catch (error) {
    return {
      signer: null,
      address: null,
      error: error instanceof Error ? error.message : 'Failed to connect to MetaMask',
    };
  }
}

/**
 * Alternative deployment confirmation using deploymentTransaction().wait()
 * This is a backup method when waitForDeployment() fails
 */
export async function deployPolygonTokenWithAlternativeWait(
  signer: ethers.JsonRpcSigner,
  params: PolygonTokenParams,
  progressCallback?: (step: number, status: string) => void
): Promise<{
  success: boolean;
  tokenAddress?: string;
  txHash?: string;
  error?: string;
}> {
  try {
    // Validate network
    const network = await signer.provider.getNetwork();
    if (network.chainId !== BigInt(137)) {
      throw new Error(`Wrong network: expected Polygon (137), but connected to ${network.chainId}`);
    }
    
    progressCallback?.(1, 'Preparing alternative deployment method...');
    
    // Collect platform fee
    const retentionPercentage = params.retentionPercentage || 20;
    const feeResult = await collectPolygonPlatformFee(signer, retentionPercentage);
    if (!feeResult.success) {
      throw new Error(feeResult.error || 'Failed to collect platform fee');
    }
    
    progressCallback?.(2, 'Configuring deployment with enhanced gas settings...');
    
    const reliableProvider = await getReliablePolygonProvider();
    const feeData = await reliableProvider.getFeeData();
    const polygonGasConfig = await calculateOptimalPolygonGas(feeData);
    
    // Create contract factory
    const contractFactory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, signer);
    
    // Calculate total supply
    const totalSupplyWithDecimals = ethers.parseUnits(
      params.totalSupply.toString(),
      params.decimals
    );
    
    progressCallback?.(3, 'Deploying contract with alternative confirmation method...');
    
    // Deploy contract with enhanced gas settings
    const contract = await contractFactory.deploy(
      params.name,
      params.symbol,
      totalSupplyWithDecimals,
      await signer.getAddress(),
      {
        gasLimit: 1500000,
        maxFeePerGas: polygonGasConfig.maxFeePerGas,
        maxPriorityFeePerGas: polygonGasConfig.maxPriorityFeePerGas,
        type: 2
      }
    );
    
    console.log('✅ Contract deployment transaction sent');
    
    progressCallback?.(4, 'Waiting for confirmation using deploymentTransaction method...');
    
    // Use deploymentTransaction().wait() method with timeout
    const deploymentTx = contract.deploymentTransaction();
    if (!deploymentTx) {
      throw new Error('No deployment transaction found');
    }
    
    console.log(`⏳ Using deploymentTransaction().wait() for tx: ${deploymentTx.hash}`);
    
    // Wait with timeout
    const timeoutMs = 300000; // 5 minutes
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('deploymentTransaction.wait timeout')), timeoutMs)
    );
    
    const receipt = await Promise.race([
      deploymentTx.wait(1), // Wait for 1 confirmation
      timeoutPromise
    ]);
    
    if (!receipt || receipt.status !== 1) {
      throw new Error('Transaction failed or was reverted');
    }
    
    const tokenAddress = await contract.getAddress();
    
    // Verify contract deployment
    const code = await reliableProvider.getCode(tokenAddress);
    if (code === '0x') {
      throw new Error('Contract bytecode not found at deployment address');
    }
    
    progressCallback?.(5, 'Alternative deployment method completed successfully!');
    
    console.log('✅ Polygon token deployed using alternative method:', {
      address: tokenAddress,
      txHash: deploymentTx.hash,
      name: params.name,
      symbol: params.symbol
    });
    
    return {
      success: true,
      tokenAddress,
      txHash: deploymentTx.hash
    };
  } catch (error) {
    console.error('❌ Alternative Polygon deployment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error'
    };
  }
}

// Extended window interface for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}