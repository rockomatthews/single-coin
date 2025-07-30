import { PolygonTokenParams } from './polygon';

interface QuickNodeDeploymentResult {
  success: boolean;
  contractAddress?: string;
  deploymentTxHash?: string;
  securityTxHashes?: string[];
  userTokenBalance?: string;
  explorerUrl?: string;
  message?: string;
  error?: string;
}

// QuickNode Functions API configuration - the WORKING function endpoint
const QUICKNODE_FUNCTION_URL = 'https://api.quicknode.com/functions/rest/v1/functions/6e7e0949-40ec-4fe2-be32-46419dfe246c/call';
const QUICKNODE_API_KEY = process.env.NEXT_PUBLIC_QUICKNODE_API_KEY;

export async function deployTokenViaQuickNodeFunction(
  userAddress: string,
  params: PolygonTokenParams,
  progressCallback?: (step: number, message: string) => void
): Promise<QuickNodeDeploymentResult> {
  try {
    progressCallback?.(1, 'Connecting to MetaMask for service fee...');
    
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    // Ensure we're on Polygon network
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }], // Polygon mainnet
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x89',
            chainName: 'Polygon Mainnet',
            rpcUrls: ['https://polygon-rpc.com/'],
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18,
            },
            blockExplorerUrls: ['https://polygonscan.com/'],
          }],
        });
      }
    }

    progressCallback?.(2, 'Collecting service fee...');
    
    // Calculate and collect service fee first
    const { ethers } = await import('ethers');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    const retentionPercentage = params.retentionPercentage || 20;
    const serviceFeeAmount = calculatePolygonServiceFee(retentionPercentage);
    const serviceFeeWei = ethers.parseUnits(serviceFeeAmount, 18);
    const checksummedServiceWallet = ethers.getAddress('0x742d35cc6634c0532925a3b8d900b3deb4ce6234');
    
    console.log(`💰 Collecting service fee: ${serviceFeeAmount} MATIC`);
    
    const feePaymentTx = await signer.sendTransaction({
      to: checksummedServiceWallet,
      value: serviceFeeWei,
      gasLimit: 21000,
      gasPrice: ethers.parseUnits('50', 'gwei')
    });
    
    console.log('✅ Service fee payment sent:', feePaymentTx.hash);
    
    // DON'T wait for confirmation - continue immediately to avoid hanging
    console.log('⏭️ Continuing to deployment without waiting for fee confirmation');
    
    progressCallback?.(3, 'Deploying token via QuickNode Function...');
    
    // Call QuickNode Function for deployment - let the function use its own env vars
    const functionPayload = {
      tokenName: params.name,
      tokenSymbol: params.symbol,
      totalSupply: (params.totalSupply || 1000000000).toString(),
      userAddress: userAddress,
      revokeUpdateAuthority: params.revokeUpdateAuthority || false,
      revokeMintAuthority: params.revokeMintAuthority || false
      // Don't pass private keys from browser - QuickNode function has its own env vars
    };
    
    console.log('🚀 Calling QuickNode Function with payload:', functionPayload);
    
    if (!QUICKNODE_API_KEY) {
      throw new Error('QuickNode API key not configured');
    }
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let result;
    try {
      const response = await fetch(QUICKNODE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': QUICKNODE_API_KEY,
        },
        body: JSON.stringify({
          user_data: functionPayload
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`QuickNode Function call failed: ${response.status} ${errorText}`);
      }
      
      result = await response.json();
      console.log('📡 QuickNode Function response:', result);
      
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('QuickNode Function call timed out after 30 seconds');
      }
      throw error;
    }
    
    progressCallback?.(4, 'Token deployment completed!');
    
    if (result.success) {
      console.log('✅ Token deployed successfully via QuickNode!');
      console.log('📍 Contract Address:', result.contractAddress);
      console.log('🔗 Transaction Hash:', result.deploymentTxHash);
      console.log('🔗 View on Polygonscan:', result.explorerUrl);
      
      return {
        success: true,
        contractAddress: result.contractAddress,
        deploymentTxHash: result.deploymentTxHash,
        securityTxHashes: result.securityTxHashes || [],
        userTokenBalance: result.userTokenBalance,
        explorerUrl: result.explorerUrl,
        message: result.message
      };
    } else {
      throw new Error(result.error || 'QuickNode Function deployment failed');
    }
    
  } catch (error) {
    console.error('❌ QuickNode deployment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Service fee calculation (same as before)
function calculatePolygonServiceFee(retentionPercentage: number): string {
  if (retentionPercentage <= 5) {
    const fee = 0.001 + (retentionPercentage / 5) * 0.009;
    return fee.toFixed(6);
  } else if (retentionPercentage <= 25) {
    const normalizedRetention = (retentionPercentage - 5) / 20;
    const fee = 0.01 + (normalizedRetention * normalizedRetention * 79.99);
    return fee.toFixed(4);
  } else {
    const normalizedRetention = (retentionPercentage - 25) / 75;
    const fee = 80 + (normalizedRetention * normalizedRetention * 420);
    return fee.toFixed(2);
  }
}

export { calculatePolygonServiceFee };