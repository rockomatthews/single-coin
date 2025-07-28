import Moralis from 'moralis';

export interface MoralisTokenParams {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  supply: number;
  decimals: number;
  network: 'ethereum' | 'polygon' | 'bsc' | 'arbitrum' | 'base';
  ownerAddress: string;
  // Security features
  mintable?: boolean;
  burnable?: boolean;
  pausable?: boolean;
}

export interface MoralisTokenResult {
  success: boolean;
  tokenAddress?: string;
  transactionHash?: string;
  error?: string;
  explorer_url?: string;
}

class MoralisTokenDeployment {
  private initialized: boolean = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
      if (!apiKey) {
        throw new Error('MORALIS_API_KEY environment variable is required');
      }

      await Moralis.start({
        apiKey,
      });

      this.initialized = true;
      console.log('✅ Moralis initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Moralis:', error);
      throw error;
    }
  }

  async createToken(params: MoralisTokenParams): Promise<MoralisTokenResult> {
    try {
      await this.initialize();

      console.log('🚀 Creating token with Moralis:', params);

      // Use Moralis Web3 API for token deployment
      const options = {
        chain: this.getChainId(params.network),
        contractParams: {
          name: params.name,
          symbol: params.symbol,
          totalSupply: params.supply,
          decimals: params.decimals,
          owner: params.ownerAddress,
          mintable: params.mintable || false,
          burnable: params.burnable || false,
          pausable: params.pausable || false,
        },
      };

      // Deploy token contract using Moralis
      const response = await Moralis.EvmApi.token.deployToken(options);

      if (response.result) {
        const tokenAddress = response.result.contractAddress;
        const transactionHash = response.result.transactionHash;
        
        return {
          success: true,
          tokenAddress,
          transactionHash,
          explorer_url: this.getExplorerUrl(params.network, tokenAddress),
        };
      }

      return {
        success: false,
        error: 'Token deployment failed - no result returned',
      };

    } catch (error) {
      console.error('❌ Moralis token creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async uploadMetadata(params: Pick<MoralisTokenParams, 'name' | 'symbol' | 'description' | 'image'>): Promise<string> {
    try {
      await this.initialize();

      const metadata = {
        name: params.name,
        symbol: params.symbol,
        description: params.description || `${params.name} (${params.symbol}) token`,
        image: params.image || 'https://via.placeholder.com/200?text=Token+Logo',
      };

      // Upload metadata to IPFS using Moralis
      const response = await Moralis.EvmApi.ipfs.uploadFolder({
        abi: [metadata],
      });

      if (response.result && response.result.length > 0) {
        return response.result[0].path;
      }

      throw new Error('Failed to upload metadata to IPFS');
    } catch (error) {
      console.error('❌ Failed to upload metadata:', error);
      throw error;
    }
  }

  private getChainId(network: string): string {
    const chainIds = {
      ethereum: '0x1',
      polygon: '0x89',
      bsc: '0x38',
      arbitrum: '0xa4b1',
      base: '0x2105',
    };
    return chainIds[network as keyof typeof chainIds] || chainIds.polygon;
  }

  private getExplorerUrl(network: string, address: string): string {
    const explorers = {
      ethereum: `https://etherscan.io/token/${address}`,
      polygon: `https://polygonscan.com/token/${address}`,
      bsc: `https://bscscan.com/token/${address}`,
      arbitrum: `https://arbiscan.io/token/${address}`,
      base: `https://basescan.org/token/${address}`,
    };
    return explorers[network as keyof typeof explorers] || `https://polygonscan.com/token/${address}`;
  }

  async getTokenInfo(tokenAddress: string, network: string) {
    try {
      await this.initialize();

      const response = await Moralis.EvmApi.token.getTokenMetadata({
        chain: this.getChainId(network),
        addresses: [tokenAddress],
      });

      return response.result[0];
    } catch (error) {
      console.error('❌ Failed to get token info:', error);
      throw error;
    }
  }

  async validateTokenAddress(tokenAddress: string, network: string): Promise<boolean> {
    try {
      const tokenInfo = await this.getTokenInfo(tokenAddress, network);
      return !!tokenInfo;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const moralisDeployment = new MoralisTokenDeployment();

// Helper function for easy token creation
export async function createTokenWithMoralis(params: MoralisTokenParams): Promise<MoralisTokenResult> {
  return moralisDeployment.createToken(params);
}

// Helper function for metadata upload
export async function uploadTokenMetadata(
  params: Pick<MoralisTokenParams, 'name' | 'symbol' | 'description' | 'image'>
): Promise<string> {
  return moralisDeployment.uploadMetadata(params);
}