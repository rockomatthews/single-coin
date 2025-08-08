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
    // Service wallet that should RECEIVE the fees (your business wallet)
    const checksummedServiceWallet = ethers.getAddress('0x57585874DBf39B18df1AD2b829F18D6BFc2Ceb4b'); // Service wallet receives fees
    
    console.log(`💰 Collecting service fee: ${serviceFeeAmount} MATIC`);
    
    // Use static gas price to completely avoid RPC getFeeData/getGasPrice compatibility issues
    const gasPrice = ethers.parseUnits('50', 'gwei'); // Safe gas price for Polygon
    
    console.log(`⛽ Using legacy gas pricing:`);
    console.log(`  gasPrice: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
    
    const feePaymentTx = await signer.sendTransaction({
      to: checksummedServiceWallet,
      value: serviceFeeWei,
      gasLimit: 21000,
      gasPrice: gasPrice
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
      revokeMintAuthority: params.revokeMintAuthority || false,
      retentionPercentage: retentionPercentage  // FIX: Add retentionPercentage to API payload
    };

    console.log('🚀 Calling secure API route for QuickNode deployment...');
    console.log('📤 Payload being sent:', JSON.stringify(apiPayload, null, 2));

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let result;
    try {
      console.log('🌐 Making secure API call to /api/quicknode-deploy...');

      const response = await fetch('/api/quicknode-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('📡 API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error response:', errorData);
        throw new Error(errorData.error || `API call failed: ${response.status}`);
      }

      result = await response.json();
      console.log('✅ QuickNode deployment result:', result);

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('💥 Secure API call failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('QuickNode deployment timed out after 30 seconds');
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