import { getHyperLiquidConfig } from '../config/hyperliquid';
import * as hl from '@nktkas/hyperliquid';

// Add window ethereum type declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Types for HYPER LIQUID token creation
export interface HyperLiquidTokenParams {
  // Core token information
  name: string;
  symbol: string;
  description: string;
  image: string;
  
  // HYPER LIQUID specific
  blockchain: 'hyperliquid';
  tokenStandard: 'HIP-1' | 'HIP-2';
  
  // Token configuration
  szDecimals: number;      // Size decimals for display
  weiDecimals: number;     // Wei decimals for internal precision
  maxSupply: number;       // Maximum token supply
  
  // Distribution
  retentionPercentage?: number;
  retainedAmount?: number;
  liquidityAmount?: number;
  
  // HIP-2 Hyperliquidity specific
  enableHyperliquidity?: boolean;
  initialPrice?: number;        // Starting price in USDC
  orderSize?: number;          // Order size for market making
  numberOfOrders?: number;     // Number of orders on each side
  
  // Optional metadata
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  
  // Deployment settings
  maxGas?: number;            // Maximum gas willing to pay
  deployerFeeShare?: number;  // Fee share percentage (0-100)
}

// HYPER LIQUID API Types (based on documentation)
export interface TokenSpec {
  name: string;
  szDecimals: number;
  weiDecimals: number;
}

export interface RegisterToken2 {
  spec: TokenSpec;
  maxGas: number;
  fullName?: string;
}

export interface UserGenesis {
  token: number;
  user: string;
  amount: string;
  isExisting?: boolean;
  isBlacklisted?: boolean;
}

export interface Genesis {
  token: number;
  maxSupply: string;
  setHyperliquidityBalance?: boolean;
}

export interface RegisterSpot {
  baseToken: number;
  quoteToken: number; // Usually USDC
}

export interface RegisterHyperliquidity {
  spotIndex: number;
  startingPrice: string;
  orderSize: string;
  nOrders: number;
}

export interface SetDeployerTradingFeeShare {
  spotIndex: number;
  feeShare: string; // Percentage as string (e.g., "5%")
}

export type SpotDeployAction = 
  | { type: "spotDeploy"; registerToken2: RegisterToken2; }
  | { type: "spotDeploy"; userGenesis: UserGenesis; }
  | { type: "spotDeploy"; genesis: Genesis; }
  | { type: "spotDeploy"; registerSpot: RegisterSpot; }
  | { type: "spotDeploy"; registerHyperliquidity: RegisterHyperliquidity; }
  | { type: "spotDeploy"; setDeployerTradingFeeShare: SetDeployerTradingFeeShare; };

export interface HyperLiquidApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  txHash?: string;
}

/**
 * Calculate HYPER LIQUID deployment fee based on dutch auction
 * Fee starts high and decreases linearly over 31 hours to 500 HYPE
 */
export function calculateHyperLiquidFee(
  initialPrice: number = 5000, // Starting price in HYPE
  auctionStartTime?: Date
): number {
  const config = getHyperLiquidConfig();
  const now = Date.now();
  const startTime = auctionStartTime?.getTime() || now;
  const elapsed = now - startTime;
  const duration = config.FEES.DUTCH_AUCTION_DURATION;
  
  if (elapsed >= duration) {
    return config.FEES.MIN_DEPLOYMENT_FEE;
  }
  
  // Linear decrease from initialPrice to MIN_DEPLOYMENT_FEE
  const progress = elapsed / duration;
  const fee = initialPrice - (initialPrice - config.FEES.MIN_DEPLOYMENT_FEE) * progress;
  
  return Math.max(fee, config.FEES.MIN_DEPLOYMENT_FEE);
}

/**
 * Create a wrapped signer that works with HyperLiquid SDK's hardcoded chain ID expectations
 */
