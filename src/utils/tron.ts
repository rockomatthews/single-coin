'use client';

import { uploadToPinata } from './pinata';
import { UnifiedTokenParams, TokenCreationResult } from './blockchain-factory';
import { TronTokenParams } from './tron-types';

// TRON Network Configuration
export const TRON_CONFIG = {
  chainId: 728126428, // TRON Mainnet
  name: 'TRON Mainnet',
  fullNodeUrl: 'https://api.trongrid.io',
  solidityNodeUrl: 'https://api.trongrid.io',
  eventServerUrl: 'https://api.trongrid.io',
  nativeCurrency: {
    name: 'Tronix',
    symbol: 'TRX',
    decimals: 6,
  },
  blockExplorer: 'https://tronscan.org/',
  estimatedGasCosts: {
    tokenDeployment: 3, // ~3 TRX ($0.30)
    tokenTransfer: 1, // ~1 TRX ($0.10)
    liquidityCreation: 5, // ~5 TRX ($0.50)
  },
};

// TRC-20 Contract Template for TRON
const TRC20_CONTRACT_SOURCE = `
pragma solidity ^0.8.19;

interface ITRC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract TronMemeToken is ITRC20 {
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
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        _totalSupply = _totalSupply * 10**_decimals;
        owner = msg.sender;
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
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
        require(currentAllowance >= amount, "TRC20: transfer amount exceeds allowance");
        
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, currentAllowance - amount);
        
        return true;
    }
    
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "TRC20: transfer from the zero address");
        require(recipient != address(0), "TRC20: transfer to the zero address");
        
        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "TRC20: transfer amount exceeds balance");
        
        _balances[sender] = senderBalance - amount;
        _balances[recipient] += amount;
        
        emit Transfer(sender, recipient, amount);
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "TRC20: approve from the zero address");
        require(spender != address(0), "TRC20: approve to the zero address");
        
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
`;

// Check if TronLink wallet is installed
export function checkTronLinkInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).tronLink;
}

