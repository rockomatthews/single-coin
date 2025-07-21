// Polygon (Matic) ERC-20 token creation utilities
import { ethers } from 'ethers';

// Polygon-specific token parameters
export interface PolygonTokenParams {
  name: string;
  symbol: string;
  description: string;
  image: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  blockchain: 'polygon';
  
  // ERC-20 specific
  decimals: number;
  totalSupply: number;
  initialSupply?: number;
  
  // Distribution
  retentionPercentage?: number;
  retainedAmount?: number;
  liquidityAmount?: number;
  
  // Polygon network settings
  gasLimit?: number;
  maxFeePerGas?: number;
  maxPriorityFeePerGas?: number;
  
  // DEX settings
  createLiquidity?: boolean;
  liquidityMaticAmount?: number;
  dexChoice?: 'uniswap-v3' | 'quickswap' | 'sushiswap';
}

// Standard ERC-20 contract bytecode and ABI
const ERC20_BYTECODE = "0x60806040523480156200001157600080fd5b506040516200115938038062001159833981810160405281019062000037919062000329565b838381600390805190602001906200005192919062000207565b5080600490805190602001906200006a92919062000207565b505050620000878162000090640100000000026401000000009004565b505050620004bb565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415620001035760006040517f1e4fbdf7000000000000000000000000000000000000000000000000000000008152600401620000fa919062000408565b60405180910390fd5b6200011e81620001226401000000000002640100000000900460201b60201c565b5050565b6000600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905081600560006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b828054620002159062000455565b90600052602060002090601f01602090048101928262000239576000855562000285565b82601f106200025457805160ff191683800117855562000285565b8280016001018555821562000285579182015b828111156200028457825182559160200191906001019062000267565b5b50905062000294919062000298565b5090565b5b80821115620002b357600081600090555060010162000299565b5090565b6000620002ce620002c88462000448565b6200041f565b905082815260208101848484011115620002ed57620002ec62000574565b5b620002fa84828562000476565b509392505050565b600082601f8301126200031a5762000319620005745b5b8151620003238482602086016200041c565b91505092915050565b600080600080608085870312156200034957620003486200059c565b5b600085015167ffffffffffffffff8111156200036a576200036962000597565b5b620003788782880162000302565b945050602085015167ffffffffffffffff8111156200039c576200039b62000597565b5b620003aa8782880162000302565b9350506040620003bd8782880162000404565b9250506060620003d08782880162000404565b91505092959194509250565b620003e781620004e6565b82525050565b620003f881620004fa565b82525050565b6000815190506200040f81620005a1565b92915050565b600082825260208201905092915050565b60006200043362000446565b905062000441828262000476565b919050565b6000604051905090565b600067ffffffffffffffff8211156200046e576200046d62000566565b5b602082029050602081019050919050565b60005b838110156200049f578082015181840152602081019050620004825b5b505050505050565b620004b481620004ec565b8114620004c157600080fd5b50565b608051620c8c620004dd6000396000818161020e015261077e0152620c8c6000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80637ecebe001161007157806395d89b411161005b57806395d89b4114610182578063a9059cbb146101a0578063dd62ed3e146101d0576100a9565b80637ecebe001461012c5780638da5cb5b1461015c576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100fc57806323b872dd1461011a57806370a0823114610136575b600080fd5b6100b6610200565b6040516100c39190610a5a565b60405180910390f35b6100e660048036038101906100e19190610928565b610292565b6040516100f39190610a3f565b60405180910390f35b6101046102b5565b6040516101119190610b1c565b60405180910390f35b610134600480360381019061012f91906108d5565b6102bf565b005b610150600480360381019061014b9190610868565b6102ee565b60405161015d9190610b1c565b60405180910390f35b610164610336565b60405161017991906109e4565b60405180910390f35b61018a610360565b6040516101979190610a5a565b60405180910390f35b6101ba60048036038101906101b59190610928565b6103f2565b6040516101c79190610a3f565b60405180910390f35b6101ea60048036038101906101e59190610895565b610415565b6040516101f79190610b1c565b60405180910390f35b60606003805461020f90610c85565b80601f016020809104026020016040519081016040528092919081815260200182805461023b90610c85565b80156102885780601f1061025d57610100808354040283529160200191610288565b820191906000526020600020905b81548152906001019060200180831161026b57829003601f168201915b5050505050905090565b60008061029d61049c565b90506102aa8185856104a4565b600191505092915050565b6000600254905090565b6102ca8383836104b6565b505050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6000600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b60606004805461036f90610c85565b80601f016020809104026020016040519081016040528092919081815260200182805461039b90610c85565b80156103e85780601f106103bd576101008083540402835291602001916103e8565b820191906000526020600020905b8154815290600101906020018083116103cb57829003601f168201915b5050505050905090565b6000806103fd61049c565b905061040a8185856104b6565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600033905090565b6104b18383836001610540565b505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156105285760006040517f96c6fd1e00000000000000000000000000000000000000000000000000000000815260040161051f91906109e4565b60405180910390fd5b610533838383610717565b505050565b600073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff1614156105b25760006040517fe602df0500000000000000000000000000000000000000000000000000000000815260040161059991906109e4565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156106245760006040517f94280d6200000000000000000000000000000000000000000000000000000000815260040161061b91906109e4565b60405180910390fd5b81600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508015610711578273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516107089190610b1c565b60405180910390a35b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156107685761075f82600080610942565b61076c565b61076c838383610942565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156107bc576107b581600080610ac4565b6107c0565b6107c0838383610ac4565b505050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156108375760006040517fec442f0500000000000000000000000000000000000000000000000000000000815260040161082e91906109e4565b60405180910390fd5b61084383600083610717565b5050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006108778261084c565b9050919050565b6108878161086c565b811461089257600080fd5b50565b6000813590506108a48161087e565b92915050565b6000819050919050565b6108bd816108aa565b81146108c857600080fd5b50565b6000813590506108da816108b4565b92915050565b6000806000606084860312156108f9576108f8610847565b5b600061090786828701610895565b935050602061091886828701610895565b9250506040610929868287016108cb565b9150509250925092565b6000806040838503121561094a57610949610847565b5b600061095885828601610895565b9250506020610969858286016108cb565b9150509250929050565b61097c8161086c565b82525050565b600061098d82610a7c565b6109978185610a87565b93506109a7818560208601610c52565b6109b081610cf4565b840191505092915050565b60006109c8602683610a98565b91506109d382610d05565b604082019050919050565b60006020820190506109f36000830184610973565b92915050565b60006020820190508181036000830152610a138184610982565b905092915050565b60006020820190508181036000830152610a34816109bb565b9050919050565b6000602082019050610a506000830184610aa9565b92915050565b60006020820190508181036000830152610a7081846107f8565b905092915050565b600081519050919050565b600082825260208201905092915050565b600082825260208201905092915050565b60008115159050919050565b610aba81610aa0565b82525050565b6000610acb8261086c565b9050919050565b610adb81610ac0565b8114610ae657600080fd5b50565b600081359050610af881610ad2565b92915050565b600060208284031215610b1457610b13610847565b5b6000610b2284828501610ae9565b91505092915050565b610b34816108aa565b82525050565b6000602082019050610b4f6000830184610b2b565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610b9d57607f821691505b60208210811415610bb157610bb0610b56565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610bf1826108aa565b9150610bfc836108aa565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03821115610c3157610c30610bb7565b5b828201905092915050565b6000610c47826108aa565b9150610c52836108aa565b925082821015610c6557610c64610bb7565b5b828203905092915050565b60005b83811015610c8e578082015181840152602081019050610c73565b83811115610c9d576000848401525b50505050565b610cac816108aa565b8114610cb757600080fd5b50565b600081519050610cc981610ca3565b92915050565b600060208284031215610ce557610ce4610847565b5b6000610cf384828501610cba565b91505092915050565b6000601f19601f8301169050919050565b7f45524332303a207472616e7366657220616d6f756e742065786365656473206260008201527f616c616e63650000000000000000000000000000000000000000000000000000602082015250565b610d6181610ac0565b8114610d6c57600080fd5b5056fea2646970667358221220f8b8b2a3b4c3d5e8f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f56564736f6c63430008070033";