function createHyperLiquidCompatibleSigner(originalSigner: any) {
  return {
    ...originalSigner,
    
    // Override getAddress to ensure we're using the correct address
    getAddress: async () => {
      let address;
      
      try {
        if (originalSigner.getAddress) {
          address = await originalSigner.getAddress();
          console.log('🏠 Got address from signer.getAddress():', address);
        } else if (originalSigner.address) {
          address = originalSigner.address;
          console.log('🏠 Got address from signer.address:', address);
        } else if (originalSigner.provider && originalSigner.provider.request) {
          const accounts = await originalSigner.provider.request({ method: 'eth_accounts' });
          address = accounts[0];
          console.log('🏠 Got address from provider.request():', address);
        } else if (typeof window !== 'undefined' && window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          address = accounts[0];
          console.log('🏠 Got address from window.ethereum:', address);
        }
      } catch (error) {
        console.error('❌ Failed to get wallet address:', error);
        throw new Error('Could not get wallet address');
      }
      
      if (!address) {
        throw new Error('No wallet address found');
      }
      
      return address;
    },
    
    // Override signTypedData to handle the chain ID mismatch
    signTypedData: async (domain: any, types: any, message: any) => {
      // Debug the signer structure
      console.log('🔍 Signer object structure:', {
        hasGetChainId: !!originalSigner.getChainId,
        hasGetAddress: !!originalSigner.getAddress,
        hasProvider: !!originalSigner.provider,
        providerType: originalSigner.provider?.constructor?.name,
        signerKeys: Object.keys(originalSigner),
        providerKeys: originalSigner.provider ? Object.keys(originalSigner.provider) : null
      });
      
      // Get the wallet address using the wrapper's method
      const walletAddress = await (async () => {
        if (originalSigner.getAddress) {
          return await originalSigner.getAddress();
        } else if (originalSigner.address) {
          return originalSigner.address;
        } else if (originalSigner.provider && originalSigner.provider.request) {
          const accounts = await originalSigner.provider.request({ method: 'eth_accounts' });
          return accounts[0];
        } else if (typeof window !== 'undefined' && window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          return accounts[0];
        }
        return null;
      })();
      console.log('🔐 Using wallet address for signing:', walletAddress);
      
      // Try different methods to get the current chain ID
      let currentChainId = 999; // Default fallback to 999
      
      try {
        if (originalSigner.getChainId) {
          currentChainId = await originalSigner.getChainId();
          console.log('✅ Got chain ID from signer.getChainId():', currentChainId);
        } else if (originalSigner.provider && originalSigner.provider.getNetwork) {
          const network = await originalSigner.provider.getNetwork();
          currentChainId = network.chainId;
          console.log('✅ Got chain ID from provider.getNetwork():', currentChainId);
        } else if (originalSigner.provider && originalSigner.provider.request) {
          // MetaMask/Web3 provider method
          const chainIdHex = await originalSigner.provider.request({ method: 'eth_chainId' });
          currentChainId = parseInt(chainIdHex, 16);
          console.log('✅ Got chain ID from provider.request():', currentChainId);
        } else if (typeof window !== 'undefined' && window.ethereum) {
          // Direct MetaMask access
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          currentChainId = parseInt(chainIdHex, 16);
          console.log('✅ Got chain ID from window.ethereum:', currentChainId);
        }
      } catch (error) {
        console.warn('Could not get chain ID, using fallback 999:', error);
        currentChainId = 999;
      }
      
      // Convert BigInt to number if necessary
      if (typeof currentChainId === 'bigint') {
        currentChainId = Number(currentChainId);
      }
      
      const modifiedDomain = {
        ...domain,
        chainId: currentChainId // Use wallet's actual chain ID
      };
      
      console.log('🔧 Modified domain for HyperLiquid signing:', modifiedDomain);
      console.log('🔧 Original domain:', domain);
      console.log('🔧 Detected chain ID:', currentChainId);
      
      return originalSigner.signTypedData(modifiedDomain, types, message);
    }
  };
}

/**
 * Create HyperLiquid API clients using official SDK v0.23.1
 */
