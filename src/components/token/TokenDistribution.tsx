'use client';

import React from 'react';
import {
  Box,
  Typography,
  Slider,
  Grid,
  Stack,
  Paper,
  Alert,
} from '@mui/material';

interface TokenDistributionProps {
  tokenParams: {
    supply: number;
    retentionPercentage: number;
    blockchain?: 'solana' | 'hyperliquid';
  };
  updateTokenParams: (params: Partial<TokenDistributionProps['tokenParams']>) => void;
  calculateFee: () => string;
}

export default function TokenDistribution({
  tokenParams,
  updateTokenParams,
  calculateFee,
}: TokenDistributionProps) {
  // Handle retention slider change
  const handleRetentionChange = (_: Event, value: number | number[]) => {
    updateTokenParams({ retentionPercentage: value as number });
  };

  const isHyperLiquid = tokenParams.blockchain === 'hyperliquid';
  const currency = isHyperLiquid ? 'HYPE' : 'SOL';

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Token Distribution
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {isHyperLiquid 
          ? "Decide how many tokens you want to keep and how many will be available for initial trading on HYPER LIQUID's native orderbook. Keeping a higher percentage increases the creation fee."
          : "Decide how many tokens you want to keep and how many will be sent to liquidity pools. Keeping a higher percentage increases the creation fee."
        }
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography id="retention-slider" gutterBottom>
              Percentage of tokens to keep: <strong>{tokenParams.retentionPercentage}%</strong>
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={tokenParams.retentionPercentage}
                onChange={handleRetentionChange}
                aria-labelledby="retention-slider"
                valueLabelDisplay="auto"
                step={1}
                min={5}
                max={95}
                marks={[
                  { value: 5, label: '5%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 95, label: '95%' },
                ]}
              />
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">You keep:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {Math.floor(tokenParams.supply * (tokenParams.retentionPercentage / 100)).toLocaleString()} tokens ({tokenParams.retentionPercentage}%)
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                {isHyperLiquid ? 'For trading:' : 'To liquidity pools:'}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {Math.floor(tokenParams.supply * ((100 - tokenParams.retentionPercentage) / 100)).toLocaleString()} tokens ({100 - tokenParams.retentionPercentage}%)
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Creation fee:</Typography>
              <Typography variant="body2" fontWeight="bold" color={tokenParams.retentionPercentage > 75 ? 'error' : 'inherit'}>
                {calculateFee()} {currency}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Alert severity="info">
        {isHyperLiquid 
          ? `The remaining ${100 - tokenParams.retentionPercentage}% of tokens will be available for trading on HYPER LIQUID's native orderbook, enabling immediate price discovery and trading.`
          : `The remaining ${100 - tokenParams.retentionPercentage}% of tokens will be used to create liquidity pools on decentralized exchanges, making your token tradable.`
        }
      </Alert>
      
      {tokenParams.retentionPercentage > 80 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {isHyperLiquid
            ? "Keeping more than 80% of tokens significantly increases your fee and may reduce initial trading volume."
            : "Keeping more than 80% of tokens significantly increases your fee and may reduce market liquidity."
          }
        </Alert>
      )}
    </Box>
  );
} 