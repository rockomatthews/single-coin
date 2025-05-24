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
  };
  calculateFee: () => string;
  calculateTotalCost: () => string;
}

export default function TokenReview({
  tokenParams,
  calculateFee,
  calculateTotalCost,
}: TokenReviewProps) {
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
            <Typography variant="subtitle2">To Liquidity</Typography>
            <Typography variant="body1" gutterBottom>
              {Math.floor(tokenParams.supply * ((100 - tokenParams.retentionPercentage) / 100)).toLocaleString()} tokens ({100 - tokenParams.retentionPercentage}%)
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Liquidity Settings
        </Typography>
        {tokenParams.createPool ? (
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
        ) : (
          <Typography variant="body1" gutterBottom>No liquidity pool will be created</Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mt: 2 }}>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">Platform Fee:</Typography>
              <Typography variant="subtitle2" fontWeight="bold">
                {calculateFee()} SOL
              </Typography>
            </Box>
            
            {tokenParams.createPool && (
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
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold">Total Cost:</Typography>
              <Typography variant="subtitle2" fontWeight="bold" color="primary">
                {calculateTotalCost()} SOL
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