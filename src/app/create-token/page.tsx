'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Stepper, 
  Step, 
  StepLabel, 
  Paper,
  Button,
  CircularProgress
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useHyperLiquid } from '../../components/HyperLiquidProvider';
import { usePolygon } from '../../components/PolygonProvider';
import { useBase } from '../../components/BaseProvider';
import { useBrc20 } from '../../components/Brc20Provider';
import { useArbitrum } from '../../components/ArbitrumProvider';
import { useTron } from '../../components/TronProvider';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

import TokenSettings from '../../components/token/TokenSettings';
import TokenDistribution from '../../components/token/TokenDistribution';
import TokenLiquidity from '../../components/token/TokenLiquidity';
import TokenReview from '../../components/token/TokenReview';
import TokenSuccess from '../../components/token/TokenSuccess';
import { useTokenCreation } from '../../hooks/useTokenCreation';
import { useMultiChainTokenCreation } from '../../hooks/useMultiChainTokenCreation';
import { calculateFee as calculatePlatformFee } from '../../utils/solana';

const steps = ['Token Settings', 'Token Distribution', 'Add Liquidity', 'Review'];

const DEFAULT_TOKEN_PARAMS = {
  name: '',
  symbol: '',
  description: '',
  image: 'https://via.placeholder.com/200?text=Token+Logo',
  website: '',
  twitter: '',
  telegram: '',
  discord: '',
  blockchain: 'solana' as 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bitcoin' | 'arbitrum' | 'tron',
  decimals: 9,
  supply: 1000000000,
  retentionPercentage: 20,
  liquiditySolAmount: 0.5, // Legacy field for Solana
  createPool: true,
  // Chain-specific liquidity amounts
  polygon: { liquidityMaticAmount: 0.5 },
  base: { liquidityEthAmount: 0.001 },
  arbitrum: { liquidityEthAmount: 0.001 },
  tron: { liquidityTrxAmount: 100 },
  // Security features - default to false for user choice
  revokeUpdateAuthority: false,
  revokeFreezeAuthority: false,
  revokeMintAuthority: false,
};

type TokenParamsType = typeof DEFAULT_TOKEN_PARAMS;

