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
    const checksummedServiceWallet = ethers.getAddress('0x742d35cc6634c0532925a3b8d900b3deb4ce6234');
    
    console.log(`💰 Collecting service fee: ${serviceFeeAmount} MATIC`);
    
    // Use EIP-1559 gas pricing for Polygon to ensure execution
    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas * 150n / 100n : ethers.parseUnits('50', 'gwei');
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * 150n / 100n : ethers.parseUnits('2', 'gwei');
    
    console.log(`⛽ Using EIP-1559 gas:`);
    console.log(`  maxFeePerGas: ${ethers.formatUnits(maxFeePerGas, 'gwei')} gwei`);
    console.log(`  maxPriorityFeePerGas: ${ethers.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei`);
    
    const feePaymentTx = await signer.sendTransaction({
      to: checksummedServiceWallet,
      value: serviceFeeWei,
      gasLimit: 21000,
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas
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