const solc = require('solc');
const fs = require('fs');
const path = require('path');

// Read the contract source
const contractSource = fs.readFileSync('./secure-erc20-contract.sol', 'utf8');

// Compile the contract
const input = {
  language: 'Solidity',
  sources: {
    'SecureERC20Token.sol': {
      content: contractSource
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object']
      }
    },
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};

console.log('🔧 Compiling SecureERC20Token contract...');

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  console.log('⚠️ Compilation warnings/errors:');
  output.errors.forEach(error => {
    console.log(error.formattedMessage);
  });
}

const contract = output.contracts['SecureERC20Token.sol']['SecureERC20Token'];

if (contract) {
  console.log('✅ Contract compiled successfully!');
  
  // Extract ABI and bytecode
  const abi = contract.abi;
  const bytecode = '0x' + contract.evm.bytecode.object;
  
  console.log('\n📋 ABI:');
  console.log(JSON.stringify(abi, null, 2));
  
  console.log('\n💾 Bytecode:');
  console.log(bytecode);
  
  // Find constructor in ABI
  const constructor = abi.find(item => item.type === 'constructor');
  if (constructor) {
    console.log('\n🏗️ Constructor signature:');
    const params = constructor.inputs.map(input => `${input.type} ${input.name}`).join(', ');
    console.log(`constructor(${params})`);
  }
  
  // Save to files
  fs.writeFileSync('./compiled-abi.json', JSON.stringify(abi, null, 2));
  fs.writeFileSync('./compiled-bytecode.txt', bytecode);
  
  console.log('\n💾 Saved compiled-abi.json and compiled-bytecode.txt');
} else {
  console.error('❌ Contract compilation failed');
  console.error(output);
}