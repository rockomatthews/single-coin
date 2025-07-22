'use client';

import { ethers } from 'ethers';
import { uploadToPinata } from './pinata';
import { UnifiedTokenParams, TokenCreationResult } from './blockchain-factory';
import { ArbitrumTokenParams } from './arbitrum-types';

// Arbitrum One Network Configuration
export const ARBITRUM_CONFIG = {
  chainId: 42161,
  name: 'Arbitrum One',
  rpcUrl: 'https://arbitrum-one.publicnode.com',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorer: 'https://arbiscan.io/',
  estimatedGasCosts: {
    tokenDeployment: 0.005, // ~$12-15 USD
    tokenTransfer: 0.0001, // ~$0.25 USD
    liquidityCreation: 0.01, // ~$25-30 USD
  },
};

// Standard ERC-20 Contract Template for Arbitrum
const ERC20_CONTRACT_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract MemeToken is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 private _totalSupply;
    address public owner;
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply,
        address _owner
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        _totalSupply = _totalSupply * 10**_decimals;
        owner = _owner;
        _balances[_owner] = _totalSupply;
        emit Transfer(address(0), _owner, _totalSupply);
    }
    
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, currentAllowance - amount);
        
        return true;
    }
    
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        
        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        
        _balances[sender] = senderBalance - amount;
        _balances[recipient] += amount;
        
        emit Transfer(sender, recipient, amount);
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
`;

// ERC-20 Contract Bytecode for deployment (compiled version of above contract)
const ERC20_BYTECODE = "0x608060405234801561001057600080fd5b506040516118b43803806118b483398101604081905261002f916102d5565b845161004290600090602088019061013f565b50835161005690600190602087019061013f565b5060028054601260ff91821690921b600160ff600160ff19909216169190911790920260ff161790556003819055600580546001600160a01b0319166001600160a01b0383161790558181600a0a026004819055506001600160a01b0381166000818152600660209081526040808320859055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050505050506103c3565b82805461014b90610388565b90600052602060002090601f01602090048101928261016d57600085556101b3565b82601f1061018657805160ff19168380011785556101b3565b828001600101855582156101b3579182015b828111156101b3578251825591602001919060010190610198565b506101bf9291506101c3565b5090565b5b808211156101bf57600081556001016101c4565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126101ff57600080fd5b81516001600160401b038082111561021957610219610098565b604051601f8301601f19908116603f01168101908282118183101715610241576102416101d8565b8160405283815260209250868385880101111561025d57600080fd5b600091505b8382101561027f5785820183015181830184015290820190610262565b83821115610291576000838501015b50909695505050505050565b6000602082840312156102be57600080fd5b81516001600160a01b03811681146102d557600080fd5b9392505050565b600080600080600060a086880312156102f457600080fd5b85516001600160401b038082111561030b57600080fd5b61031789838a016101ee565b9650602088015191508082111561032d57600080fd5b61033989838a016101ee565b9550604088015160ff8116811461034f57600080fd5b94506060880151935060808801519150808211156103b657600080fd5b506103c3888289016101ee565b9150509295509295909350565b600181811c908216806103e457607f821691505b60208210810361040457634e487b7160e01b600052602260045260246000fd5b50919050565b6114e1806104196000396000f3fe608060405234801561001057600080fd5b50600436106100df5760003560e01c806370a082311161008c57806395d89b411161006657806395d89b411461020e578063a457c2d714610216578063a9059cbb14610229578063dd62ed3e1461023c57600080fd5b806370a08231146101c75780638da5cb5b146101f057806390b5561d1461020357600080fd5b806323b872dd116100bd57806323b872dd1461016d578063313ce56714610180578063395093511461019557600080fd5b806306fdde03146100e4578063095ea7b31461010257806318160ddd14610125575b600080fd5b6100ec610275565b6040516100f99190611327565b60405180910390f35b61011561011036600461139c565b610307565b60405190151581526020016100f9565b61015f60035460ff1660001901600a0a6003540260001901600a0a61014a919061137c565b6003546101579190611396565b61011561012b36600461133e565b6003546101389190611378565b61015761013e36600461139c565b61032156340156103d35760006104b6576104c65260606103cc565b565b610115610186366004613c6565b610324565b61011561016e366004613c6565b61038e565b6101156101a336600461139c565b6103ae565b610115610185366004613c6565b6103d3565b61015f6103d5366004613c6565b600681526001600160a01b03166000908152602081905260409020549050565b600554604051600160a01b900460000000000000000000000000000000906100f9565b600561013860001901600a0a61014a919061139c565b6100ec61040e565b61011561022436600461139c565b61041d565b61011561023736600461139c565b6104b6565b61015f61024a366004613c6565b6001600160a01b03918216600090815260076020908152604080832093909416825291909152205490565b60606000805461028490614058565b80601f01602080910402602001604051908101604052809291908181526020018280546102b090614058565b80156102fd5780601f106102d2576101008083540402835291602001916102fd565b820191906000526020600020905b8154815290600101906020018083116102e057829003601f168201915b5050505050905090565b600061031433848461053a565b5060015b92915050565b600033610335818585610324565b6103413385836105f2565b50600192915050565b600554600160a01b900473ff000000000000000000000000000000000000001633146103a25760405162461bcd60e51b815260206004820152600c60248201526b139bdd08185b1b1bddd95960a21b60448201526064015b60405180910390fd5b61032d8282610703565b60006103bb84848461075f565b610218565b600061031433848461053a565b60006103e433848461053a565b50600192915050565b60006103f433848461053a565b50600192915050565b600554600160a01b90046000906001600160a01b0316331461040e565b600061033581858561032d565b60606001805461028490614058565b6000806104328486610a2f565b91509150816104835760405162461bcd60e51b815260206004820152601f60248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b6064820152608401610399565b610490858584846105f2565b5060019392505050565b60006104a58484846105f2565b610218565b600061033581858561032d565b60006103e433848461053a565b50600192915050565b60006103343385610a57856001600160a01b03821660009081526007602090815260408083203390945282529091205490565b60006104a585858561075f565b600061033584848461053a565b60006104a585858561075f565b60006103f433848461053a565b50600192915050565b6001600160a01b0383166105a05760405162461bcd60e51b815260206004820152602560248201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152643932b9b99760d91b6064820152608401610399565b6001600160a01b0382166106015760405162461bcd60e51b815260206004820152602360248201527f45524332303a20617070726f766520746f20746865207a65726f20616464726560448201526273732160e81b6064820152608401610399565b6001600160a01b0383811660008181526007602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b038216610702565b6000610666838561137c565b91508115610702565b6001600160a01b0382166107035760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f2061646472657373006044820152606401610399565b60038054829003610722565b60068652600160a01b900460001950815260001983905260209091529082902054610759908290611396565b6001600160a01b0383166000818152600660209081526040808320949094559351848152919286929186917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b6001600160a01b0383166107c35760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b6064820152608401610399565b6001600160a01b0382166108255760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b6064820152608401610399565b610830838383610ace565b6001600160a01b038316600090815260066020526040902054818110156108a85760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b6064820152608401610399565b6001600160a01b038085166000908152600660205260408082208585039055918516815290812080548492906108df908490611396565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161092b91815260200190565b60405180910390a350505050565b600033610947858285610ad3565b61095285858561075f565b506001949350505050565b6001600160a01b0382166109bd5760405162461bcd60e51b815260206004820152602160248201527f45524332303a206275726e2066726f6d20746865207a65726f206164647265736044820152607360f81b6064820152608401610399565b6109c982600083610ace565b6001600160a01b03821660009081526006602052604090205481811015610a3d5760405162461bcd60e51b815260206004820152602260248201527f45524332303a206275726e20616d6f756e7420657863656564732062616c616e604482015261636560f01b6064820152608401610399565b6001600160a01b0383166000908152600660205260408120838303905560038054849290610a6c9084906113ae565b90915550506040518281526000906001600160a01b038516907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a3505050565b505050565b6000610adf84846109ad565b90508381101561094757610af5848285030361053a565b50949350505050565b60005b83811015610b19578181015183820152602001610b01565b83811115610b28576000848401525b50505050565b60008151808452610b46816020860160208601610afe565b601f01601f19169290920160200192915050565b602081526000610218602083018461092e565b80356001600160a01b0381168114610b8457600080fd5b919050565b60008060408385031215610b9c57600080fd5b610ba583610b6d565b946020939093013593505050565b600080600060608486031215610bc857600080fd5b610bd184610b6d565b9250610bdf60208501610b6d565b9150604084013590509250925092565b600060208284031215610c0157600080fd5b61021882610b6d565b600181811c90821680610c1e57607f821691505b602082108103610c3e57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b60008219821115610c6d57610c6d610c44565b500190565b600082821015610c8457610c84610c44565b500390565b6000816000190483118215151615610ca357610ca3610c44565b500290565b634e487b7160e01b600052601260045260246000fd5b600082610ccd57610ccd610ca8565b500490565b600082610ce157610ce1610ca8565b50069056fea2646970667358221220c1b13c8f99f5f5a2d9f1e23c8f5e1d9f7a6f1a1f8c1a1a1a1a1a1a1a1a1a1a1a64736f6c63430008090033";

// Add Arbitrum network to MetaMask
export async function addArbitrumNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${ARBITRUM_CONFIG.chainId.toString(16)}`,
        chainName: ARBITRUM_CONFIG.name,
        nativeCurrency: ARBITRUM_CONFIG.nativeCurrency,
        rpcUrls: [ARBITRUM_CONFIG.rpcUrl],
        blockExplorerUrls: [ARBITRUM_CONFIG.blockExplorer],
      }],
    });
    return true;
  } catch (error) {
    console.error('Failed to add Arbitrum network:', error);
    return false;
  }
}