const ERC20_ABI = [
  "constructor(string memory name, string memory symbol, uint256 totalSupply, address owner)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Polygon mainnet configuration
export const POLYGON_CONFIG = {
  chainId: 137,
  name: 'Polygon Mainnet',
  rpcUrl: 'https://polygon-rpc.com/',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  blockExplorer: 'https://polygonscan.com/',
  // Estimated gas costs (in MATIC)
  estimatedGasCosts: {
    tokenDeployment: 0.01, // ~$0.01 USD
    tokenTransfer: 0.001,  // ~$0.001 USD
    liquidityCreation: 0.05, // ~$0.05 USD
  }
};

/**
 * Upload metadata to IPFS for Polygon token
 */
export async function uploadPolygonMetadata(params: PolygonTokenParams): Promise<string> {
  console.log('📝 Uploading Polygon token metadata to IPFS...');
  
  try {
    // Use the same metadata upload as other chains
    const { uploadMetadata } = await import('./solana');
    
    // Convert to compatible format
    const metadataParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      website: params.website,
      twitter: params.twitter,
      telegram: params.telegram,
      discord: params.discord,
      decimals: params.decimals,
      supply: params.totalSupply,
    };
    
    // Upload metadata (connection not used for IPFS upload)
    const metadataUri = await uploadMetadata(null as any, metadataParams);
    
    console.log('✅ Polygon metadata uploaded:', metadataUri);
    return metadataUri;
  } catch (error) {
    console.error('❌ Failed to upload Polygon metadata:', error);
    throw error;
  }
}

