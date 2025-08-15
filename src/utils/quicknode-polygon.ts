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
  liquidityPool?: {
    created: boolean;
    maticAmount?: string;
    tokenAmount?: string;
    txHash?: string;
  };
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
    
    // Pre-compute gas budget and LP amounts to support percent-based platform fee
    const gasBudgetMatic = parseFloat(
      process.env.NEXT_PUBLIC_POLYGON_GAS_MATIC_ESTIMATE || (params.createLiquidity ? '0.50' : '0.30')
    );
    const lpMatic = params.createLiquidity && params.liquidityMaticAmount ? params.liquidityMaticAmount : 0;
    const platformFeeMode = (process.env.NEXT_PUBLIC_PLATFORM_FEE_MODE || 'percent').toLowerCase();
    const platformFeePct = parseFloat(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT || '0.05'); // 5% default
    const platformFeeMin = parseFloat(process.env.NEXT_PUBLIC_PLATFORM_FEE_MIN_MATIC || '0.01');

    const baseForPercent = (isNaN(gasBudgetMatic) ? 0 : gasBudgetMatic) + (lpMatic || 0);
    const feeByPercent = Math.max(baseForPercent * platformFeePct, platformFeeMin);
    const feeByRetention = parseFloat(calculatePolygonServiceFee(retentionPercentage));
    const serviceFeeAmount = platformFeeMode === 'percent' ? feeByPercent.toFixed(6) : feeByRetention.toFixed(6);
    const serviceFeeWei = ethers.parseUnits(serviceFeeAmount, 18);
    // Service wallet that should RECEIVE the fees (your business wallet)
    // Resolve the service/deployer wallet address from available envs (prefer NEXT_PUBLIC_* in client)
    const serviceWalletCandidates = [
      process.env.NEXT_PUBLIC_SERVICE_WALLET_ADDRESS,            // preferred explicit var
      process.env.NEXT_PUBLIC_SERVICE_PUBLIC_WALLET,             // user's naming variant
      process.env.NEXT_PUBLIC_SERVICE_PUBLIC_KEY,                // user's naming variant
      process.env.NEXT_PUBLIC_POLYGON_FEE_RECIPIENT_ADDRESS,     // fallback (must match deployer for LP)
      // Non-public var only available server-side; usually undefined in browser builds
      process.env.SERVICE_PUBLIC_KEY
    ].filter(Boolean) as string[];

    if (serviceWalletCandidates.length === 0) {
      throw new Error('Service wallet address not configured. Set NEXT_PUBLIC_SERVICE_WALLET_ADDRESS (or NEXT_PUBLIC_SERVICE_PUBLIC_WALLET / NEXT_PUBLIC_SERVICE_PUBLIC_KEY), or align NEXT_PUBLIC_POLYGON_FEE_RECIPIENT_ADDRESS with the deployer wallet.');
    }

    let checksummedServiceWallet: string;
    try {
      checksummedServiceWallet = ethers.getAddress(serviceWalletCandidates[0]!);
    } catch {
      throw new Error(`Invalid service wallet address: ${serviceWalletCandidates[0]}`);
    }
    
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
    
    // Step 2: Collect gas budget from user (customer pays gas)
    if (isNaN(gasBudgetMatic) || gasBudgetMatic <= 0) {
      throw new Error('Invalid NEXT_PUBLIC_POLYGON_GAS_MATIC_ESTIMATE');
    }
    progressCallback?.(3, `Collecting ${gasBudgetMatic} MATIC as gas budget...`);
    const gasBudgetWei = ethers.parseUnits(gasBudgetMatic.toString(), 18);
    const gasBudgetTx = await signer.sendTransaction({
      to: checksummedServiceWallet,
      value: gasBudgetWei,
      gasLimit: 21000,
      gasPrice: gasPrice
    });
    console.log('✅ Gas budget payment sent to service wallet:', checksummedServiceWallet, gasBudgetTx.hash);
    // Wait for 1 confirmation so funds are actually spendable by service wallet
    try {
      progressCallback?.(3, 'Waiting for gas budget confirmation...');
      await provider.waitForTransaction(gasBudgetTx.hash, 1);
    } catch {}
    
    // Step 3: Collect LP MATIC from user if LP creation is requested
    if (params.createLiquidity && params.liquidityMaticAmount && params.liquidityMaticAmount > 0) {
      progressCallback?.(4, `Collecting ${params.liquidityMaticAmount} MATIC for LP creation...`);
      
      // Add delay to avoid RPC rate limiting
      console.log('⏳ Waiting 3 seconds to avoid rate limiting...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const lpMaticWei = ethers.parseUnits(params.liquidityMaticAmount.toString(), 18);
      console.log(`💰 Collecting LP MATIC: ${params.liquidityMaticAmount} MATIC`);
      
      let lpPaymentTx;
      let attempt = 0;
      const maxAttempts = 3;
      
      while (attempt < maxAttempts) {
        try {
          lpPaymentTx = await signer.sendTransaction({
            to: checksummedServiceWallet,
            value: lpMaticWei,
            gasLimit: 21000,
            gasPrice: gasPrice
          });
          break; // Success
        } catch (error: any) {
          attempt++;
          if (error.code === -32603 || error.message?.includes('Internal JSON-RPC error')) {
            if (attempt < maxAttempts) {
              const delay = 2000 * attempt; // 2s, 4s, 6s
              console.log(`⏳ RPC error, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          throw error;
        }
      }
      
      if (!lpPaymentTx) {
        throw new Error('Failed to send LP MATIC payment after retries');
      }
      
      console.log('✅ LP MATIC payment sent to service wallet:', checksummedServiceWallet, lpPaymentTx.hash);
      // Wait for 1 confirmation so service wallet can wrap and LP
      try {
        progressCallback?.(4, 'Waiting for LP MATIC confirmation...');
        await provider.waitForTransaction(lpPaymentTx.hash, 1);
      } catch {}
    }
    
    // DON'T wait for confirmation - continue immediately to avoid hanging
    console.log('⏭️ Continuing to deployment without waiting for confirmations');
    
    progressCallback?.(5, 'Deploying token via QuickNode Function...');
    
    // Call secure API route that handles QuickNode Function with server-side secrets
    const apiPayload = {
      tokenName: params.name,
      tokenSymbol: params.symbol,
      totalSupply: params.totalSupply || 1000000000,
      userAddress: userAddress,
      revokeUpdateAuthority: params.revokeUpdateAuthority || false,
      revokeMintAuthority: params.revokeMintAuthority || false,
      retentionPercentage: retentionPercentage,  // FIX: Add retentionPercentage to API payload
      // LP Creation parameters
      createLiquidity: params.createLiquidity || false,
      liquidityMaticAmount: params.liquidityMaticAmount || 0
    };

    console.log('🚀 Calling secure API route for QuickNode deployment...');
    console.log('📤 Payload being sent:', JSON.stringify(apiPayload, null, 2));

    // Add timeout to prevent hanging (increased for LP creation)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for LP creation

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
        throw new Error('QuickNode deployment timed out after 2 minutes');
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
    
    progressCallback?.(5, 'Token deployment completed!');
    
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