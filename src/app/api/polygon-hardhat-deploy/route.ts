import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

interface DeploymentRequest {
  name: string;
  symbol: string;
  totalSupply: number;
  owner: string;
  revokeUpdateAuthority?: boolean;
  revokeMintAuthority?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: DeploymentRequest = await request.json();
    
    const { name, symbol, totalSupply, owner, revokeUpdateAuthority, revokeMintAuthority } = body;
    
    console.log('Hardhat deployment request:', { name, symbol, totalSupply, owner });
    
    // Set environment variables directly (Vercel serverless is read-only)
    const deploymentEnv: NodeJS.ProcessEnv = {
      ...process.env,
      TOKEN_NAME: name,
      TOKEN_SYMBOL: symbol,
      TOKEN_SUPPLY: totalSupply.toString(),
      TOKEN_OWNER: owner,
      APPLY_SECURITY: (revokeUpdateAuthority || revokeMintAuthority) ? 'true' : 'false',
      RENOUNCE_OWNERSHIP: revokeUpdateAuthority ? 'true' : 'false',
      FINISH_MINTING: revokeMintAuthority ? 'true' : 'false',
      NODE_ENV: 'production' as const
    };
    
    // Compile the contracts
    try {
      console.log('Compiling contracts...');
      execSync('npx hardhat compile', { 
        stdio: 'pipe',
        cwd: process.cwd(),
        env: deploymentEnv
      });
      console.log('✅ Contracts compiled successfully');
    } catch (compileError: any) {
      console.error('❌ Contract compilation failed:', compileError.stdout?.toString());
      return NextResponse.json({
        success: false,
        error: `Contract compilation failed: ${compileError.stdout?.toString() || compileError.message}`
      }, { status: 500 });
    }
    
    // Run the deployment script
    const deployCommand = `npx hardhat run scripts/deploy-secure-token.cjs --network polygon`;
    
    let deployOutput: string;
    try {
      console.log('Deploying to Polygon...');
      deployOutput = execSync(deployCommand, { 
        stdio: 'pipe',
        cwd: process.cwd(),
        env: deploymentEnv,
        encoding: 'utf8'
      });
      console.log('Hardhat deployment output:', deployOutput);
    } catch (deployError: any) {
      console.error('❌ Hardhat deployment failed:', deployError.stdout?.toString());
      return NextResponse.json({
        success: false,
        error: `Hardhat deployment failed: ${deployError.stdout?.toString() || deployError.message}`
      }, { status: 500 });
    }
    
    // Parse the deployment output to extract contract address and tx hash
    const addressMatch = deployOutput.match(/Contract Address:\s*([0-9a-fA-Fx]+)/);
    const txHashMatch = deployOutput.match(/Transaction Hash:\s*([0-9a-fA-Fx]+)/);
    const securityTxMatch = deployOutput.match(/(?:Minting finished|Ownership renounced):\s*([0-9a-fA-Fx]+)/);
    
    if (!addressMatch || !txHashMatch) {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse deployment results from Hardhat output'
      }, { status: 500 });
    }
    
    const tokenAddress = addressMatch[1];
    const txHash = txHashMatch[1];
    const securityTxHash = securityTxMatch?.[1];
    
    console.log('✅ Hardhat deployment successful:', {
      address: tokenAddress,
      txHash,
      securityTxHash
    });
    
    // No temporary files to clean up
    
    return NextResponse.json({
      success: true,
      tokenAddress,
      txHash,
      securityTxHash,
      explorer_url: `https://polygonscan.com/token/${tokenAddress}`
    });
    
  } catch (error) {
    console.error('❌ Hardhat deployment API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error'
    }, { status: 500 });
  }
}