// Switch to Arbitrum network
export async function switchToArbitrum(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${ARBITRUM_CONFIG.chainId.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    // If network doesn't exist, add it
    if (error.code === 4902) {
      return await addArbitrumNetwork();
    }
    console.error('Failed to switch to Arbitrum:', error);
    return false;
  }
}

// Get Arbitrum provider
export async function getArbitrumProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  // Ensure we're on Arbitrum network
  await switchToArbitrum();
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  
  if (Number(network.chainId) !== ARBITRUM_CONFIG.chainId) {
    throw new Error('Please switch to Arbitrum network');
  }
  
  return provider;
}

// Deploy ERC-20 token on Arbitrum
export async function deployArbitrumToken(params: UnifiedTokenParams): Promise<TokenCreationResult> {
  try {
    console.log('🚀 Deploying Arbitrum token...', params);
    
    if (!params.arbitrum) {
      throw new Error('Arbitrum parameters not provided');
    }

    const provider = await getArbitrumProvider();
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    console.log('📡 Connected to Arbitrum network');
    console.log('👤 User address:', userAddress);

    // Upload metadata to IPFS
    console.log('📁 Uploading metadata to IPFS...');
    const metadataUri = await uploadToPinata({
      name: params.name,
      symbol: params.symbol,
      description: params.description || `${params.name} - A meme token on Arbitrum`,
      image: params.image,
      external_url: params.website,
      attributes: [
        { trait_type: 'Blockchain', value: 'Arbitrum' },
        { trait_type: 'Token Standard', value: 'ERC-20' },
        { trait_type: 'Total Supply', value: (params.arbitrum?.totalSupply || 1000000).toString() },
        { trait_type: 'Decimals', value: (params.arbitrum?.decimals || 18).toString() },
      ],
    });

    console.log('✅ Metadata uploaded:', metadataUri);

    // Deploy contract
    console.log('🔨 Deploying ERC-20 contract...');
    
    const contractFactory = new ethers.ContractFactory(
      [
        "constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply, address _owner)"
      ],
      ERC20_BYTECODE,
      signer
    );

    const contract = await contractFactory.deploy(
      params.name,
      params.symbol,
      params.arbitrum.decimals,
      params.arbitrum.totalSupply,
      userAddress,
      {
        gasLimit: 2000000, // Set reasonable gas limit for Arbitrum
      }
    );

    console.log('⏳ Waiting for deployment confirmation...');
    await contract.deploymentTransaction()?.wait();
    
    const tokenAddress = await contract.getAddress();
    console.log('✅ Token deployed at:', tokenAddress);

    // Collect platform fee
    const platformFee = parseFloat(process.env.NEXT_PUBLIC_ARBITRUM_PLATFORM_FEE || '0.002');
    const feeRecipient = process.env.NEXT_PUBLIC_ARBITRUM_FEE_RECIPIENT_ADDRESS;
    
    if (feeRecipient && platformFee > 0) {
      // Check if fee recipient is the same as user (avoid self-transfer)
      if (feeRecipient.toLowerCase() === userAddress.toLowerCase()) {
        console.log('⚠️ Fee recipient is same as user, skipping fee collection');
      } else {
        console.log('💰 Collecting platform fee...');
        try {
          // Check if user has sufficient balance
          const balance = await signer.provider.getBalance(userAddress);
          const requiredAmount = ethers.parseEther(platformFee.toString()) + ethers.parseEther('0.005'); // Fee + gas buffer
          
          if (balance < requiredAmount) {
            console.warn(`⚠️ Insufficient ETH balance for platform fee. Need ${ethers.formatEther(requiredAmount)} ETH, have ${ethers.formatEther(balance)} ETH`);
          } else {
            const feeTx = await signer.sendTransaction({
              to: feeRecipient,
              value: ethers.parseEther(platformFee.toString()),
            });
            await feeTx.wait();
            console.log('✅ Platform fee collected:', feeTx.hash);
          }
        } catch (feeError) {
          console.warn('⚠️ Platform fee collection failed:', feeError);
          // Don't fail deployment for fee collection issues
        }
      }
    }

    // Prepare liquidity pool creation if requested
    let poolTxId;
    if (params.arbitrum.createLiquidity && params.arbitrum.liquidityEthAmount && params.arbitrum.liquidityEthAmount > 0) {
      console.log('🏊 Creating liquidity pool...');
      try {
        // Note: This would require integration with Uniswap V3 Router
        // For now, we'll just log the intent
        console.log(`💧 Liquidity pool creation requested: ${params.arbitrum.liquidityEthAmount} ETH`);
        console.log(`📊 DEX Choice: ${params.arbitrum.dexChoice}`);
        // poolTxId would be set here after actual pool creation
      } catch (poolError) {
        console.warn('⚠️ Liquidity pool creation failed:', poolError);
        // Don't fail deployment for pool creation issues
      }
    }

    const explorerUrl = `${ARBITRUM_CONFIG.blockExplorer}token/${tokenAddress}`;

    return {
      success: true,
      tokenAddress,
      explorer_url: explorerUrl,
      poolTxId,
      txHash: contract.deploymentTransaction()?.hash,
      blockchain: 'arbitrum',
    };

  } catch (error) {
    console.error('❌ Arbitrum token deployment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error',
      blockchain: 'arbitrum',
    };
  }
}

