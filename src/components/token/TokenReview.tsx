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
  tokenParams: any; // Use any to avoid complex type matching
  calculateFee: () => string;
  calculateTotalCost: () => string;
  walletInfo?: {
    wallet: string;
    network: string;
    blockchain: string | null;
  };
}

export default function TokenReview({
  tokenParams,
  calculateFee,
  calculateTotalCost,
  walletInfo,
}: TokenReviewProps) {
  const getCurrency = () => {
    switch (tokenParams.blockchain) {
      case 'hyperliquid': return 'HYPE';
      case 'polygon': return 'MATIC';
      case 'base': return 'ETH';
      case 'bnb': return 'BNB';
      case 'bitcoin': return 'BTC';
      case 'arbitrum': return 'ETH';
      case 'tron': return 'TRX';
      case 'solana':
      default: return 'SOL';
    }
  };
  
  const getDEXName = () => {
    switch (tokenParams.blockchain) {
      case 'solana': return 'Raydium';
      case 'polygon': return 'Uniswap V3';
      case 'base': return 'Aerodrome';
      case 'bnb': return 'PancakeSwap V3';
      case 'arbitrum': return 'Camelot';
      case 'tron': return 'JustSwap';
      case 'bitcoin': return 'No DEX (BRC-20)';
      case 'hyperliquid': return 'Native Orderbook';
      default: return 'DEX';
    }
  };
  
  
  const currency = getCurrency();
  const dexName = getDEXName();
  const isHyperLiquid = tokenParams.blockchain === 'hyperliquid';
  const isBitcoin = tokenParams.blockchain === 'bitcoin';
  
  // Get the appropriate liquidity amount based on blockchain
  const getLiquidityAmount = () => {
    switch (tokenParams.blockchain) {
      case 'polygon': return tokenParams.polygon?.liquidityMaticAmount || 0;
      case 'base': return tokenParams.base?.liquidityEthAmount || 0;
      case 'bnb': return tokenParams.bnb?.liquidityBnbAmount || 0;
      case 'arbitrum': return tokenParams.arbitrum?.liquidityEthAmount || 0;
      case 'tron': return tokenParams.tron?.liquidityTrxAmount || 0;
      case 'solana':
      default: return tokenParams.liquiditySolAmount || 0;
    }
  };
  
  const liquidityAmount = getLiquidityAmount();
  
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
                <Typography variant="subtitle2">{currency} for Liquidity</Typography>
                <Typography variant="body1" gutterBottom>{liquidityAmount.toFixed(liquidityAmount < 1 ? 4 : 2)} {currency}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Tokens for Liquidity</Typography>
                <Typography variant="body1" gutterBottom>{Math.floor(tokenParams.supply * ((100 - tokenParams.retentionPercentage) / 100)).toLocaleString()} tokens</Typography>
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
                    These security features will show as green checkmarks in {walletInfo?.wallet || 'wallet'} and build trust with holders.
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
                    {liquidityAmount.toFixed(liquidityAmount < 1 ? 4 : 2)} {currency}
                  </Typography>
                </Box>
                
                {!isBitcoin && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">{dexName} Pool Fees:</Typography>
                    <Typography variant="subtitle2">
                      {currency === 'SOL' ? '0.154' : currency === 'MATIC' ? '0.01' : currency === 'ETH' ? '0.001' : currency === 'TRX' ? '50' : '0.01'} {currency}
                    </Typography>
                  </Box>
                )}
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
        You will need to approve a transaction in {walletInfo?.wallet || 'your wallet'} to create this token. Make sure all the details are correct before proceeding.
      </Alert>
      
      {tokenParams.retentionPercentage > 80 && (
        <Alert severity="warning">
          Keeping more than 80% of tokens significantly increases your fee and may reduce market liquidity.
        </Alert>
      )}
    </Box>
  );
} 