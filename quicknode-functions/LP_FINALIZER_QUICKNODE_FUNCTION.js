// QUICKNODE FUNCTION: LP FINALIZER FOR POLYGON (UNISWAP V3)
// Accepts: tokenAddress, liquidityMaticAmount, retentionPercentage (optional), servicePrivateKey, rpcUrl
// Behavior: Wrap MATIC to WMATIC, approve token + WMATIC, create/initialize pool if needed, mint full-range liquidity

async function main(params) {
  console.log('🏁 LP FINALIZER START');
  try {
    let ethers;
    try {
      ethers = require('ethers');
    } catch (e) {
      throw new Error('Ethers import failed');
    }

    // Handle nested user_data
    const userData = params?.user_data?.user_data || params?.user_data || params || {};
    const {
      tokenAddress,
      liquidityMaticAmount,
      retentionPercentage, // optional; informative only
      servicePrivateKey,
      rpcUrl
    } = userData;

    if (!tokenAddress || !liquidityMaticAmount || !servicePrivateKey || !rpcUrl) {
      throw new Error('Missing required params: tokenAddress, liquidityMaticAmount, servicePrivateKey, rpcUrl');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(servicePrivateKey, provider);

    // Gas price (Polygon non-1559 compatibility)
    let gasPrice;
    try {
      const fee = await provider.getFeeData();
      gasPrice = fee.gasPrice || ethers.parseUnits('50', 'gwei');
    } catch {
      gasPrice = ethers.parseUnits('50', 'gwei');
    }

    // Addresses/ABIs
    const ADDR = {
      NFPM: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
      FACTORY: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
    };

    const erc20Abi = [
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)',
      'function approve(address spender, uint256 amount) external returns (bool)'
    ];
    const wmaticAbi = [
      'function deposit() external payable',
      'function approve(address spender, uint256 amount) external returns (bool)'
    ];
    const factoryAbi = [
      'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
    ];
    const nfpmAbi = [
      'function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)',
      'function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'
    ];

    const token = new ethers.Contract(tokenAddress, erc20Abi, wallet);
    const wmatic = new ethers.Contract(ADDR.WMATIC, wmaticAbi, wallet);
    const factory = new ethers.Contract(ADDR.FACTORY, factoryAbi, wallet);
    const nfpm = new ethers.Contract(ADDR.NFPM, nfpmAbi, wallet);

    // Determine decimals, balances
    let decimals = 18;
    try {
      decimals = Number(await token.decimals());
    } catch {
      decimals = 18;
    }

    const totalSupply = await token.totalSupply().catch(() => null);
    const serviceBalance = await token.balanceOf(wallet.address);

    console.log('🔍 Token info:', {
      tokenAddress,
      decimals,
      serviceBalance: serviceBalance?.toString?.(),
      totalSupply: totalSupply?.toString?.(),
      retentionPercentage
    });

    // Amounts
    const maticWei = ethers.parseEther(liquidityMaticAmount.toString());

    // Preflight MATIC balance
    const maticBal = await provider.getBalance(wallet.address);
    if (maticBal < maticWei) {
      throw new Error(`Insufficient MATIC: need ${liquidityMaticAmount}, have ${ethers.formatEther(maticBal)}`);
    }

    // Wrap MATIC
    console.log('🔄 Wrapping MATIC...');
    const wrapTx = await wmatic.deposit({ value: maticWei, gasPrice, gasLimit: 120000n });
    await wrapTx.wait();

    // Token order
    const token0 = tokenAddress.toLowerCase() < ADDR.WMATIC.toLowerCase() ? tokenAddress : ADDR.WMATIC;
    const token1 = tokenAddress.toLowerCase() < ADDR.WMATIC.toLowerCase() ? ADDR.WMATIC : tokenAddress;

    // Approvals
    console.log('🔄 Approving token and WMATIC for NFPM...');
    const approve1 = await token.approve(ADDR.NFPM, serviceBalance, { gasPrice, gasLimit: 120000n });
    await approve1.wait();
    const approve2 = await wmatic.approve(ADDR.NFPM, maticWei, { gasPrice, gasLimit: 120000n });
    await approve2.wait();

    // Desired amounts depend on token order
    const amount0Desired = token0 === tokenAddress ? serviceBalance : maticWei;
    const amount1Desired = token1 === tokenAddress ? serviceBalance : maticWei;

    // Initialize pool at ~1:1 (2**96)
    const sqrtPriceX96 = 2n ** 96n;
    console.log('🔄 Creating/initializing pool if necessary...');
    const createPoolTx = await nfpm.createAndInitializePoolIfNecessary(
      token0,
      token1,
      3000,
      sqrtPriceX96,
      { gasPrice, gasLimit: 900000n }
    );
    await createPoolTx.wait();

    const poolAddress = await factory.getPool(token0, token1, 3000);
    console.log('🏊 Pool:', poolAddress);

    // Full-range ticks
    const tickLower = -887220;
    const tickUpper = 887220;

    console.log('🔄 Minting liquidity...');
    const paramsMint = {
      token0,
      token1,
      fee: 3000,
      tickLower,
      tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min: 0n,
      amount1Min: 0n,
      recipient: wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 20 * 60
    };

    const mintTx = await nfpm.mint(paramsMint, { gasPrice, gasLimit: 1500000n });
    await mintTx.wait();

    console.log('✅ LP FINALIZER COMPLETE');
    return {
      success: true,
      poolAddress,
      txHash: mintTx.hash,
      maticAmount: liquidityMaticAmount.toString(),
      tokenAmount: ethers.formatUnits(serviceBalance, decimals),
      message: 'Liquidity added successfully'
    };
  } catch (error) {
    console.error('💥 LP FINALIZER FAILED:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

module.exports = { main };
