import { getHyperLiquidConfig } from '../config/hyperliquid';

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
 * Create nonce for API authentication
 */
export function createNonce(): number {
  return Date.now();
}

/**
 * Sign API request using HYPER LIQUID's EIP-712 signature scheme
 */
export async function signRequest(payload: any, signer?: any): Promise<string> {
  if (!signer) {
    throw new Error('No signer provided. Please connect your wallet.');
  }

  try {
    // HYPER LIQUID uses EIP-712 structured data signing
    const domain = {
      name: 'HyperLiquid',
      version: '1',
      chainId: 421037, // HYPER LIQUID mainnet chain ID
      verifyingContract: '0x0000000000000000000000000000000000000000', // Zero address for domain
    };

    // Define the message types based on HYPER LIQUID specification
    // Use only the primary type to avoid "ambiguous primary types" error
    const types = {
      SpotDeployAction: [
        { name: 'action', type: 'string' },
        { name: 'nonce', type: 'uint64' },
        { name: 'data', type: 'bytes' },
      ],
    };

    // Create the message to sign
    const message = {
      action: JSON.stringify(payload),
      nonce: payload.nonce || Date.now(),
      data: '0x' + Buffer.from(JSON.stringify(payload)).toString('hex'),
    };

    // Sign using EIP-712
    const signature = await signer.signTypedData(domain, types, message);
    
    console.log('✅ Successfully signed HYPER LIQUID request');
    return signature;
    
  } catch (error) {
    console.error('❌ Failed to sign HYPER LIQUID request:', error);
    throw new Error('Failed to sign request: ' + (error as Error).message);
  }
}

/**
 * Make authenticated API request to HYPER LIQUID
 */
export async function makeHyperLiquidRequest(
  endpoint: string,
  payload: any,
  signer: any,
  method: 'GET' | 'POST' = 'POST'
): Promise<HyperLiquidApiResponse> {
  const config = getHyperLiquidConfig();
  
  if (!signer) {
    throw new Error('Wallet signer required for HYPER LIQUID API requests');
  }
  
  try {
    const nonce = createNonce();
    const requestPayload = {
      ...payload,
      nonce,
    };
    
    const signature = await signRequest(requestPayload, signer);
    const userAddress = await signer.getAddress();
    
    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-User-Address': userAddress,
      },
      body: method === 'POST' ? JSON.stringify(requestPayload) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data,
      txHash: data.txHash,
    };
  } catch (error) {
    console.error('HYPER LIQUID API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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

  const txHashes: string[] = [];
  let tokenId: number | undefined;
  let spotIndex: number | undefined;

  try {
    onProgress?.(1, 'Registering token...');

    // Step 1: Register Token
    const registerTokenPayload: RegisterToken2 = {
      spec: {
        name: params.symbol,
        szDecimals: params.szDecimals,
        weiDecimals: params.weiDecimals,
      },
      maxGas: params.maxGas || 100000,
      fullName: params.name,
    };

    const registerResponse = await makeHyperLiquidRequest(
      '/exchange',
      { type: 'spotDeploy', registerToken2: registerTokenPayload },
      signer
    );

    if (!registerResponse.success) {
      throw new Error(`Token registration failed: ${registerResponse.error}`);
    }

    tokenId = registerResponse.data?.tokenId;
    if (registerResponse.txHash) txHashes.push(registerResponse.txHash);

    onProgress?.(2, 'Setting up user genesis...');

    // Step 2: User Genesis (initial distribution)
    const userAddress = await signer.getAddress();
    const userGenesisPayload: UserGenesis = {
      token: tokenId!,
      user: userAddress,
      amount: (params.retainedAmount || 0).toString(),
    };

    const userGenesisResponse = await makeHyperLiquidRequest(
      '/exchange',
      { type: 'spotDeploy', userGenesis: userGenesisPayload },
      signer
    );

    if (!userGenesisResponse.success) {
      throw new Error(`User genesis failed: ${userGenesisResponse.error}`);
    }

    if (userGenesisResponse.txHash) txHashes.push(userGenesisResponse.txHash);

    onProgress?.(3, 'Configuring genesis...');

    // Step 3: Genesis (max supply configuration)
    const genesisPayload: Genesis = {
      token: tokenId!,
      maxSupply: params.maxSupply.toString(),
      setHyperliquidityBalance: params.enableHyperliquidity || false,
    };

    const genesisResponse = await makeHyperLiquidRequest(
      '/exchange',
      { type: 'spotDeploy', genesis: genesisPayload },
      signer
    );

    if (!genesisResponse.success) {
      throw new Error(`Genesis failed: ${genesisResponse.error}`);
    }

    if (genesisResponse.txHash) txHashes.push(genesisResponse.txHash);

    onProgress?.(4, 'Registering spot trading...');

    // Step 4: Register Spot (trading pair with USDC)
    const registerSpotPayload: RegisterSpot = {
      baseToken: tokenId!,
      quoteToken: 0, // USDC token ID
    };

    const spotResponse = await makeHyperLiquidRequest(
      '/exchange',
      { type: 'spotDeploy', registerSpot: registerSpotPayload },
      signer
    );

    if (!spotResponse.success) {
      throw new Error(`Spot registration failed: ${spotResponse.error}`);
    }

    spotIndex = spotResponse.data?.spotIndex;
    if (spotResponse.txHash) txHashes.push(spotResponse.txHash);

    // Step 5: Register Hyperliquidity (if enabled)
    if (params.enableHyperliquidity && params.initialPrice && params.orderSize && params.numberOfOrders) {
      onProgress?.(5, 'Enabling hyperliquidity...');

      const hyperliquidityPayload: RegisterHyperliquidity = {
        spotIndex: spotIndex!,
        startingPrice: params.initialPrice.toString(),
        orderSize: params.orderSize.toString(),
        nOrders: params.numberOfOrders,
      };

      const hyperliquidityResponse = await makeHyperLiquidRequest(
        '/exchange',
        { type: 'spotDeploy', registerHyperliquidity: hyperliquidityPayload },
        signer
      );

      if (!hyperliquidityResponse.success) {
        throw new Error(`Hyperliquidity registration failed: ${hyperliquidityResponse.error}`);
      }

      if (hyperliquidityResponse.txHash) txHashes.push(hyperliquidityResponse.txHash);
    }

    onProgress?.(5, 'Token creation completed!');

    return {
      success: true,
      tokenId,
      spotIndex,
      txHashes,
    };

  } catch (error) {
    console.error('HYPER LIQUID token creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}