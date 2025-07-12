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
 * Sign API request (simplified - would need actual cryptographic implementation)
 */
export async function signRequest(payload: any, privateKey: string): Promise<string> {
  // TODO: Implement actual signing logic using HYPER LIQUID's signature scheme
  // This would involve proper cryptographic signing
  console.log('Signing request payload:', payload);
  console.log('Using private key (hash):', privateKey.slice(0, 10) + '...');
  
  // Placeholder implementation
  return 'signature_placeholder';
}

/**
 * Make authenticated API request to HYPER LIQUID
 */
export async function makeHyperLiquidRequest(
  endpoint: string,
  payload: any,
  method: 'GET' | 'POST' = 'POST'
): Promise<HyperLiquidApiResponse> {
  const config = getHyperLiquidConfig();
  const privateKey = process.env.HYPERLIQUID_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('HYPERLIQUID_PRIVATE_KEY environment variable not set');
  }
  
  try {
    const nonce = createNonce();
    const requestPayload = {
      ...payload,
      nonce,
    };
    
    const signature = await signRequest(requestPayload, privateKey);
    
    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
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