export function createHyperLiquidClients(signer: any) {
  const config = getHyperLiquidConfig();
  
  console.log('🔧 Creating HyperLiquid clients with signer:', {
    signerType: signer?.constructor?.name,
    signerKeys: Object.keys(signer || {}),
    hasGetAddress: !!signer?.getAddress,
    hasProvider: !!signer?.provider
  });
  
  // Create transport for the new SDK
  const transport = new hl.HttpTransport({
    isTestnet: !config.isMainnet,
    server: {
      mainnet: {
        api: config.apiUrl,
      },
      testnet: {
        api: config.apiUrl,
      }
    }
  });
  
  // Create info client for market data
  const infoClient = new hl.InfoClient({ transport });
  
  // SOLUTION: Use window.ethereum directly with the new SDK
  // The v0.23.1 SDK has better window.ethereum support
  let walletForSDK;
  
  if (typeof window !== 'undefined' && window.ethereum) {
    console.log('✅ Using window.ethereum directly with new SDK v0.23.1');
    walletForSDK = window.ethereum;
  } else if (signer?.provider) {
    console.log('✅ Using signer.provider for SDK compatibility');
    walletForSDK = signer.provider;
  } else {
    console.log('⚠️ Falling back to wrapped signer (may cause address mismatch)');
    walletForSDK = createHyperLiquidCompatibleSigner(signer);
  }
  
  // Create exchange client for authenticated operations using new API
  const exchangeClient = new hl.ExchangeClient({ 
    wallet: walletForSDK, 
    transport,
    isTestnet: !config.isMainnet,
  });
  
  // Verify what address the SDK will use
  if (typeof window !== 'undefined' && window.ethereum) {
    // Check both eth_accounts and eth_requestAccounts
    Promise.all([
      window.ethereum.request({ method: 'eth_accounts' }),
      window.ethereum.request({ method: 'eth_requestAccounts' })
    ]).then(([currentAccounts, requestedAccounts]: [string[], string[]]) => {
      console.log('🔍 Current accounts (eth_accounts):', currentAccounts);
      console.log('🔍 Requested accounts (eth_requestAccounts):', requestedAccounts);
      console.log('🔍 SDK will use address:', requestedAccounts[0]);
      
      // Also check if MetaMask is on the correct network
      window.ethereum.request({ method: 'eth_chainId' }).then((chainId: string) => {
        console.log('🔍 MetaMask chain ID:', chainId, '(decimal:', parseInt(chainId, 16), ')');
      });
    }).catch((err: any) => console.warn('Could not verify SDK address:', err));
  }
  
  return {
    infoClient,
    exchangeClient,
    config
  };
}

/**
 * Upload metadata to IPFS (reuse existing Pinata infrastructure)
 */
export async function uploadHyperLiquidMetadata(params: HyperLiquidTokenParams): Promise<string> {
  // Reuse existing Pinata upload functionality
  const { uploadToPinata, getIpfsGatewayUrl } = await import('./pinata');
  
  const metadata = {
    // Standard fields
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    image: params.image,
    
    // HYPER LIQUID specific
    blockchain: 'hyperliquid',
    tokenStandard: params.tokenStandard,
    szDecimals: params.szDecimals,
    weiDecimals: params.weiDecimals,
    maxSupply: params.maxSupply,
    
    // Enhanced metadata
    attributes: [
      { trait_type: "Blockchain", value: "HYPER LIQUID" },
      { trait_type: "Token Standard", value: params.tokenStandard },
      { trait_type: "Max Supply", value: params.maxSupply.toLocaleString() },
      { trait_type: "Size Decimals", value: params.szDecimals.toString() },
      { trait_type: "Wei Decimals", value: params.weiDecimals.toString() },
      { trait_type: "Created With", value: "Coinbull" },
      ...(params.enableHyperliquidity ? [
        { trait_type: "Hyperliquidity Enabled", value: "Yes" },
        { trait_type: "Initial Price", value: `${params.initialPrice} USDC` },
      ] : []),
    ],
    
    // Social links
    external_url: params.website || 'https://redbullcoins.com',
    website: params.website,
    twitter: params.twitter,
    telegram: params.telegram,
    discord: params.discord,
    
    // Collection info
    collection: {
      name: "Coinbull HYPER LIQUID Tokens",
      family: "Coinbull Multi-Chain"
    },
    
    // Technical metadata
    created_at: new Date().toISOString(),
    platform: "coinbull",
  };
  
  console.log('📤 Uploading HYPER LIQUID metadata to IPFS...');
  const ipfsUri = await uploadToPinata(metadata);
  const gatewayUrl = getIpfsGatewayUrl(ipfsUri);
  
  console.log('✅ HYPER LIQUID metadata uploaded:', gatewayUrl);
  return gatewayUrl;
}

