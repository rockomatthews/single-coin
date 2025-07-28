const hre = require("hardhat");

async function main() {
  // Get deployment parameters from environment or defaults
  const name = process.env.TOKEN_NAME || "Test Token";
  const symbol = process.env.TOKEN_SYMBOL || "TEST";
  const totalSupply = process.env.TOKEN_SUPPLY || "1000000";
  const owner = process.env.TOKEN_OWNER;
  
  if (!owner) {
    throw new Error("TOKEN_OWNER environment variable is required");
  }
  
  console.log("Deploying SimpleToken with params:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Total Supply:", totalSupply);
  console.log("- Owner:", owner);
  console.log("- Network:", hre.network.name);
  
  // Deploy the contract
  const SimpleToken = await hre.ethers.getContractFactory("SimpleToken");
  const token = await SimpleToken.deploy(name, symbol, totalSupply, owner);
  
  // Wait for deployment to be mined
  await token.waitForDeployment();
  
  const contractAddress = await token.getAddress();
  const deploymentTx = token.deploymentTransaction();
  
  console.log("✅ SimpleToken deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Transaction Hash:", deploymentTx?.hash);
  console.log("🌐 Explorer URL:", `https://polygonscan.com/token/${contractAddress}`);
  
  // Return deployment info for programmatic use
  return {
    address: contractAddress,
    transactionHash: deploymentTx?.hash
  };
}

// Handle both CLI and programmatic usage
if (require.main === module) {
  main()
    .then((result) => {
      console.log("Deployment completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;