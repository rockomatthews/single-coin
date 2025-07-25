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
const ERC20_BYTECODE = "0x608060405234801561001057600080fd5b506040516107d03803806107d083398101604081905261002f9161007c565b600361003b83826101a3565b50600461004882826101a3565b50505061026b565b634e487b7160e01b600052604160045260246000fd5b600082601f83011261007557600080fd5b81516001600160401b0381111561008e5761008e61004e565b604051601f8201601f19908116603f011681016001600160401b03811182821017156100bc576100bc61004e565b6040528181528382016020018510156100d457600080fd5b60005b828110156100f3576020818601810151838301820152016100d7565b506000918101602001919091529392505050565b6000806040838503121561011a57600080fd5b82516001600160401b0381111561013057600080fd5b61013c85828601610064565b95602094909401359450505050565b600181811c9082168061015f57607f821691505b60208210810361017f57634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156101e357806000526020600020601f840160051c810160208510156101ac5750805b601f840160051c820191505b818110156101cc57600081556001016101b8565b5050505050565b634e487b7160e01b600052601160045260246000fd5b81516001600160401b038111156101fc576101fc61004e565b610210816102088454610155565b85610185565b6020601f821160018114610244576000831561022c5750848201515b600019600385901b1c1916600184901b1784556101cc565b600084815260208120601f851690835b8281101561027457878501518255602094850194600190920191016102548565b50858310156102925787850151600019600388901b60f8161c191681555b50505050600190811b01905550565b6105568061027a6000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063313ce56711610066578063313ce5671461010957806370a082311461011857806395d89b4114610141578063a9059cbb14610149578063dd62ed3e1461015c57600080fd5b806306fdde0314610098578063095ea7b3146100b657806318160ddd146100d957806323b872dd146100eb575b600080fd5b6100a0610195565b6040516100ad91906103e7565b60405180910390f35b6100c96100c4366004610451565b610227565b60405190151581526020016100ad565b6002545b6040519081526020016100ad565b6100c96100f936600461047b565b610241565b604051601281526020016100ad565b6100dd6101263660046104b7565b6001600160a01b031660009081526020819052604090205490565b6100a0610265565b6100c9610157366004610451565b610274565b6100dd61016a3660046104d9565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6060600380546101a49061050c565b80601f01602080910402602001604051908101604052809291908181526020018280546101d09061050c565b801561021d5780601f106101f25761010080835404028352916020019161021d565b820191906000526020600020905b81548152906001019060200180831161020057829003601f168201915b5050505050905090565b600033610235818585610282565b60019150505b92915050565b60003361024f8582856103a6565b61025a858585610424565b506001949350505050565b6060600480546101a49061050c565b600033610235818585610424565b6001600160a01b0383166102e75760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b60648201526084015b60405180910390fd5b6001600160a01b0382166103485760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b60648201526084016102de565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b03838116600090815260016020908152604080832093861683529290522054600019811461041e578181101561041157604051637dc7a0d960e11b81526001600160a01b038416600482015260248101829052604481018390526064016102de565b61041e8484848403610282565b50505050565b6001600160a01b03831661048f5760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b60648201526084016102de565b6001600160a01b0382166104f15760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f2061646472604482015262657373606e1b60648201526084016102de565b6104fc8383836104fe565b505050565b505050565b600181811c9082168061052057607f821691505b60208210810361054057634e487b7160e01b600052602260045260246000fd5b50919050565b00";

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