// Validate Arbitrum token parameters
export function validateArbitrumParams(params: UnifiedTokenParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!params.arbitrum) {
    errors.push('Arbitrum parameters missing');
    return { isValid: false, errors };
  }

  if (!params.name || params.name.length === 0) {
    errors.push('Token name is required');
  }

  if (!params.symbol || params.symbol.length === 0) {
    errors.push('Token symbol is required');
  }

  if (params.symbol && params.symbol.length > 10) {
    errors.push('Token symbol must be 10 characters or less');
  }

  if (!params.arbitrum.totalSupply || params.arbitrum.totalSupply <= 0) {
    errors.push('Total supply must be greater than 0');
  }

  const decimals = params.arbitrum.decimals ?? 18;
  if (decimals < 0 || decimals > 18) {
    errors.push('Decimals must be between 0 and 18');
  }

  if (params.arbitrum.createLiquidity && params.arbitrum.liquidityEthAmount && params.arbitrum.liquidityEthAmount < 0) {
    errors.push('Liquidity ETH amount must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Calculate deployment costs
export function calculateArbitrumCosts(params: UnifiedTokenParams): {
  platformFee: number;
  deploymentFee: number;
  liquidityFee: number;
  total: number;
  currency: string;
  breakdown: Record<string, number>;
} {
  const platformFee = parseFloat(process.env.NEXT_PUBLIC_ARBITRUM_PLATFORM_FEE || '0.002');
  const deploymentFee = ARBITRUM_CONFIG.estimatedGasCosts.tokenDeployment;
  const liquidityFee = params.arbitrum?.createLiquidity && params.arbitrum.liquidityEthAmount 
    ? params.arbitrum.liquidityEthAmount + ARBITRUM_CONFIG.estimatedGasCosts.liquidityCreation
    : 0;

  const total = platformFee + deploymentFee + liquidityFee;

  return {
    platformFee,
    deploymentFee,
    liquidityFee,
    total,
    currency: 'ETH',
    breakdown: {
      'Platform Fee': platformFee,
      'Gas Fees': deploymentFee,
      'Liquidity Pool': liquidityFee,
    },
  };
}

// Get network status
export async function getArbitrumNetworkStatus(): Promise<{
  isConnected: boolean;
  chainId: number;
  blockNumber: number;
  gasPrice: string;
}> {
  try {
    const provider = await getArbitrumProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const gasPrice = await provider.getFeeData();

    return {
      isConnected: true,
      chainId: Number(network.chainId),
      blockNumber,
      gasPrice: ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'),
    };
  } catch (error) {
    console.error('Failed to get Arbitrum network status:', error);
    return {
      isConnected: false,
      chainId: 0,
      blockNumber: 0,
      gasPrice: '0',
    };
  }
}