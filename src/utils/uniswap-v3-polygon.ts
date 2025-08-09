// Uniswap V3 Liquidity Pool Creation for Polygon
import { ethers } from 'ethers';

// Uniswap V3 Contract Addresses on Polygon Mainnet
export const POLYGON_UNISWAP_V3_ADDRESSES = {
  Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  NonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  SwapRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  SwapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  Quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  QuoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
};

// Fee tiers for Uniswap V3 pools (in basis points)
export const FEE_TIERS = {
  LOW: 500,    // 0.05%
  MEDIUM: 3000, // 0.30%
  HIGH: 10000,  // 1.00%
};

// Minimal ABIs for the contracts we need
export const UNISWAP_V3_ABIS = {
  Factory: [
    'function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)',
    'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
  ],
  NonfungiblePositionManager: [
    'function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)',
    'function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
    'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
  ],
  ERC20: [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)',
    'function decimals() external view returns (uint8)',
  ],
  WETH: [
    'function deposit() external payable',
    'function withdraw(uint256 amount) external',
    'function balanceOf(address account) external view returns (uint256)',
  ]
};

export interface LPCreationParams {
  tokenAddress: string;
  maticAmount: number; // Amount of MATIC to pair
  tokenAmount: number; // Amount of tokens to pair
  feeTier?: number;    // Fee tier (default: MEDIUM)
  tickLower?: number;  // Lower tick for position (default: full range)
  tickUpper?: number;  // Upper tick for position (default: full range)
  slippageTolerance?: number; // Slippage tolerance percentage (default: 1%)
}

export interface LPCreationResult {
  success: boolean;
  poolAddress?: string;
  positionTokenId?: string;
  txHash?: string;
  liquidity?: string;
  amount0?: string;
  amount1?: string;
  error?: string;
}

/**
 * Calculate the square root price for initial pool creation
 * This sets the initial price of token1 in terms of token0
 */
function calculateSqrtPriceX96(token0Amount: bigint, token1Amount: bigint): bigint {
  // Price = token1Amount / token0Amount
  // sqrtPriceX96 = sqrt(price) * 2^96
  
  // Convert to price with proper decimal scaling
  const price = (token1Amount * BigInt(10**18)) / token0Amount;
  
  // Calculate sqrt using Newton's method for big integers
  let sqrtPrice = BigInt(Math.floor(Math.sqrt(Number(price / BigInt(10**9))))) * BigInt(10**9);
  
  // Apply 2^96 scaling
  const Q96 = BigInt(2) ** BigInt(96);
  return (sqrtPrice * Q96) / BigInt(10**18);
}

/**
 * Calculate tick range for full range liquidity position
 * Returns the minimum and maximum ticks for the fee tier
 */
function getFullRangeTicks(feeTier: number): { tickLower: number; tickUpper: number } {
  let tickSpacing: number;
  
  switch (feeTier) {
    case FEE_TIERS.LOW:
      tickSpacing = 10;
      break;
    case FEE_TIERS.MEDIUM:
      tickSpacing = 60;
      break;
    case FEE_TIERS.HIGH:
      tickSpacing = 200;
      break;
    default:
      tickSpacing = 60; // Default to medium tier spacing
  }
  
  // Full range: approximately -887,220 to 887,220 (rounded to tick spacing)
  const minTick = Math.floor(-887220 / tickSpacing) * tickSpacing;
  const maxTick = Math.floor(887220 / tickSpacing) * tickSpacing;
  
  return {
    tickLower: minTick,
    tickUpper: maxTick
  };
}

/**
 * Create a Uniswap V3 liquidity pool on Polygon
 */