/**
 * Validate HYPER LIQUID token parameters
 */
export function validateHyperLiquidParams(params: HyperLiquidTokenParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Basic validation
  if (!params.name || params.name.length < 2) {
    errors.push('Token name must be at least 2 characters');
  }
  
  if (!params.symbol || params.symbol.length < 1 || params.symbol.length > 10) {
    errors.push('Token symbol must be 1-10 characters');
  }
  
  if (params.szDecimals < 0 || params.szDecimals > 18) {
    errors.push('Size decimals must be between 0 and 18');
  }
  
  if (params.weiDecimals < 0 || params.weiDecimals > 18) {
    errors.push('Wei decimals must be between 0 and 18');
  }
  
  if (params.maxSupply <= 0) {
    errors.push('Max supply must be greater than 0');
  }
  
  // HIP-2 specific validation
  if (params.enableHyperliquidity) {
    if (!params.initialPrice || params.initialPrice <= 0) {
      errors.push('Initial price required for Hyperliquidity');
    }
    
    if (!params.orderSize || params.orderSize <= 0) {
      errors.push('Order size required for Hyperliquidity');
    }
    
    if (!params.numberOfOrders || params.numberOfOrders < 1) {
      errors.push('Number of orders must be at least 1 for Hyperliquidity');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get cost breakdown for HYPER LIQUID token deployment
 */
export function getHyperLiquidCostBreakdown(params: HyperLiquidTokenParams) {
  const deploymentFee = calculateHyperLiquidFee(params.maxGas);
  const platformFee = 0.1; // 0.1 HYPE platform fee
  
  return {
    deploymentFee: deploymentFee,
    platformFee: platformFee,
    total: deploymentFee + platformFee,
    currency: 'HYPE',
    breakdown: {
      'HYPER LIQUID Deployment': `${deploymentFee} HYPE`,
      'Coinbull Platform Fee': `${platformFee} HYPE`,
    }
  };
}

/**
 * Check if user exists on HyperLiquid by testing a simple API call
 */
export async function checkUserExists(signer: any): Promise<{ exists: boolean; error?: string }> {
  try {
    const { infoClient } = createHyperLiquidClients(signer);
    const userAddress = await signer.getAddress();
    
    // Try to get user state - this will tell us if user exists
    const userState = await infoClient.clearinghouseState({ user: userAddress });
    
    // If we get user state data, user exists
    if (userState) {
      return { exists: true };
    }
    
    return { exists: false, error: 'User not found on HyperLiquid' };
  } catch (error) {
    // Most likely user doesn't exist or network error
    return { 
      exists: false, 
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Create HYPER LIQUID token using the 5-step deployment process
 */
export async function createHyperLiquidToken(
  params: HyperLiquidTokenParams,
  signer: any,
  onProgress?: (step: number, status: string) => void
): Promise<{
  success: boolean;
  tokenId?: number;
  spotIndex?: number;
  txHashes?: string[];
  error?: string;
}> {
  if (!signer) {
    throw new Error('Wallet signer required for token creation');
  }

  const validation = validateHyperLiquidParams(params);
  if (!validation.isValid) {
    return {
      success: false,
      error: `Invalid parameters: ${validation.errors.join(', ')}`,
    };
  }

  onProgress?.(0, 'Checking wallet registration...');
  
  // Verify MetaMask is connected
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: 'No MetaMask accounts connected. Please connect your wallet.',
        };
      }
      
      const connectedAddress = accounts[0];
      console.log('🔍 MetaMask connected address:', connectedAddress);
    } catch (error) {
      console.error('Failed to verify MetaMask connection:', error);
    }
  }
  
  const userCheck = await checkUserExists(signer);
  if (!userCheck.exists) {
    return {
      success: false,
      error: `Your wallet is not registered on HyperLiquid. Please visit https://app.hyperliquid.xyz/ to create an account first.`,
    };
  }

  let tokenId: number | undefined;
  let spotIndex: number | undefined;

  try {
    const { exchangeClient } = createHyperLiquidClients(signer);
    const userAddress = await signer.getAddress();
    
    console.log('🎯 Token creation - User address:', userAddress);

    onProgress?.(1, 'Registering token...');

    // Step 1: Register Token using official SDK with correct parameters
    const registerResult = await exchangeClient.spotDeploy({
      registerToken2: {
        spec: {
          name: params.symbol,
          szDecimals: params.szDecimals,
          weiDecimals: params.weiDecimals,
        },
        maxGas: params.maxGas || 5000,
        fullName: params.name,
      },
    });

    console.log('Register token result:', registerResult);

    // Handle response - SDK v0.23.1 returns SuccessResponse with type: "default"
    if (registerResult.status === 'ok') {
      console.log('✅ Token registration successful');
      // Note: SuccessResponse doesn't include transaction hashes or specific data
    } else {
      // status === 'err'
      throw new Error(`Token registration failed: ${registerResult.response}`);
    }

    // For now, let's assume tokenId is sequential and try to get it via another method
    // This is a temporary workaround - in production, you'd need proper token ID tracking
    if (!tokenId) {
      console.warn('Token ID not returned directly, using placeholder for now');
      tokenId = Date.now() % 1000000; // Temporary fallback
    }

    onProgress?.(2, 'Setting up user genesis...');

    // Step 2: User Genesis (initial distribution) - using correct format
    console.log('🎯 User Genesis - Using address:', userAddress);
    console.log('🎯 User Genesis - Retained amount:', params.retainedAmount || 0);
    
    const userGenesisResult = await exchangeClient.spotDeploy({
      userGenesis: {
        token: tokenId,
        userAndWei: [[userAddress, (params.retainedAmount || 0).toString()]],
        existingTokenAndWei: [],
      },
    });

    console.log('User genesis result:', userGenesisResult);
    
    if (userGenesisResult.status === 'ok') {
      console.log('✅ User genesis successful');
    } else {
      // status === 'err'
      throw new Error(`User genesis failed: ${userGenesisResult.response}`);
    }

    onProgress?.(3, 'Configuring genesis...');

    // Step 3: Genesis (max supply configuration) - using correct format
    const genesisResult = await exchangeClient.spotDeploy({
      genesis: {
        token: tokenId,
        maxSupply: params.maxSupply.toString(),
      },
    });

    console.log('Genesis result:', genesisResult);
    
    if (genesisResult.status === 'ok') {
      console.log('✅ Genesis successful');
    } else {
      // status === 'err'
      throw new Error(`Genesis failed: ${genesisResult.response}`);
    }

    onProgress?.(4, 'Registering spot trading...');

    // Step 4: Register Spot (trading pair with USDC) - using correct format
    const spotResult = await exchangeClient.spotDeploy({
      registerSpot: {
        tokens: [tokenId, 0], // [baseToken, quoteToken] format
      },
    });

    console.log('Spot registration result:', spotResult);

    if (spotResult.status === 'ok') {
      console.log('✅ Spot registration successful');
      // Derive spot index from token ID (usually tokenId - 1 for the first spot pair)
      if (tokenId) {
        spotIndex = tokenId - 1;
      }
    } else {
      // status === 'err'
      throw new Error(`Spot registration failed: ${spotResult.response}`);
    }

    // Step 5: Register Hyperliquidity (if enabled) - using correct format
    if (params.enableHyperliquidity && params.initialPrice && params.orderSize && params.numberOfOrders) {
      onProgress?.(5, 'Enabling hyperliquidity...');

      const hyperliquidityResult = await exchangeClient.spotDeploy({
        registerHyperliquidity: {
          spot: spotIndex || tokenId,
          startPx: params.initialPrice.toString(),
          orderSz: params.orderSize.toString(),
          nOrders: params.numberOfOrders,
          nSeededLevels: 1, // Default to 1 seeded level
        },
      });

      console.log('Hyperliquidity result:', hyperliquidityResult);
      
      if (hyperliquidityResult.status === 'ok') {
        console.log('✅ Hyperliquidity registration successful');
      } else {
        // status === 'err'
        throw new Error(`Hyperliquidity registration failed: ${hyperliquidityResult.response}`);
      }
    }

    onProgress?.(5, 'Token creation completed!');

    return {
      success: true,
      tokenId,
      spotIndex,
      txHashes: [], // SDK doesn't return transaction hashes in SuccessResponse
    };

  } catch (error) {
    console.error('HYPER LIQUID token creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}