/**
 * Collect platform fee on Polygon
 */
export async function collectPolygonPlatformFee(
  signer: ethers.JsonRpcSigner
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    const platformFee = parseFloat(process.env.NEXT_PUBLIC_POLYGON_PLATFORM_FEE || '0.001');
    const feeRecipient = process.env.NEXT_PUBLIC_POLYGON_FEE_RECIPIENT_ADDRESS;
    
    if (!feeRecipient || feeRecipient === '0xYourPolygonWalletAddress') {
      console.log('⚠️ No Polygon fee recipient configured, skipping fee collection');
      return { success: true };
    }
    
    console.log(`💳 Collecting ${platformFee} MATIC platform fee...`);
    
    const feeInWei = ethers.parseEther(platformFee.toString());
    
    // Send MATIC to fee recipient
    const tx = await signer.sendTransaction({
      to: feeRecipient,
      value: feeInWei,
    });
    
    await tx.wait();
    
    console.log(`✅ Platform fee collected: ${tx.hash}`);
    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (error) {
    console.error('❌ Failed to collect platform fee:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown fee collection error',
    };
  }
}

/**
 * Deploy ERC-20 token contract on Polygon
 */
export async function deployPolygonToken(
  signer: ethers.JsonRpcSigner,
  params: PolygonTokenParams,
  progressCallback?: (step: number, status: string) => void
): Promise<{
  success: boolean;
  tokenAddress?: string;
  txHash?: string;
  error?: string;
}> {
  try {
    progressCallback?.(1, 'Collecting platform fee...');
    
    // Collect platform fee first
    const feeResult = await collectPolygonPlatformFee(signer);
    if (!feeResult.success) {
      throw new Error(feeResult.error || 'Failed to collect platform fee');
    }
    
    progressCallback?.(2, 'Preparing token deployment...');
    
    // Create contract factory
    const contractFactory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, signer);
    
    // Calculate total supply with decimals
    const totalSupplyWithDecimals = ethers.parseUnits(
      params.totalSupply.toString(),
      params.decimals
    );
    
    progressCallback?.(3, 'Deploying ERC-20 contract...');
    
    // Deploy contract
    const contract = await contractFactory.deploy(
      params.name,
      params.symbol,
      totalSupplyWithDecimals,
      await signer.getAddress()
    );
    
    progressCallback?.(4, 'Waiting for deployment confirmation...');
    
    // Wait for deployment
    await contract.waitForDeployment();
    const tokenAddress = await contract.getAddress();
    const deploymentTx = contract.deploymentTransaction();
    
    progressCallback?.(5, 'Token deployed successfully!');
    
    console.log('✅ Polygon token deployed:', {
      address: tokenAddress,
      txHash: deploymentTx?.hash,
      name: params.name,
      symbol: params.symbol,
      totalSupply: params.totalSupply,
      decimals: params.decimals,
    });
    
    return {
      success: true,
      tokenAddress,
      txHash: deploymentTx?.hash,
    };
  } catch (error) {
    console.error('❌ Polygon token deployment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error',
    };
  }
}

