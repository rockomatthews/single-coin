import { PolygonTokenParams } from './polygon';

interface HardhatDeploymentResult {
  success: boolean;
  tokenAddress?: string;
  txHash?: string;
  securityTxHash?: string;
  error?: string;
}

export async function deployPolygonTokenWithHardhat(
  userAddress: string,
  params: PolygonTokenParams,
  progressCallback?: (step: number, message: string) => void
): Promise<HardhatDeploymentResult> {
  try {
    progressCallback?.(1, 'Preparing Hardhat deployment...');
    
    const deploymentRequest = {
      name: params.name,
      symbol: params.symbol,
      totalSupply: params.totalSupply,
      owner: userAddress,
      revokeUpdateAuthority: params.revokeUpdateAuthority,
      revokeMintAuthority: params.revokeMintAuthority
    };
    
    progressCallback?.(2, 'Sending to server...');
    
    const response = await fetch('/api/polygon-hardhat-deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deploymentRequest)
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Server deployment failed');
    }
    
    progressCallback?.(5, 'Deployment completed successfully!');
    
    console.log('✅ Hardhat deployment successful:', result);
    
    return {
      success: true,
      tokenAddress: result.tokenAddress,
      txHash: result.txHash,
      securityTxHash: result.securityTxHash
    };
    
  } catch (error) {
    console.error('❌ Hardhat deployment failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error'
    };
  }
}

export async function deployPolygonTokenWithWallet(
  params: PolygonTokenParams,
  progressCallback?: (step: number, message: string) => void
): Promise<HardhatDeploymentResult> {
  try {
    // Get wallet address from MetaMask
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    
    progressCallback?.(1, 'Connecting to MetaMask...');
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Get the user's address for the owner parameter
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const userAddress = accounts[0];
    
    if (!userAddress) {
      throw new Error('No MetaMask account found');
    }
    
    // Note: For Hardhat deployment with MetaMask, we need the private key
    // In a production environment, you'd handle this more securely
    throw new Error('Hardhat deployment with MetaMask requires private key export. Use the direct ethers.js method instead.');
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}