export default function CreateTokenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connected: solanaConnected } = useWallet();
  const { connected: hyperLiquidConnected, address: hyperLiquidAddress, signer: hyperLiquidSigner } = useHyperLiquid();
  const { connected: polygonConnected, address: polygonAddress, signer: polygonSigner } = usePolygon();
  const { connected: baseConnected, address: baseAddress, signer: baseSigner } = useBase();
  const { connected: bitcoinConnected, address: bitcoinAddress } = useBrc20();
  const { isConnected: arbitrumConnected, account: arbitrumAddress, signer: arbitrumSigner } = useArbitrum();
  const { isConnected: tronConnected, account: tronAddress } = useTron();
  
  const isConnected = solanaConnected || hyperLiquidConnected || polygonConnected || baseConnected || bitcoinConnected || arbitrumConnected || tronConnected;
  const connectedBlockchain = solanaConnected ? 'solana' 
    : hyperLiquidConnected ? 'hyperliquid' 
    : polygonConnected ? 'polygon' 
    : baseConnected ? 'base'
    : bitcoinConnected ? 'bitcoin'
    : arbitrumConnected ? 'arbitrum'
    : tronConnected ? 'tron' 
    : null;
  
  const solanaCreation = useTokenCreation();
  const multiChainCreation = useMultiChainTokenCreation();
  
  // Helper function to get wallet and network info
  const getWalletInfo = () => {
    if (solanaConnected) {
      return { wallet: 'Phantom', network: 'Solana', blockchain: 'solana' };
    } else if (hyperLiquidConnected) {
      return { wallet: 'MetaMask', network: 'HYPER LIQUID', blockchain: 'hyperliquid' };
    } else if (polygonConnected) {
      return { wallet: 'MetaMask', network: 'Polygon', blockchain: 'polygon' };
    } else if (baseConnected) {
      return { wallet: 'MetaMask', network: 'BASE', blockchain: 'base' };
    } else if (bitcoinConnected) {
      return { wallet: 'Unisat', network: 'Bitcoin', blockchain: 'bitcoin' };
    } else if (arbitrumConnected) {
      return { wallet: 'MetaMask', network: 'Arbitrum', blockchain: 'arbitrum' };
    } else if (tronConnected) {
      return { wallet: 'TronLink', network: 'TRON', blockchain: 'tron' };
    }
    return { wallet: '', network: '', blockchain: null };
  };
  
  const walletInfo = getWalletInfo();
  
  // Use the appropriate hook based on connected blockchain
  const activeCreation = connectedBlockchain === 'solana' ? solanaCreation : multiChainCreation;
  
  const [activeStep, setActiveStep] = useState(0);
  const [tokenParams, setTokenParams] = useState(DEFAULT_TOKEN_PARAMS);
  const [creationResult, setCreationResult] = useState<{ 
    tokenAddress: string | null;
    poolTxId: string | null;
  } | null>(null);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);
  
  // Auto-redirect to home if not connected (with delay to allow wallet to connect)
  useEffect(() => {
    // Check URL first
    const skipCheck = searchParams.get('skipCheck') === 'true';
    
    // Add a small delay to allow wallet to connect on page load
    const timer = setTimeout(() => {
      setIsCheckingWallet(false);
      if (!skipCheck && !isConnected) {
        console.log('Redirecting to home - wallet not connected');
        router.push('/');
      }
    }, 2000); // 2 second delay to allow wallet connection
    
    return () => clearTimeout(timer);
  }, [isConnected, router, searchParams]);

  // Auto-set blockchain based on connected wallet
  useEffect(() => {
    if (connectedBlockchain && tokenParams.blockchain !== connectedBlockchain) {
      setTokenParams(prev => ({
        ...prev,
        blockchain: connectedBlockchain
      }));
    }
  }, [connectedBlockchain, tokenParams.blockchain]);

  // Handle advancing to next step
  const handleNext = useCallback(() => {
    if (activeStep === steps.length - 1) {
      // This is the final step, initialize token creation process
      createTokenWithParams();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  }, [activeStep, steps.length]);

  // Handle going back to previous step
  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => prevStep - 1);
  }, []);

  // Update token parameters
  const updateTokenParams = useCallback((newParams: Partial<TokenParamsType>) => {
    setTokenParams(prevParams => ({
      ...prevParams,
      ...newParams
    }));
  }, []);

  // Create token with parameters
  const createTokenWithParams = useCallback(async () => {
    if (activeCreation.isCreating) return;
    
    // Calculate token amounts based on percentages
    const retentionPercentage = tokenParams.retentionPercentage || 20;
    const totalSupply = tokenParams.supply;
    const retainedAmount = Math.floor(totalSupply * (retentionPercentage / 100));
    const liquidityAmount = totalSupply - retainedAmount;
    
    if (connectedBlockchain === 'solana') {
      // Use Solana-specific creation
      const result = await solanaCreation.createToken({
        ...tokenParams,
        retainedAmount,
        liquidityAmount,
        // FORCE these security settings to be enabled for ALL tokens
        revokeUpdateAuthority: true,  // Always revoke update authority
        revokeFreezeAuthority: true,  // Always revoke freeze authority  
        revokeMintAuthority: true,    // Always revoke mint authority (make unmintable)
      });
      
      if (result) {
        setCreationResult({
          tokenAddress: result.tokenAddress,
          poolTxId: result.poolTxId ?? null,
        });
        setActiveStep(steps.length); // Move to success step
      }
    } else if (connectedBlockchain === 'hyperliquid') {
      // Use HYPER LIQUID creation via multi-chain hook
      const unifiedParams = {
        name: tokenParams.name,
        symbol: tokenParams.symbol,
        description: tokenParams.description,
        image: tokenParams.image,
        website: tokenParams.website,
        twitter: tokenParams.twitter,
        telegram: tokenParams.telegram,
        discord: tokenParams.discord,
        blockchain: 'hyperliquid' as const,
        retentionPercentage,
        retainedAmount,
        liquidityAmount,
        createPool: tokenParams.createPool,
        hyperliquid: {
          tokenStandard: 'HIP-1' as const,
          szDecimals: 6,
          weiDecimals: 18,
          maxSupply: totalSupply,
          enableHyperliquidity: tokenParams.createPool,
          initialPrice: 1.0,
          orderSize: 1000,
          numberOfOrders: 10,
          maxGas: 5000,
        },
      };
      
      console.log('🔥 Creating HYPER LIQUID token with params:', unifiedParams);
      
      const result = await multiChainCreation.createToken(unifiedParams, hyperLiquidSigner || undefined);
      
      if (result && result.success) {
        setCreationResult({
          tokenAddress: result.tokenAddress || null,
          poolTxId: result.poolTxId || null,
        });
        setActiveStep(steps.length); // Move to success step
      }
    } else if (connectedBlockchain === 'polygon') {
      // Use Polygon creation via multi-chain hook
      const unifiedParams = {
        name: tokenParams.name,
        symbol: tokenParams.symbol,
        description: tokenParams.description,
        image: tokenParams.image,
        website: tokenParams.website,
        twitter: tokenParams.twitter,
        telegram: tokenParams.telegram,
        discord: tokenParams.discord,
        blockchain: 'polygon' as const,
        retentionPercentage,
        retainedAmount,
        liquidityAmount,
        polygon: {
          decimals: 18,
          totalSupply: totalSupply,
          createLiquidity: tokenParams.createPool,
          liquidityMaticAmount: tokenParams.polygon?.liquidityMaticAmount || 0,
          dexChoice: 'uniswap-v3' as const,
        },
      };
      
      console.log('🔷 Creating Polygon token with params:', unifiedParams);
      
      const result = await multiChainCreation.createToken(unifiedParams, polygonSigner || undefined);
      
      if (result && result.success) {
        setCreationResult({
          tokenAddress: result.tokenAddress || null,
          poolTxId: result.poolTxId || null,
        });
        setActiveStep(steps.length); // Move to success step
      }
    }
  }, [tokenParams, activeCreation.isCreating, connectedBlockchain, solanaCreation, multiChainCreation, polygonSigner]);
  
  // Calculate fee based on parameters using the centralized fee calculation
  const calculateFee = useCallback(() => {
    const retentionPercentage = tokenParams.retentionPercentage || 20;
    if (connectedBlockchain === 'hyperliquid') {
      // HYPER LIQUID has retention-based fee structure (much more affordable)
      const baseFee = 0.1; // Base 0.1 HYPE (very low)
      const retentionMultiplier = Math.pow(retentionPercentage / 100, 2); // Quadratic scaling
      const fee = baseFee + (retentionMultiplier * 0.4); // Max fee ~0.5 HYPE at 100% retention
      return fee.toFixed(4);
    }
    return calculatePlatformFee(retentionPercentage).toFixed(4);
  }, [tokenParams.retentionPercentage, connectedBlockchain]);

  // Calculate total cost (platform fee + liquidity + protocol fees)
  const calculateTotalCost = useCallback(() => {
    const platformFee = parseFloat(calculateFee());
    
    if (connectedBlockchain === 'hyperliquid') {
      // HYPER LIQUID costs are just the deployment fee
      return platformFee.toFixed(4);
    }
    
    // Get chain-specific liquidity amount and protocol fees
    let liquidityAmount = 0;
    let protocolFees = 0;
    
    switch (connectedBlockchain) {
      case 'polygon':
        liquidityAmount = tokenParams.polygon?.liquidityMaticAmount || 0;
        protocolFees = 0.01; // Polygon pool creation costs
        break;
      case 'base':
        liquidityAmount = tokenParams.base?.liquidityEthAmount || 0;
        protocolFees = 0.001; // BASE pool creation costs
        break;
      case 'arbitrum':
        liquidityAmount = tokenParams.arbitrum?.liquidityEthAmount || 0;
        protocolFees = 0.001; // Arbitrum pool creation costs
        break;
      case 'tron':
        liquidityAmount = tokenParams.tron?.liquidityTrxAmount || 0;
        protocolFees = 50; // TRON pool creation costs
        break;
      case 'solana':
      default:
        liquidityAmount = tokenParams.liquiditySolAmount || 0;
        protocolFees = 0.154; // Raydium pool creation costs
        break;
    }
    
    return (platformFee + liquidityAmount + protocolFees).toFixed(4);
  }, [calculateFee, tokenParams, connectedBlockchain]);

  // Convert SOL to lamports
  const solToLamports = useCallback((solAmount: number) => {
    return Math.floor(solAmount * LAMPORTS_PER_SOL);
  }, []);

  // Render the current step content
  const getStepContent = useCallback((step: number) => {
    switch (step) {
      case 0:
        return <TokenSettings 
          tokenParams={tokenParams} 
          updateTokenParams={updateTokenParams}
          walletInfo={walletInfo}
        />;
      case 1:
        return <TokenDistribution 
          tokenParams={{...tokenParams, blockchain: connectedBlockchain || tokenParams.blockchain}} 
          updateTokenParams={updateTokenParams}
          calculateFee={calculateFee}
          walletInfo={walletInfo}
        />;
      case 2:
        return <TokenLiquidity 
          tokenParams={{...tokenParams, blockchain: connectedBlockchain || tokenParams.blockchain}} 
          updateTokenParams={updateTokenParams}
          calculateTotalCost={calculateTotalCost}
          walletInfo={walletInfo}
        />;
      case 3:
        return <TokenReview 
          tokenParams={{...tokenParams, blockchain: connectedBlockchain || tokenParams.blockchain}}
          calculateFee={calculateFee}
          calculateTotalCost={calculateTotalCost}
          walletInfo={walletInfo}
        />;
      case 4:
        return <TokenSuccess tokenAddress={
          creationResult?.tokenAddress || 
          (connectedBlockchain === 'solana' ? solanaCreation.tokenAddress : multiChainCreation.result?.tokenAddress) || 
          null
        } />;
      default:
        return 'Unknown step';
    }
  }, [
    tokenParams, 
    updateTokenParams, 
    calculateFee, 
    calculateTotalCost, 
    creationResult,
    connectedBlockchain,
    solanaCreation.tokenAddress,
    multiChainCreation.result
  ]);

  // Show loading while checking wallet connection
  if (isCheckingWallet) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">
            Checking wallet connection...
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Connect Your Wallet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Please connect your wallet to create a token. Choose between Solana (Phantom), HYPER LIQUID (MetaMask), Polygon (MetaMask), BASE (MetaMask), Bitcoin (Unisat), Arbitrum (MetaMask), or TRON (TronLink) networks.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/')}
            sx={{ mt: 2 }}
          >
            Go Back to Homepage
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
          Create Your Own Token
        </Typography>
        
        {activeStep < steps.length && (
          <Box sx={{ mt: 4, mb: 5 }}>
            {/* Mobile Stepper */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <Stepper 
                activeStep={activeStep} 
                orientation="vertical"
                sx={{ 
                  '& .MuiStepLabel-label': {
                    fontSize: '0.75rem'
                  }
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            
            {/* Desktop Stepper */}
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Stepper 
                activeStep={activeStep} 
                orientation="horizontal"
                sx={{ 
                  '& .MuiStepLabel-label': {
                    fontSize: '0.875rem'
                  }
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Box>
        )}
        
        <Box>
          {getStepContent(activeStep)}
          
          {activeCreation.error && (
            <Box mt={2} p={2} bgcolor="error.light" borderRadius={1}>
              <Typography color="error" variant="body1">
                Error: {activeCreation.error}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            {activeStep > 0 && activeStep < steps.length && (
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={activeCreation.isCreating}
              >
                Back
              </Button>
            )}
            
            {activeStep < steps.length && (
              <Button
                variant="contained"
                color={activeStep === steps.length - 1 ? "success" : "primary"}
                onClick={handleNext}
                disabled={activeCreation.isCreating}
                sx={{ ml: 'auto' }}
                startIcon={activeCreation.isCreating ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {activeStep === steps.length - 1 
                  ? (activeCreation.isCreating ? 'Creating...' : `Create ${walletInfo.network} Token`)
                  : 'Next'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
} 