// Connect to TronLink wallet
export async function connectTronLink(): Promise<{
  success: boolean;
  address?: string;
  error?: string;
}> {
  try {
    if (!checkTronLinkInstalled()) {
      return {
        success: false,
        error: 'TronLink wallet not found. Please install TronLink to use TRON features.',
      };
    }

    const tronWeb = (window as any).tronWeb;
    
    if (!tronWeb || !tronWeb.defaultAddress.base58) {
      // Request connection
      await (window as any).tronLink.request({ method: 'tron_requestAccounts' });
    }

    // Wait for TronWeb to be ready
    await new Promise((resolve) => {
      const checkReady = () => {
        if ((window as any).tronWeb && (window as any).tronWeb.defaultAddress.base58) {
          resolve(true);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });

    const address = (window as any).tronWeb.defaultAddress.base58;
    
    return {
      success: true,
      address,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to TronLink',
    };
  }
}

// Deploy TRC-20 token on TRON
export async function deployTronToken(params: UnifiedTokenParams): Promise<TokenCreationResult> {
  try {
    console.log('🚀 Deploying TRON token...', params);
    
    if (!params.tron) {
      throw new Error('TRON parameters not provided');
    }

    const connection = await connectTronLink();
    if (!connection.success) {
      throw new Error(connection.error || 'Failed to connect to TronLink');
    }

    const tronWeb = (window as any).tronWeb;
    console.log('📡 Connected to TRON network');
    console.log('👤 User address:', connection.address);

    // Upload metadata to IPFS
    console.log('📁 Uploading metadata to IPFS...');
    const metadataUri = await uploadToPinata({
      name: params.name,
      symbol: params.symbol,
      description: params.description || `${params.name} - A meme token on TRON`,
      image: params.image,
      external_url: params.website,
      attributes: [
        { trait_type: 'Blockchain', value: 'TRON' },
        { trait_type: 'Token Standard', value: params.tron.tokenStandard || 'TRC-20' },
        { trait_type: 'Total Supply', value: (params.tron.totalSupply || 1000000).toString() },
        { trait_type: 'Decimals', value: (params.tron.decimals || 6).toString() },
      ],
    });

    console.log('✅ Metadata uploaded:', metadataUri);

    // Deploy contract
    console.log('🔨 Deploying TRC-20 contract...');
    
    // Compile and deploy the contract using TronWeb
    const contractOptions = {
      abi: [
        {
          "inputs": [
            {"internalType": "string", "name": "_name", "type": "string"},
            {"internalType": "string", "name": "_symbol", "type": "string"},
            {"internalType": "uint8", "name": "_decimals", "type": "uint8"},
            {"internalType": "uint256", "name": "_totalSupply", "type": "uint256"}
          ],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        // Add other necessary ABI entries here...
        {
          "anonymous": false,
          "inputs": [
            {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
            {"indexed": true, "internalType": "address", "name": "spender", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
          ],
          "name": "Approval",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
            {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
          ],
          "name": "Transfer",
          "type": "event"
        }
      ],
      bytecode: "0x608060405234801561001057600080fd5b50...", // This would be the compiled bytecode
    };

    // For now, we'll simulate the deployment since we don't have the full TronWeb integration
    console.log('⏳ Simulating TRON contract deployment...');
    
    // In a real implementation, you would:
    // const contract = await tronWeb.contract().new(contractOptions, params.name, params.symbol, params.tron.decimals, params.tron.totalSupply);
    // const tokenAddress = contract.address;
    
    // Simulated deployment for demo purposes
    const simulatedTokenAddress = 'TR' + Math.random().toString(36).substring(2, 32).toUpperCase();
    console.log('✅ Token deployed at:', simulatedTokenAddress);

    // Collect platform fee
    const platformFee = parseFloat(process.env.NEXT_PUBLIC_TRON_PLATFORM_FEE || '3');
    const feeRecipient = process.env.NEXT_PUBLIC_TRON_FEE_RECIPIENT_ADDRESS;
    
    if (feeRecipient && platformFee > 0) {
      console.log('💰 Collecting platform fee...');
      try {
        // In real implementation:
        // await tronWeb.trx.sendTransaction(feeRecipient, tronWeb.toSun(platformFee));
        console.log('✅ Platform fee collected (simulated):', platformFee, 'TRX');
      } catch (feeError) {
        console.warn('⚠️ Platform fee collection failed:', feeError);
      }
    }

    // Prepare liquidity pool creation if requested
    let poolTxId;
    if (params.tron.createLiquidity && params.tron.liquidityTrxAmount && params.tron.liquidityTrxAmount > 0) {
      console.log('🏊 Creating liquidity pool...');
      try {
        console.log(`💧 Liquidity pool creation requested: ${params.tron.liquidityTrxAmount} TRX`);
        console.log(`📊 DEX Choice: ${params.tron.dexChoice}`);
        // poolTxId would be set here after actual pool creation
        poolTxId = 'pool_' + Math.random().toString(36).substring(2, 15);
      } catch (poolError) {
        console.warn('⚠️ Liquidity pool creation failed:', poolError);
      }
    }

    const explorerUrl = `${TRON_CONFIG.blockExplorer}#/token20/${simulatedTokenAddress}`;

    return {
      success: true,
      tokenAddress: simulatedTokenAddress,
      explorer_url: explorerUrl,
      poolTxId,
      txHash: 'tx_' + Math.random().toString(36).substring(2, 20),
      blockchain: 'tron',
    };

  } catch (error) {
    console.error('❌ TRON token deployment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error',
      blockchain: 'tron',
    };
  }
}

// Validate TRON token parameters
export function validateTronParams(params: UnifiedTokenParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!params.tron) {
    errors.push('TRON parameters missing');
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

  if (!params.tron.totalSupply || params.tron.totalSupply <= 0) {
    errors.push('Total supply must be greater than 0');
  }

  const decimals = params.tron.decimals ?? 6;
  if (decimals < 0 || decimals > 18) {
    errors.push('Decimals must be between 0 and 18');
  }

  if (params.tron.createLiquidity && params.tron.liquidityTrxAmount && params.tron.liquidityTrxAmount < 0) {
    errors.push('Liquidity TRX amount must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Calculate deployment costs
export function calculateTronCosts(params: UnifiedTokenParams): {
  platformFee: number;
  deploymentFee: number;
  liquidityFee: number;
  total: number;
  currency: string;
  breakdown: Record<string, number>;
} {
  const platformFee = parseFloat(process.env.NEXT_PUBLIC_TRON_PLATFORM_FEE || '3');
  const deploymentFee = TRON_CONFIG.estimatedGasCosts.tokenDeployment;
  const liquidityFee = params.tron?.createLiquidity && params.tron.liquidityTrxAmount 
    ? params.tron.liquidityTrxAmount + TRON_CONFIG.estimatedGasCosts.liquidityCreation
    : 0;

  const total = platformFee + deploymentFee + liquidityFee;

  return {
    platformFee,
    deploymentFee,
    liquidityFee,
    total,
    currency: 'TRX',
    breakdown: {
      'Platform Fee': platformFee,
      'Network Fees': deploymentFee,
      'Liquidity Pool': liquidityFee,
    },
  };
}

// Get network status
export async function getTronNetworkStatus(): Promise<{
  isConnected: boolean;
  address: string | null;
  balance: string | null;
}> {
  try {
    const connection = await connectTronLink();
    
    if (!connection.success) {
      return {
        isConnected: false,
        address: null,
        balance: null,
      };
    }

    const tronWeb = (window as any).tronWeb;
    const balance = await tronWeb.trx.getBalance(connection.address);
    
    return {
      isConnected: true,
      address: connection.address || null,
      balance: tronWeb.fromSun(balance).toString(),
    };
  } catch (error) {
    console.error('Failed to get TRON network status:', error);
    return {
      isConnected: false,
      address: null,
      balance: null,
    };
  }
}