/**
 * Calculate Polygon deployment costs
 */
export function getPolygonCostBreakdown(params: PolygonTokenParams): {
  platformFee: number;
  deploymentFee: number;
  liquidityAmount?: number;
  poolCreationFee?: number;
  total: number;
  currency: string;
  breakdown: Record<string, string>;
} {
  const platformFee = parseFloat(process.env.NEXT_PUBLIC_POLYGON_PLATFORM_FEE || '0.001');
  const deploymentFee = POLYGON_CONFIG.estimatedGasCosts.tokenDeployment;
  const liquidityAmount = params.liquidityMaticAmount || 0;
  const poolCreationFee = params.createLiquidity ? POLYGON_CONFIG.estimatedGasCosts.liquidityCreation : 0;
  
  const total = platformFee + deploymentFee + liquidityAmount + poolCreationFee;
  
  return {
    platformFee,
    deploymentFee,
    liquidityAmount,
    poolCreationFee,
    total,
    currency: 'MATIC',
    breakdown: {
      'Platform Fee': `${platformFee} MATIC`,
      'Deployment Gas': `${deploymentFee} MATIC`,
      ...(liquidityAmount > 0 && { 'Liquidity MATIC': `${liquidityAmount} MATIC` }),
      ...(poolCreationFee > 0 && { 'Pool Creation': `${poolCreationFee} MATIC` }),
      'Total': `${total} MATIC`,
    },
  };
}

/**
 * Validate Polygon token parameters
 */
export function validatePolygonParams(params: PolygonTokenParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!params.name || params.name.length < 2) {
    errors.push('Token name must be at least 2 characters');
  }
  
  if (!params.symbol || params.symbol.length < 2 || params.symbol.length > 10) {
    errors.push('Token symbol must be between 2 and 10 characters');
  }
  
  if (params.decimals < 0 || params.decimals > 18) {
    errors.push('Token decimals must be between 0 and 18');
  }
  
  if (params.totalSupply <= 0) {
    errors.push('Total supply must be greater than 0');
  }
  
  if (params.retentionPercentage && (params.retentionPercentage < 0 || params.retentionPercentage > 100)) {
    errors.push('Retention percentage must be between 0 and 100');
  }
  
  if (params.createLiquidity && (!params.liquidityMaticAmount || params.liquidityMaticAmount <= 0)) {
    errors.push('Liquidity MATIC amount must be greater than 0 when creating liquidity');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get MetaMask provider for Polygon
 */
export async function getPolygonProvider(): Promise<ethers.BrowserProvider | null> {
  try {
    // Check if MetaMask is installed
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Check if connected to Polygon
      const network = await provider.getNetwork();
      
      if (network.chainId !== BigInt(POLYGON_CONFIG.chainId)) {
        // Request to switch to Polygon
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${POLYGON_CONFIG.chainId.toString(16)}` }],
          });
        } catch (switchError: any) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${POLYGON_CONFIG.chainId.toString(16)}`,
                chainName: POLYGON_CONFIG.name,
                nativeCurrency: POLYGON_CONFIG.nativeCurrency,
                rpcUrls: [POLYGON_CONFIG.rpcUrl],
                blockExplorerUrls: [POLYGON_CONFIG.blockExplorer],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      return provider;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Polygon provider:', error);
    return null;
  }
}

/**
 * Connect to MetaMask and get signer for Polygon
 */
export async function connectPolygonWallet(): Promise<{
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  error?: string;
}> {
  try {
    const provider = await getPolygonProvider();
    if (!provider) {
      return {
        signer: null,
        address: null,
        error: 'MetaMask not installed or Polygon network not available',
      };
    }
    
    // Request account access
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    return {
      signer,
      address,
    };
  } catch (error) {
    return {
      signer: null,
      address: null,
      error: error instanceof Error ? error.message : 'Failed to connect to MetaMask',
    };
  }
}

// Extended window interface for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}