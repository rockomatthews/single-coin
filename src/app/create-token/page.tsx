'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Stepper, 
  Step, 
  StepLabel, 
  Paper 
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

import TokenSettings from '../../components/token/TokenSettings';
import TokenDistribution from '../../components/token/TokenDistribution';
import TokenLiquidity from '../../components/token/TokenLiquidity';
import TokenReview from '../../components/token/TokenReview';
import TokenSuccess from '../../components/token/TokenSuccess';
import { useTokenCreation } from '../../hooks/useTokenCreation';

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
  decimals: 9,
  supply: 1000000000,
  retentionPercentage: 20,
  liquiditySolAmount: 0.1,
  createPool: true,
};

export default function CreateTokenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connected } = useWallet();
  const { createToken, isCreating, error, success, tokenAddress } = useTokenCreation();
  
  const [activeStep, setActiveStep] = useState(0);
  const [tokenParams, setTokenParams] = useState(DEFAULT_TOKEN_PARAMS);
  const [creationResult, setCreationResult] = useState<{ 
    tokenAddress: string | null;
    poolTxId: string | null;
  } | null>(null);
  
  // Auto-redirect to home if not connected
  useEffect(() => {
    // Check URL first
    const skipCheck = searchParams.get('skipCheck') === 'true';
    
    if (!skipCheck && !connected) {
      router.push('/');
    }
  }, [connected, router, searchParams]);

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
  const updateTokenParams = useCallback((newParams: Partial<typeof DEFAULT_TOKEN_PARAMS>) => {
    setTokenParams(prevParams => ({
      ...prevParams,
      ...newParams
    }));
  }, []);

  // Create token with parameters
  const createTokenWithParams = useCallback(async () => {
    if (isCreating) return;
    
    // Calculate token amounts based on percentages
    const retentionPercentage = tokenParams.retentionPercentage || 20;
    const totalSupply = tokenParams.supply;
    const retainedAmount = Math.floor(totalSupply * (retentionPercentage / 100));
    const liquidityAmount = totalSupply - retainedAmount;
    
    // Execute token creation with updated parameters
    const result = await createToken({
      ...tokenParams,
      retainedAmount,
      liquidityAmount,
    });
    
    if (result) {
      setCreationResult({
        tokenAddress: result.tokenAddress,
        poolTxId: result.poolTxId,
      });
      setActiveStep(steps.length); // Move to success step
    }
  }, [tokenParams, isCreating, createToken]);
  
  // Calculate fee based on parameters (exponential increase for higher retention)
  const calculateFee = useCallback(() => {
    const BASE_FEE = 0.05; // Base fee in SOL
    const FEE_MULTIPLIER = 0.85; // Multiplier for exponential growth
    const FEE_EXPONENT = 3; // Exponent for curve steepness
    
    // Get retention percentage
    const retentionPercentage = tokenParams.retentionPercentage || 20;
    
    // Calculate fee with exponential increase as retention grows
    // Formula: BASE_FEE + (FEE_MULTIPLIER * (retention/100)^FEE_EXPONENT)
    const calculatedFee = BASE_FEE + (FEE_MULTIPLIER * Math.pow(retentionPercentage/100, FEE_EXPONENT));
    
    // Return fee in SOL with 4 decimal precision
    return Math.min(Math.max(calculatedFee, BASE_FEE), 1.0).toFixed(4);
  }, [tokenParams.retentionPercentage]);

  // Calculate total cost (fee + liquidity)
  const calculateTotalCost = useCallback(() => {
    const fee = parseFloat(calculateFee());
    const liquiditySol = tokenParams.liquiditySolAmount || 0;
    return (fee + liquiditySol).toFixed(4);
  }, [calculateFee, tokenParams.liquiditySolAmount]);

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
        />;
      case 1:
        return <TokenDistribution 
          tokenParams={tokenParams} 
          updateTokenParams={updateTokenParams}
          calculateFee={calculateFee}
        />;
      case 2:
        return <TokenLiquidity 
          tokenParams={tokenParams} 
          updateTokenParams={updateTokenParams}
          calculateTotalCost={calculateTotalCost}
        />;
      case 3:
        return <TokenReview 
          tokenParams={tokenParams}
          calculateFee={calculateFee}
          calculateTotalCost={calculateTotalCost}
        />;
      case 4:
        return <TokenSuccess tokenAddress={creationResult?.tokenAddress || tokenAddress} />;
      default:
        return 'Unknown step';
    }
  }, [
    tokenParams, 
    updateTokenParams, 
    calculateFee, 
    calculateTotalCost, 
    creationResult, 
    tokenAddress
  ]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
          Create Your Own Token
        </Typography>
        
        {activeStep < steps.length && (
          <Stepper activeStep={activeStep} sx={{ mt: 4, mb: 5 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
        
        <Box>
          {getStepContent(activeStep)}
          
          {error && (
            <Box mt={2} p={2} bgcolor="error.light" borderRadius={1}>
              <Typography color="error" variant="body1">
                Error: {error}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            {activeStep > 0 && activeStep < steps.length && (
              <button
                onClick={handleBack}
                className="btn btn-outline-secondary"
                disabled={isCreating}
              >
                Back
              </button>
            )}
            
            {activeStep < steps.length && (
              <button
                onClick={handleNext}
                className={`btn ${activeStep === steps.length - 1 ? 'btn-success' : 'btn-primary'} ms-auto`}
                disabled={isCreating}
              >
                {activeStep === steps.length - 1 ? 'Create Token' : 'Next'}
              </button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
} 