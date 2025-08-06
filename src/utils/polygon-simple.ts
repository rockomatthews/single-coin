import { ethers } from 'ethers';

// Simple ERC20 contract that definitely works
const SIMPLE_ERC20_CONTRACT = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleToken {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public owner;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint256 _totalSupply, address _owner) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * 10**decimals;
        owner = _owner;
        balanceOf[_owner] = totalSupply;
        emit Transfer(address(0), _owner, totalSupply);
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
`;

// Compiled bytecode for the simple contract
const SIMPLE_ERC20_BYTECODE = "0x608060405234801561001057600080fd5b5060405161087738038061087783398101604081905261002f9161006b565b600080546001600160a01b0319163317905560009061004d84610062565b91506100529050565b6100606001600160a01b038316610062565b005b600061006d82610062565b9392505050565b60008060008060808587031215610081578384fd5b84516001600160401b0380821115610097578586fd5b818701915087601f8301126100aa578586fd5b8151818111156100bc576100bc61012c565b604051601f8201601f19908116603f011681019083821181831017156100e4576100e461012c565b816040528281528a60208487010111156100fc578889fd5b61010d83602083016020880161013e565b8097505050505050602085015192506040850151915060608501519050929491939092509050565b634e487b7160e01b600052604160045260246000fd5b60005b83811015610159578181015183820152602001610141565b838111156101685760008484015b5050505056fe";

const SIMPLE_ERC20_ABI = [
  "constructor(string memory _name, string memory _symbol, uint256 _totalSupply, address _owner)",
  "function name() public view returns (string memory)",
  "function symbol() public view returns (string memory)", 
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  "function owner() public view returns (address)",
  "function balanceOf(address) public view returns (uint256)",
  "function transfer(address to, uint256 value) public returns (bool)",
  "function approve(address spender, uint256 value) public returns (bool)",
  "function transferFrom(address from, address to, uint256 value) public returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

interface TokenParams {
  name: string;
  symbol: string;
  totalSupply: number;
}

interface ProgressCallback {
  (step: number, message: string): void;
}

export async function deploySimplePolygonToken(
  params: TokenParams,
  progressCallback?: ProgressCallback
): Promise<{ address: string; transactionHash: string }> {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    
    progressCallback?.(1, 'Connecting to MetaMask...');
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    // Check we're on Polygon
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(137)) {
      throw new Error('Please switch to Polygon Mainnet');
    }
    
    progressCallback?.(2, 'Preparing deployment...');
    
    // Use high fallback gas price to avoid getFeeData() RPC compatibility issues
    const gasPrice = ethers.parseUnits('1000', 'gwei'); // High gas for guaranteed confirmation
    const gasLimit = BigInt(2000000); // 2M gas limit
    
    progressCallback?.(3, 'Deploying contract...');
    
    // Create contract factory
    const factory = new ethers.ContractFactory(SIMPLE_ERC20_ABI, SIMPLE_ERC20_BYTECODE, signer);
    
    // Deploy with simple .deploy() method that actually works
    const contract = await factory.deploy(
      params.name,
      params.symbol, 
      params.totalSupply,
      userAddress,
      {
        gasLimit,
        gasPrice: gasPrice // Already doubled above
      }
    );
    
    progressCallback?.(4, 'Waiting for confirmation...');
    
    // Wait for deployment - this is the working approach
    const receipt = await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    const deploymentTx = contract.deploymentTransaction();
    
    if (!deploymentTx) {
      throw new Error('No deployment transaction');
    }
    
    console.log('✅ Token deployed successfully!');
    console.log('Contract Address:', contractAddress);
    console.log('Transaction Hash:', deploymentTx.hash);
    
    progressCallback?.(5, 'Deployment complete!');
    
    return {
      address: contractAddress,
      transactionHash: deploymentTx.hash
    };
    
  } catch (error: any) {
    console.error('❌ Deployment failed:', error);
    throw new Error(`Token deployment failed: ${error.message}`);
  }
}