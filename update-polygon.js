const fs = require('fs');

// Read the compiled ABI and bytecode
const abi = JSON.parse(fs.readFileSync('./compiled-abi.json', 'utf8'));
const bytecode = fs.readFileSync('./compiled-bytecode.txt', 'utf8').trim();

// Read the current polygon.ts file
let polygonTs = fs.readFileSync('./src/utils/polygon.ts', 'utf8');

// Create the new ABI string (proper format for the file)
const newAbiString = `// Compiled SecureERC20Token ABI - matches the actual contract
const SECURE_ERC20_ABI = ${JSON.stringify(abi, null, 2)};`;

// Create the new bytecode string
const newBytecodeString = `// Compiled SecureERC20Token bytecode - exact bytecode from our secure-erc20-contract.sol
const OPENZEPPELIN_ERC20_BYTECODE = "${bytecode}";`;

// Find and replace the ABI section
const abiStartPattern = /\/\/ OpenZeppelin ERC-20 with Ownable - Working implementation\s*\nconst SECURE_ERC20_ABI = \[/;
const abiEndPattern = /\];/;

// Find start and end of ABI
const abiStart = polygonTs.search(abiStartPattern);
if (abiStart === -1) {
  console.error('❌ Could not find ABI start pattern');
  process.exit(1);
}

let abiEndPos = abiStart;
let bracketCount = 0;
let foundStart = false;
for (let i = abiStart; i < polygonTs.length; i++) {
  if (polygonTs[i] === '[') {
    if (!foundStart) foundStart = true;
    bracketCount++;
  } else if (polygonTs[i] === ']') {
    bracketCount--;
    if (foundStart && bracketCount === 0) {
      abiEndPos = i + 1; // Include the closing bracket
      if (polygonTs[i + 1] === ';') abiEndPos = i + 2; // Include semicolon
      break;
    }
  }
}

console.log('🔧 Replacing ABI section...');
const beforeAbi = polygonTs.substring(0, abiStart);
const afterAbi = polygonTs.substring(abiEndPos);
polygonTs = beforeAbi + newAbiString + afterAbi;

// Find and replace the bytecode section
const bytecodePattern = /\/\/ .*bytecode.*\nconst OPENZEPPELIN_ERC20_BYTECODE = ".*";/s;
console.log('🔧 Replacing bytecode section...');
polygonTs = polygonTs.replace(bytecodePattern, newBytecodeString);

// Write the updated file
fs.writeFileSync('./src/utils/polygon.ts', polygonTs);
console.log('✅ Updated polygon.ts with correct ABI and bytecode');
console.log('✅ Constructor now matches: constructor(string name_, string symbol_, uint256 initialSupply_, address owner_)');