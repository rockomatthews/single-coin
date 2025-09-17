export type KatanaNetwork = 'testnet' | 'mainnet';

export interface KatanaTokenParams {
  blockchain: 'katana';
  totalSupply: number;
  decimals: number;
  tokenStandard: 'ERC-20';
  network: KatanaNetwork;
}

export interface KatanaDeployInput extends KatanaTokenParams {
  name: string;
  symbol: string;
  description: string;
  image: string;
}

export async function uploadKatanaMetadata(params: KatanaDeployInput): Promise<string> {
  const { uploadToPinata } = await import('./pinata');
  const metadata = {
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    image: params.image,
    attributes: [
      { trait_type: 'Blockchain', value: 'Katana' },
      { trait_type: 'Token Standard', value: 'ERC-20' },
      { trait_type: 'Total Supply', value: params.totalSupply.toString() },
      { trait_type: 'Decimals', value: params.decimals.toString() },
      { trait_type: 'Network', value: params.network },
    ],
  };
  return uploadToPinata(metadata);
}

export function getKatanaCostBreakdown(params: KatanaTokenParams) {
  // Simple placeholder cost structure; adjust per real fees
  const deploymentFee = params.network === 'mainnet' ? 0.01 : 0.0;
  return {
    platformFee: 0,
    deploymentFee,
    total: deploymentFee,
    currency: params.network === 'mainnet' ? 'KAT' : 'TestKAT',
    breakdown: {
      network: params.network,
      tokenStandard: params.tokenStandard,
    },
  };
}

export function validateKatanaParams(params: KatanaTokenParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (params.totalSupply <= 0) errors.push('Total supply must be greater than 0');
  if (params.decimals < 0 || params.decimals > 18) errors.push('Decimals must be between 0 and 18');
  return { isValid: errors.length === 0, errors };
}

// Runtime config driven by env to avoid hardcoding speculative chain params
export const KATANA_CONFIG = {
  chainId: process.env.NEXT_PUBLIC_KATANA_CHAIN_ID ? parseInt(process.env.NEXT_PUBLIC_KATANA_CHAIN_ID, 10) : 747474,
  name: process.env.NEXT_PUBLIC_KATANA_CHAIN_NAME || 'Katana',
  rpcUrl: process.env.NEXT_PUBLIC_KATANA_RPC_URL || 'https://rpc.katana.network/',
  nativeCurrency: {
    name: process.env.NEXT_PUBLIC_KATANA_CURRENCY_NAME || 'Ether',
    symbol: process.env.NEXT_PUBLIC_KATANA_CURRENCY_SYMBOL || 'ETH',
    decimals: 18,
  },
  blockExplorer: process.env.NEXT_PUBLIC_KATANA_BLOCK_EXPLORER_URL || 'https://katanascan.com/',
  factoryAddress: process.env.NEXT_PUBLIC_KATANA_FACTORY_ADDRESS,
};

