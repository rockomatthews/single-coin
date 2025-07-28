const hre = require("hardhat");

async function main() {
  // Get deployment parameters from environment or defaults
  const name = process.env.TOKEN_NAME || "Test Token";
  const symbol = process.env.TOKEN_SYMBOL || "TEST";
  const totalSupply = process.env.TOKEN_SUPPLY || "1000000";
  const owner = process.env.TOKEN_OWNER;
  const applySecurityFeatures = process.env.APPLY_SECURITY === "true";
  const renounceOwnership = process.env.RENOUNCE_OWNERSHIP === "true";
  const finishMinting = process.env.FINISH_MINTING === "true";
  
  if (!owner) {
    throw new Error("TOKEN_OWNER environment variable is required");
  }
  
  console.log("Deploying SecureToken with OpenZeppelin:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Total Supply:", totalSupply);
  console.log("- Owner:", owner);
  console.log("- Network:", hre.network.name);
  console.log("- Apply Security Features:", applySecurityFeatures);
  console.log("- Renounce Ownership:", renounceOwnership);
  console.log("- Finish Minting:", finishMinting);
  
  // Deploy the contract with high gas fees for guaranteed confirmation
  const SecureToken = await hre.ethers.getContractFactory("SecureToken");
  const token = await SecureToken.deploy(
    name, 
    symbol, 
    hre.ethers.parseUnits(totalSupply, 18), // Convert to wei (18 decimals)
    owner,
    {
      gasLimit: 2000000,
      gasPrice: hre.ethers.parseUnits("300", "gwei") // 300 gwei for fast confirmation
    }
  );
  
  console.log("⏳ Waiting for deployment confirmation...");
  
  // Wait for deployment to be mined
  await token.waitForDeployment();
  
  const contractAddress = await token.getAddress();
  const deploymentTx = token.deploymentTransaction();
  
  console.log("✅ SecureToken deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Transaction Hash:", deploymentTx?.hash);
  
  // Apply security features if requested
  let securityTxHash;
  if (applySecurityFeatures) {
    console.log("🔒 Applying security features...");
    
    if (finishMinting) {
      console.log("- Finishing minting (irreversible)...");
      const finishTx = await token.finishMinting({
        gasLimit: 100000,
        gasPrice: hre.ethers.parseUnits("300", "gwei")
      });
      await finishTx.wait();
      console.log("✅ Minting finished:", finishTx.hash);
      securityTxHash = finishTx.hash;
    }
    
    if (renounceOwnership) {
      console.log("- Renouncing ownership (irreversible)...");
      const renounceTx = await token.renounceOwnership({
        gasLimit: 100000,
        gasPrice: hre.ethers.parseUnits("300", "gwei")
      });
      await renounceTx.wait();
      console.log("✅ Ownership renounced:", renounceTx.hash);
      securityTxHash = renounceTx.hash;
    }
  }
  
  console.log("🌐 Explorer URL:", `https://polygonscan.com/token/${contractAddress}`);
  
  // Verify the contract is working
  try {
    const tokenName = await token.name();
    const tokenSymbol = await token.symbol();
    const tokenDecimals = await token.decimals();
    const tokenTotalSupply = await token.totalSupply();
    const tokenOwner = await token.owner();
    const isMintingFinished = await token.mintingFinished();
    
    console.log("✅ Contract verification successful:");
    console.log("- Name:", tokenName);
    console.log("- Symbol:", tokenSymbol);
    console.log("- Decimals:", tokenDecimals.toString());
    console.log("- Total Supply:", hre.ethers.formatUnits(tokenTotalSupply, 18));
    console.log("- Owner:", tokenOwner);
    console.log("- Minting Finished:", isMintingFinished);
  } catch (error) {
    console.log("⚠️ Contract verification failed:", error.message);
  }
  
  // Return deployment info for programmatic use
  return {
    address: contractAddress,
    transactionHash: deploymentTx?.hash,
    securityTxHash
  };
}

// Handle both CLI and programmatic usage
if (require.main === module) {
  main()
    .then((result) => {
      console.log("✅ Deployment completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;