export async function createUniswapV3Pool(
  signer: ethers.JsonRpcSigner,
  params: LPCreationParams,
  progressCallback?: (step: number, message: string) => void
): Promise<LPCreationResult> {
  try {
    const {
      tokenAddress,
      maticAmount,
      tokenAmount,
      feeTier = FEE_TIERS.MEDIUM,
      slippageTolerance = 1
    } = params;

    console.log('🏊 Creating Uniswap V3 pool:', {
      tokenAddress,
      maticAmount,
      tokenAmount,
      feeTier
    });

    progressCallback?.(1, 'Setting up contracts...');

    // Contract instances
    const factory = new ethers.Contract(
      POLYGON_UNISWAP_V3_ADDRESSES.Factory,
      UNISWAP_V3_ABIS.Factory,
      signer
    );

    const positionManager = new ethers.Contract(
      POLYGON_UNISWAP_V3_ADDRESSES.NonfungiblePositionManager,
      UNISWAP_V3_ABIS.NonfungiblePositionManager,
      signer
    );

    const tokenContract = new ethers.Contract(
      tokenAddress,
      UNISWAP_V3_ABIS.ERC20,
      signer
    );

    const wmaticContract = new ethers.Contract(
      POLYGON_UNISWAP_V3_ADDRESSES.WMATIC,
      UNISWAP_V3_ABIS.WETH,
      signer
    );

    progressCallback?.(2, 'Wrapping MATIC...');

    // Convert MATIC to WMATIC
    const maticWei = ethers.parseEther(maticAmount.toString());
    const wrapTx = await wmaticContract.deposit({ value: maticWei });
    await wrapTx.wait();
    console.log('✅ MATIC wrapped to WMATIC');

    progressCallback?.(3, 'Checking token order...');

    // Determine token0 and token1 (Uniswap requires token0 < token1)
    const token0 = tokenAddress.toLowerCase() < POLYGON_UNISWAP_V3_ADDRESSES.WMATIC.toLowerCase() 
      ? tokenAddress 
      : POLYGON_UNISWAP_V3_ADDRESSES.WMATIC;
    const token1 = tokenAddress.toLowerCase() < POLYGON_UNISWAP_V3_ADDRESSES.WMATIC.toLowerCase() 
      ? POLYGON_UNISWAP_V3_ADDRESSES.WMATIC 
      : tokenAddress;

    const amount0 = token0 === tokenAddress 
      ? ethers.parseEther(tokenAmount.toString()) 
      : maticWei;
    const amount1 = token1 === tokenAddress 
      ? ethers.parseEther(tokenAmount.toString()) 
      : maticWei;

    console.log('Token ordering:', { token0, token1, amount0: amount0.toString(), amount1: amount1.toString() });

    progressCallback?.(4, 'Approving tokens...');

    // Approve tokens for position manager
    const tokenApproveTx = await tokenContract.approve(
      POLYGON_UNISWAP_V3_ADDRESSES.NonfungiblePositionManager,
      ethers.parseEther(tokenAmount.toString())
    );
    await tokenApproveTx.wait();

    const wmaticApproveTx = await wmaticContract.approve(
      POLYGON_UNISWAP_V3_ADDRESSES.NonfungiblePositionManager,
      maticWei
    );
    await wmaticApproveTx.wait();

    console.log('✅ Tokens approved');

    progressCallback?.(5, 'Creating/initializing pool...');

    // Calculate initial price (1:1 ratio adjusted for amounts)
    const sqrtPriceX96 = calculateSqrtPriceX96(amount0, amount1);
    console.log('Initial sqrtPriceX96:', sqrtPriceX96.toString());

    // Create and initialize pool if it doesn't exist
    const createPoolTx = await positionManager.createAndInitializePoolIfNecessary(
      token0,
      token1,
      feeTier,
      sqrtPriceX96
    );
    const createPoolReceipt = await createPoolTx.wait();
    console.log('✅ Pool created/initialized');

    // Get pool address
    const poolAddress = await factory.getPool(token0, token1, feeTier);
    console.log('Pool address:', poolAddress);

    progressCallback?.(6, 'Adding liquidity...');

    // Get full range ticks
    const { tickLower, tickUpper } = getFullRangeTicks(feeTier);

    // Calculate minimum amounts (apply slippage tolerance)
    const slippageMultiplier = (100 - slippageTolerance) / 100;
    const amount0Min = (amount0 * BigInt(Math.floor(slippageMultiplier * 100))) / BigInt(100);
    const amount1Min = (amount1 * BigInt(Math.floor(slippageMultiplier * 100))) / BigInt(100);

    // Mint liquidity position
    const mintParams = {
      token0: token0,
      token1: token1,
      fee: feeTier,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: amount0,
      amount1Desired: amount1,
      amount0Min: amount0Min,
      amount1Min: amount1Min,
      recipient: await signer.getAddress(),
      deadline: Math.floor(Date.now() / 1000) + 20 * 60 // 20 minutes
    };

    console.log('Mint parameters:', mintParams);

    const mintTx = await positionManager.mint(mintParams);
    const mintReceipt = await mintTx.wait();

    console.log('✅ Liquidity added successfully');

    // Extract token ID from events
    let positionTokenId: string | undefined;
    if (mintReceipt && mintReceipt.logs) {
      for (const log of mintReceipt.logs) {
        try {
          const parsed = positionManager.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (parsed && parsed.name === 'IncreaseLiquidity') {
            positionTokenId = parsed.args.tokenId.toString();
            break;
          }
        } catch (e) {
          // Skip unparseable logs
        }
      }
    }

    progressCallback?.(7, 'Liquidity pool created successfully!');

    return {
      success: true,
      poolAddress,
      positionTokenId,
      txHash: mintTx.hash,
      liquidity: 'Position created successfully',
      amount0: ethers.formatEther(amount0),
      amount1: ethers.formatEther(amount1)
    };

  } catch (error) {
    console.error('❌ Failed to create Uniswap V3 pool:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating pool'
    };
  }
}

/**
 * Check if a pool already exists for the token pair
 */
export async function checkPoolExists(
  provider: ethers.JsonRpcProvider,
  tokenAddress: string,
  feeTier: number = FEE_TIERS.MEDIUM
): Promise<{ exists: boolean; poolAddress?: string }> {
  try {
    const factory = new ethers.Contract(
      POLYGON_UNISWAP_V3_ADDRESSES.Factory,
      UNISWAP_V3_ABIS.Factory,
      provider
    );

    const poolAddress = await factory.getPool(
      tokenAddress,
      POLYGON_UNISWAP_V3_ADDRESSES.WMATIC,
      feeTier
    );

    const exists = poolAddress !== ethers.ZeroAddress;

    return { exists, poolAddress: exists ? poolAddress : undefined };
  } catch (error) {
    console.error('Error checking pool existence:', error);
    return { exists: false };
  }
}

/**
 * Get the optimal token amounts for a given MATIC amount
 * This helps users understand how many tokens they need for their MATIC input
 */
export function calculateOptimalTokenAmount(
  maticAmount: number,
  tokenTotalSupply: number,
  retentionPercentage: number
): {
  recommendedTokenAmount: number;
  tokenPrice: number; // MATIC per token
} {
  // Calculate available tokens for liquidity (tokens not retained by user)
  const availableForLiquidity = tokenTotalSupply * ((100 - retentionPercentage) / 100);
  
  // Suggest using all available tokens for maximum liquidity
  // This creates a natural price based on the MATIC amount provided
  const recommendedTokenAmount = availableForLiquidity;
  const tokenPrice = maticAmount / recommendedTokenAmount;

  return {
    recommendedTokenAmount,
    tokenPrice
  };
}