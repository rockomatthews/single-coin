// HYPER LIQUID Configuration
export const HYPERLIQUID_CONFIG = {
  // API Endpoints
  MAINNET_API: 'https://api.hyperliquid.xyz',
  TESTNET_API: 'https://api.hyperliquid-testnet.xyz',
  
  // Network Configuration
  MAINNET: {
    name: 'mainnet',
    chainId: 421037, // HYPER LIQUID mainnet chain ID
    explorer: 'https://app.hyperliquid.xyz',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  
  TESTNET: {
    name: 'testnet',
    chainId: 421614, // HYPER LIQUID testnet chain ID
    explorer: 'https://app.hyperliquid-testnet.xyz',
    nativeCurrency: {
      name: 'HYPE',
      symbol: 'HYPE',
      decimals: 18,
    },
  },
  
  // Custom configuration for chain ID 999 (local/custom HyperLiquid)
  CUSTOM_999: {
    name: 'custom',
    chainId: 999, // Custom HyperLiquid chain ID
    explorer: 'https://app.hyperliquid.xyz',
    nativeCurrency: {
      name: 'HYPE',
      symbol: 'HYPE',
      decimals: 18,
    },
  },
  
  // Token Standards
  TOKEN_STANDARDS: {
    HIP1: 'HIP-1', // Capped supply fungible token with spot order book
    HIP2: 'HIP-2', // Hyperliquidity strategy with automated market making
  },
  
  // Fee Configuration
  FEES: {
    MIN_DEPLOYMENT_FEE: 500, // Minimum HYPE fee after dutch auction
    DUTCH_AUCTION_DURATION: 31 * 60 * 60 * 1000, // 31 hours in milliseconds
    HYPERLIQUIDITY_SPREAD: 0.003, // 0.3% spread for HIP-2 tokens
    REFRESH_INTERVAL: 3000, // 3 seconds in milliseconds
  },
  
  // Default Token Configuration
  DEFAULT_TOKEN_CONFIG: {
    tokenStandard: 'HIP-1' as const,
    szDecimals: 6, // Size decimals (for display)
    weiDecimals: 18, // Wei decimals (internal precision)
    maxSupply: 1000000000, // 1 billion tokens default
    enableHyperliquidity: false,
    initialPrice: 1.0, // Starting price in USDC
    orderSize: 1000, // Default order size for hyperliquidity
    numberOfOrders: 10, // Number of orders on each side
  },
  
  // API Configuration
  API: {
    REQUEST_TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 3,
    RATE_LIMIT_REQUESTS: 100,
    RATE_LIMIT_WINDOW: 60000, // 1 minute
  },
} as const;

// Environment-based configuration
export function getHyperLiquidConfig() {
  const network = process.env.NEXT_PUBLIC_HYPERLIQUID_NETWORK || 'mainnet';
  const isMainnet = network === 'mainnet';
  const isCustom999 = network === 'custom999';
  
  // Auto-detect chain ID 999 as mainnet if not explicitly set
  let detectedChainId: number | undefined;
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const chainIdHex = window.ethereum.chainId;
      if (chainIdHex) {
        detectedChainId = parseInt(chainIdHex, 16);
      }
    } catch (error) {
      console.warn('Could not detect chain ID:', error);
    }
  }
  
  // Determine which network configuration to use
  let currentNetwork;
  if (isCustom999 || detectedChainId === 999) {
    currentNetwork = HYPERLIQUID_CONFIG.CUSTOM_999;
  } else {
    currentNetwork = isMainnet ? HYPERLIQUID_CONFIG.MAINNET : HYPERLIQUID_CONFIG.TESTNET;
  }
  
  // Use environment variables if available, otherwise fall back to defaults
  const apiUrl = process.env.NEXT_PUBLIC_HYPERLIQUID_API_URL || 
    (isMainnet ? HYPERLIQUID_CONFIG.MAINNET_API : HYPERLIQUID_CONFIG.TESTNET_API);
  
  const explorerUrl = process.env.NEXT_PUBLIC_HYPERLIQUID_EXPLORER ||
    currentNetwork.explorer;
  
  return {
    ...HYPERLIQUID_CONFIG,
    currentNetwork,
    apiUrl,
    explorerUrl,
    isMainnet: isMainnet || detectedChainId === 999, // Treat chain ID 999 as mainnet
    isCustom999: isCustom999 || detectedChainId === 999,
    network,
  };
}

// Environment variables needed
export const REQUIRED_ENV_VARS = {
  NEXT_PUBLIC_HYPERLIQUID_NETWORK: 'testnet or mainnet',
  NEXT_PUBLIC_HYPERLIQUID_API_KEY: 'API key for HYPER LIQUID (if required)',
  HYPERLIQUID_PRIVATE_KEY: 'Private key for API wallet signing',
} as const;

// Helper function to get MetaMask network configuration
export function getMetaMaskNetworkConfig(chainId?: number) {
  const config = getHyperLiquidConfig();
  const targetChainId = chainId || 999; // Default to 999 for HyperLiquid mainnet
  
  return {
    chainId: `0x${targetChainId.toString(16)}`,
    chainName: `HyperLiquid EVM`,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://api.hyperliquid.xyz/evm'],
    blockExplorerUrls: ['https://explorer.hyperliquid.xyz'],
  };
}