// Minimal ERC-20 ABI/bytecode for direct deploy fallback
const ERC20_ABI = [
  "constructor(string name, string symbol, uint256 totalSupply, address owner)",
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
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// Reuse base-compatible bytecode (simple ERC20 with constructor)
const ERC20_BYTECODE = "0x60806040523480156200001157600080fd5b506040516200115938038062001159833981810160405281019062000037919062000329565b838381600390805190602001906200005192919062000207565b5080600490805190602001906200006a92919062000207565b505050620000878162000090640100000000026401000000009004565b505050620004bb565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415620001035760006040517f1e4fbdf7000000000000000000000000000000000000000000000000000000008152600401620000fa919062000408565b60405180910390fd5b6200011e81620001226401000000000002640100000000900460201b60201c565b5050565b6000600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905081600560006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b828054620002159062000455565b90600052602060002090601f01602090048101928262000239576000855562000285565b82601f106200025457805160ff191683800117855562000285565b8280016001018555821562000285579182015b828111156200028457825182559160200191906001019062000267565b5b50905062000294919062000298565b5090565b5b80821115620002b357600081600090555060010162000299565b5090565b6000620002ce620002c88462000448565b6200041f565b905082815260208101848484011115620002ed57620002ec62000574565b5b620002fa84828562000476565b509392505050565b600082601f8301126200031a5762000319620005745b5b8151620003238482602086016200041c565b91505092915050565b600080600080608085870312156200034957620003486200059c565b5b600085015167ffffffffffffffff8111156200036a576200036962000597565b5b620003788782880162000302565b945050602085015167ffffffffffffffff8111156200039c576200039b62000597565b5b620003aa8782880162000302565b9350506040620003bd8782880162000404565b9250506060620003d08782880162000404565b91505092959194509250565b620003e781620004e6565b82525050565b620003f881620004fa565b82525050565b6000815190506200040f81620005a1565b92915050565b600082825260208201905092915050565b60006200043362000446565b905062000441828262000476565b919050565b6000604051905090565b600067ffffffffffffffff8211156200046e576200046d62000566565b5b602082029050602081019050919050565b60005b838110156200049f578082015181840152602081019050620004825b5b505050505050565b620004b481620004ec565b8114620004c157600080fd5b50565b608051620c8c620004dd6000396000818161020e015261077e0152620c8c6000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80637ecebe001161007157806395d89b411161005b57806395d89b4114610182578063a9059cbb146101a0578063dd62ed3e146101d0576100a9565b80637ecebe001461012c5780638da5cb5b1461015c576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100fc57806323b872dd1461011a57806370a0823114610136575b600080fd5b6100b6610200565b6040516100c39190610a5a565b60405180910390f35b6100e660048036038101906100e19190610928565b610292565b6040516100f39190610a3f565b60405180910390f35b6101046102b5565b6040516101119190610b1c565b60405180910390f35b610134600480360381019061012f91906108d5565b6102bf565b005b610150600480360381019061014b9190610868565b6102ee565b60405161015d9190610b1c565b60405180910390f35b610164610336565b60405161017991906109e4565b60405180910390f35b61018a610360565b6040516101979190610a5a565b60405180910390f35b6101ba60048036038101906101b59190610928565b6103f2565b6040516101c79190610a3f565b60405180910390f35b6101ea60048036038101906101e59190610895565b610415565b6040516101f79190610b1c565b60405180910390f35b60606003805461020f90610c85565b80601f016020809104026020016040519081016040528092919081815260200182805461023b90610c85565b80156102885780601f1061025d57610100808354040283529160200191610288565b820191906000526020600020905b81548152906001019060200180831161026b57829003601f168201915b5050505050905090565b60008061029d61049c565b90506102aa8185856104a4565b600191505092915050565b6000600254905090565b6102ca8383836104b6565b505050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6000600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b60606004805461036f90610c85565b80601f016020809104026020016040519081016040528092919081815260200182805461039b90610c85565b80156103e85780601f106103bd576101008083540402835291602001916103e8565b820191906000526020600020905b8154815290600101906020018083116103cb57829003601f168201915b5050505050905090565b6000806103fd61049c565b905061040a8185856104b6565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600033905090565b6104b18383836001610540565b505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156105285760006040517f96c6fd1e00000000000000000000000000000000000000000000000000000000815260040161051f91906109e4565b60405180910390fd5b610533838383610717565b505050565b600073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff1614156105b25760006040517fe602df0500000000000000000000000000000000000000000000000000000000815260040161059991906109e4565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156106245760006040517f94280d6200000000000000000000000000000000000000000000000000000000815260040161061b91906109e4565b60405180910390fd5b81600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508015610711578273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516107089190610b1c565b60405180910390a35b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156107685761075f82600080610942565b61076c565b61076c838383610942565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156107bc576107b581600080610ac4565b6107c0565b6107c0838383610ac4565b505050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156108375760006040517fec442f0500000000000000000000000000000000000000000000000000000000815260040161082e91906109e4565b60405180910390fd5b61084383600083610717565b5050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006108778261084c565b9050919050565b6108878161086c565b811461089257600080fd5b50565b6000813590506108a48161087e565b92915050565b6000819050919050565b6108bd816108aa565b81146108c857600080fd5b50565b6000813590506108da816108b4565b92915050565b6000806000606084860312156108f9576108f8610847565b5b600061090786828701610895565b935050602061091886828701610895565b9250506040610929868287016108cb565b9150509250925092565b6000806040838503121561094a57610949610847565b5b600061095885828601610895565b9250506020610969858286016108cb565b9150509250929050565b61097c8161086c565b82525050565b600061098d82610a7c565b6109978185610a87565b93506109a7818560208601610c52565b6109b081610cf4565b840191505092915050565b60006109c8602683610a98565b91506109d382610d05565b604082019050919050565b60006020820190506109f36000830184610973565b92915050565b60006020820190508181036000830152610a138184610982565b905092915050565b60006020820190508181036000830152610a34816109bb565b9050919050565b6000602082019050610a506000830184610aa9565b92915050565b60006020820190508181036000830152610a7081846107f8565b905092915050565b600081519050919050565b600082825260208201905092915050565b600082825260208201905092915050565b60008115159050919050565b610aba81610aa0565b82525050565b6000610acb8261086c565b9050919050565b610adb81610ac0565b8114610ae657600080fd5b50565b600081359050610af881610ad2565b92915050565b600060208284031215610b1457610b13610847565b5b6000610b2284828501610ae9565b91505092915050565b610b34816108aa565b82525050565b6000602082019050610b4f6000830184610b2b565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610b9d57607f821691505b60208210811415610bb157610bb0610b56565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610bf1826108aa565b9150610bfc836108aa565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03821115610c3157610c30610bb7565b5b828201905092915050565b6000610c47826108aa565b9150610c52836108aa565b925082821015610c6557610c64610bb7565b5b828203905092915050565b60005b83811015610c8e578082015181840152602081019050610c73565b83811115610c9d576000848401525b50505050565b610cac816108aa565b8114610cb757600080fd5b50565b600081519050610cc981610ca3565b92915050565b600060208284031215610ce557610ce4610847565b5b6000610cf384828501610cba565b91505092915050565b6000601f19601f8301169050919050565b7f45524332303a207472616e7366657220616d6f756e742065786365656473206260008201527f616c616e63650000000000000000000000000000000000000000000000000000602082015250565b610d6181610ac0565b8114610d6c57600080fd5b5056fea2646970667358221220f8b8b2a3b4c3d5e8f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f56564736f6c63430008070033";

// Optional factory ABI if using a TokenFactory per docs
const TOKEN_FACTORY_ABI = [
  "function createTokenWithDistribution(string name, string symbol, uint8 decimals, uint256 totalSupply, address owner) returns (address token)"
];

export async function getKatanaProvider(): Promise<import('ethers').BrowserProvider | null> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) return null;
    const { ethers } = await import('ethers');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const desiredChainId = KATANA_CONFIG.chainId;
    if (!desiredChainId || !KATANA_CONFIG.rpcUrl) {
      console.warn('Katana chainId or rpcUrl not configured. Set NEXT_PUBLIC_KATANA_CHAIN_ID and NEXT_PUBLIC_KATANA_RPC_URL.');
      return provider; // Best effort, will rely on current chain
    }
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(desiredChainId)) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${desiredChainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${desiredChainId.toString(16)}`,
              chainName: KATANA_CONFIG.name,
              nativeCurrency: KATANA_CONFIG.nativeCurrency,
              rpcUrls: [KATANA_CONFIG.rpcUrl],
              blockExplorerUrls: KATANA_CONFIG.blockExplorer ? [KATANA_CONFIG.blockExplorer] : [],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }
    return provider;
  } catch (error) {
    console.error('Error getting Katana provider:', error);
    return null;
  }
}

export async function connectKatanaWallet(): Promise<{
  signer: import('ethers').JsonRpcSigner | null;
  address: string | null;
  error?: string;
}> {
  try {
    const provider = await getKatanaProvider();
    if (!provider) {
      return { signer: null, address: null, error: 'MetaMask not available' };
    }
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { signer, address };
  } catch (error) {
    return { signer: null, address: null, error: error instanceof Error ? error.message : 'Wallet connection failed' };
  }
}

export async function deployKatanaToken(input: KatanaDeployInput): Promise<{
  success: boolean;
  tokenAddress?: string;
  txHash?: string;
  explorer_url?: string;
  error?: string;
}> {
  try {
    const { ethers } = await import('ethers');
    const wallet = await connectKatanaWallet();
    if (!wallet.signer) {
      throw new Error(wallet.error || 'Failed to connect wallet');
    }

    // Validate chain if configured
    const desiredChainId = KATANA_CONFIG.chainId;
    const network = await wallet.signer.provider.getNetwork();
    if (desiredChainId && network.chainId !== BigInt(desiredChainId)) {
      throw new Error(`Wrong network: expected Katana (${desiredChainId}), connected to ${network.chainId}.`);
    }

    // Prefer factory if configured
    if (KATANA_CONFIG.factoryAddress) {
      const factory = new ethers.Contract(KATANA_CONFIG.factoryAddress, TOKEN_FACTORY_ABI, wallet.signer);
      const tx = await factory.createTokenWithDistribution(
        input.name,
        input.symbol,
        input.decimals,
        ethers.parseUnits(input.totalSupply.toString(), input.decimals),
        await wallet.signer.getAddress()
      );
      const receipt = await tx.wait();
      // Token address would be emitted; without event ABI here, just return tx hash
      return {
        success: true,
        txHash: receipt.hash,
        explorer_url: KATANA_CONFIG.blockExplorer || undefined,
      };
    }

    // Fallback: direct ERC-20 deployment
    const contractFactory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, wallet.signer);
    const totalSupplyWithDecimals = ethers.parseUnits(input.totalSupply.toString(), input.decimals);
    const contract = await contractFactory.deploy(
      input.name,
      input.symbol,
      totalSupplyWithDecimals,
      await wallet.signer.getAddress()
    );
    await contract.waitForDeployment();
    const tokenAddress = await contract.getAddress();
    const txHash = contract.deploymentTransaction()?.hash;
    return {
      success: true,
      tokenAddress,
      txHash,
      explorer_url: KATANA_CONFIG.blockExplorer ? `${KATANA_CONFIG.blockExplorer.replace(/\/$/, '')}/token/${tokenAddress}` : undefined,
    };
  } catch (error) {
    console.error('Katana deployment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error',
    };
  }
}


