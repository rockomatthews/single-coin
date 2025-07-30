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

// QuickNode Functions API configuration - CORRECT API FORMAT
const QUICKNODE_FUNCTION_ID = '6e7e0949-40ec-4fe2-be32-46419dfe246c';
const QUICKNODE_FUNCTION_URL = `https://api.quicknode.com/functions/rest/v1/functions/${QUICKNODE_FUNCTION_ID}/call`;
const QUICKNODE_API_KEY = process.env.NEXT_PUBLIC_QUICKNODE_API_KEY;

// Remove local env checking - this runs on Vercel with real API key

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
    
    // Call secure API route that handles QuickNode Function with server-side secrets
    const apiPayload = {
      tokenName: params.name,
      tokenSymbol: params.symbol,
      totalSupply: params.totalSupply || 1000000000,
      userAddress: userAddress,
      revokeUpdateAuthority: params.revokeUpdateAuthority || false,
      revokeMintAuthority: params.revokeMintAuthority || false
    };
    
    console.log('🚀 Calling secure API route for QuickNode deployment...');
    console.log('📤 Payload being sent:', JSON.stringify(apiPayload, null, 2));
    
    // Vercel deployment - API key should be set in Vercel environment variables
    console.log('🚀 Starting QuickNode API call on Vercel...');
    console.log('🔑 API Key present:', !!QUICKNODE_API_KEY);
    console.log('🎯 Function URL:', QUICKNODE_FUNCTION_URL);
    
    if (!QUICKNODE_API_KEY) {
      throw new Error('QuickNode API key not found in Vercel environment variables');
    }
    
    // Add timeout to prevent hanging - use REAL API call now
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for debugging
    
    let result;
    try {
      console.log('🌐 Making QuickNode API request on Vercel...');
      console.log('📤 Payload being sent:', JSON.stringify(functionPayload, null, 2));
      
      const response = await fetch(QUICKNODE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': QUICKNODE_API_KEY,
        },
        body: JSON.stringify({
          network: 'polygon-mainnet',
          user_data: functionPayload
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('📡 QuickNode response status:', response.status);
      console.log('📋 QuickNode response headers:', Object.fromEntries(response.headers.entries()));
    
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ QuickNode error response:', errorText);
        throw new Error(`QuickNode Function call failed: ${response.status} ${errorText}`);
      }
      
      const fullResponse = await response.json();
      console.log('📡 Full QuickNode Function response:', fullResponse);
      
      // Extract the actual function result from the response structure
      if (fullResponse.execution && fullResponse.execution.result) {
        result = fullResponse.execution.result;
        console.log('✅ Extracted function result:', result);
      } else {
        result = fullResponse;
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('💥 QuickNode API call failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('QuickNode Function call timed out after 10 seconds - check your API key and function status');
      }
      throw error instanceof Error ? error : new Error(String(error));
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