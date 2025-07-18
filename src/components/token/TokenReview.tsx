'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Stack,
  Alert,
} from '@mui/material';

interface TokenReviewProps {
  tokenParams: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    decimals: number;
    supply: number;
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    retentionPercentage: number;
    createPool: boolean;
    liquiditySolAmount: number;
    blockchain?: 'solana' | 'hyperliquid';
    revokeMintAuthority?: boolean;
    revokeFreezeAuthority?: boolean;
    revokeUpdateAuthority?: boolean;
  };
  calculateFee: () => string;
  calculateTotalCost: () => string;
}

export default function TokenReview({
  tokenParams,
  calculateFee,
  calculateTotalCost,
}: TokenReviewProps) {
  const isHyperLiquid = tokenParams.blockchain === 'hyperliquid';
  const currency = isHyperLiquid ? 'HYPE' : 'SOL';
  
  // Debug logging
  console.log('TokenReview - tokenParams.blockchain:', tokenParams.blockchain);
  console.log('TokenReview - isHyperLiquid:', isHyperLiquid);
  console.log('TokenReview - currency:', currency);
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review and Confirm
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review all token details before creation. Once created, some properties cannot be modified.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Token Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Name</Typography>
            <Typography variant="body1" gutterBottom>{tokenParams.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Symbol</Typography>
            <Typography variant="body1" gutterBottom>{tokenParams.symbol}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Decimals</Typography>
            <Typography variant="body1" gutterBottom>{tokenParams.decimals}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Initial Supply</Typography>
            <Typography variant="body1" gutterBottom>{tokenParams.supply.toLocaleString()}</Typography>
          </Grid>
          
          {tokenParams.description && (
            <Grid item xs={12}>
              <Typography variant="subtitle2">Description</Typography>
              <Typography variant="body1" gutterBottom>{tokenParams.description}</Typography>
            </Grid>
          )}
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Distribution Settings
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">You Keep</Typography>
            <Typography variant="body1" gutterBottom>
              {Math.floor(tokenParams.supply * (tokenParams.retentionPercentage / 100)).toLocaleString()} tokens ({tokenParams.retentionPercentage}%)
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">
              {isHyperLiquid ? 'For Trading' : 'To Liquidity'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {Math.floor(tokenParams.supply * ((100 - tokenParams.retentionPercentage) / 100)).toLocaleString()} tokens ({100 - tokenParams.retentionPercentage}%)
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {isHyperLiquid ? 'Trading Settings' : 'Liquidity Settings'}
        </Typography>
        {tokenParams.createPool ? (
          isHyperLiquid ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Trading Configuration</Typography>
                <Typography variant="body1" gutterBottom>
                  Enabled on HYPER LIQUID native orderbook
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Token Standard</Typography>
                <Typography variant="body1" gutterBottom>HIP-1 (HYPER LIQUID)</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Market Making</Typography>
                <Typography variant="body1" gutterBottom>Native orderbook</Typography>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">SOL for Liquidity</Typography>
                <Typography variant="body1" gutterBottom>{tokenParams.liquiditySolAmount.toFixed(2)} SOL</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Fee (3%)</Typography>
                <Typography variant="body1" gutterBottom>{(tokenParams.liquiditySolAmount * 0.03).toFixed(4)} SOL</Typography>
              </Grid>
            </Grid>
          )
        ) : (
          <Typography variant="body1" gutterBottom>
            {isHyperLiquid ? 'Trading will not be enabled' : 'No liquidity pool will be created'}
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          🔒 Security Features
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {isHyperLiquid ? (
              <Box>
                <Typography variant="body2" gutterBottom sx={{ color: 'success.main' }}>
                  ✅ <strong>HIP-1 Token Standard:</strong> Native HYPER LIQUID security features
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: 'success.main' }}>
                  ✅ <strong>Immutable Supply:</strong> Token supply is fixed and cannot be changed
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: 'success.main' }}>
                  ✅ <strong>Native Orderbook:</strong> Direct integration with HYPER LIQUID exchange
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                  HYPER LIQUID tokens have built-in security features and professional trading capabilities.
                </Typography>
              </Box>
            ) : (
              (tokenParams.revokeMintAuthority || tokenParams.revokeFreezeAuthority || tokenParams.revokeUpdateAuthority) ? (
                <Box>
                  {tokenParams.revokeMintAuthority && (
                    <Typography variant="body2" gutterBottom sx={{ color: 'success.main' }}>
                      ✅ <strong>Make Unmintable:</strong> Mint authority will be revoked - no new tokens can be created
                    </Typography>
                  )}
                  {tokenParams.revokeUpdateAuthority && (
                    <Typography variant="body2" gutterBottom sx={{ color: 'success.main' }}>
                      ✅ <strong>Make Information Immutable:</strong> Update authority will be revoked - metadata cannot be changed
                    </Typography>
                  )}
                  {tokenParams.revokeFreezeAuthority && (
                    <Typography variant="body2" gutterBottom sx={{ color: 'success.main' }}>
                      ✅ <strong>Revoke Freeze Authority:</strong> Token accounts cannot be frozen
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                    These security features will show as green checkmarks in Phantom wallet and build trust with holders.
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No additional security features selected. Consider enabling these for increased trust.
                </Typography>
              )
            )}
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mt: 2 }}>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">
                {isHyperLiquid ? 'Deployment Fee:' : 'Platform Fee:'}
              </Typography>
              <Typography variant="subtitle2" fontWeight="bold">
                {calculateFee()} {currency}
              </Typography>
            </Box>
            
            {tokenParams.createPool && !isHyperLiquid && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2">Your Liquidity:</Typography>
                  <Typography variant="subtitle2">
                    {tokenParams.liquiditySolAmount.toFixed(4)} SOL
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2">Raydium Pool Fees:</Typography>
                  <Typography variant="subtitle2">
                    0.154 SOL
                  </Typography>
                </Box>
              </>
            )}
            
            {isHyperLiquid && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">Trading Setup:</Typography>
                <Typography variant="subtitle2" color="success.main">
                  Included
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold">Total Cost:</Typography>
              <Typography variant="subtitle2" fontWeight="bold" color="primary">
                {calculateTotalCost()} {currency}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Alert severity="info" sx={{ mb: 2 }}>
        You will need to approve a transaction to create this token. Make sure all the details are correct before proceeding.
      </Alert>
      
      {tokenParams.retentionPercentage > 80 && (
        <Alert severity="warning">
          Keeping more than 80% of tokens significantly increases your fee and may reduce market liquidity.
        </Alert>
      )}
    </Box>
  );
} 