'use client';

import React from 'react';
import {
  Box,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  Paper,
  Alert,
  Divider,
} from '@mui/material';

interface TokenLiquidityProps {
  tokenParams: {
    supply: number;
    retentionPercentage: number;
    liquiditySolAmount: number;
    createPool: boolean;
  };
  updateTokenParams: (params: Partial<TokenLiquidityProps['tokenParams']>) => void;
  calculateTotalCost: () => string;
}

export default function TokenLiquidity({
  tokenParams,
  updateTokenParams,
  calculateTotalCost,
}: TokenLiquidityProps) {
  // Handle liquidity SOL amount slider change
  const handleSolAmountChange = (_: Event, value: number | number[]) => {
    updateTokenParams({ liquiditySolAmount: value as number });
  };

  // Handle toggle for creating pool
  const handleCreatePoolToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateTokenParams({ createPool: event.target.checked });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Liquidity Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure how much SOL you want to add to the liquidity pool. More SOL means better initial price stability and exposure.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={tokenParams.createPool}
              onChange={handleCreatePoolToggle}
              color="primary"
            />
          }
          label="Create liquidity pool"
          sx={{ mb: 2 }}
        />

        {tokenParams.createPool && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography gutterBottom>
              SOL amount for initial liquidity: <strong>{tokenParams.liquiditySolAmount.toFixed(2)} SOL</strong>
            </Typography>

            <Box sx={{ px: 2, mb: 3 }}>
              <Slider
                value={tokenParams.liquiditySolAmount}
                onChange={handleSolAmountChange}
                step={0.01}
                min={0.01}
                max={5}
                marks={[
                  { value: 0.01, label: '0.01' },
                  { value: 1, label: '1' },
                  { value: 2.5, label: '2.5' },
                  { value: 5, label: '5' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Fee (3%):</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {(tokenParams.liquiditySolAmount * 0.03).toFixed(4)} SOL
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Tokens for liquidity:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {Math.floor(tokenParams.supply * ((100 - tokenParams.retentionPercentage) / 100)).toLocaleString()}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total cost:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {calculateTotalCost()} SOL
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Paper>

      {tokenParams.createPool ? (
        <Alert severity="info">
          Adding more SOL gives your token better initial price stability and visibility on exchanges.
          The token will be tradable immediately after creation.
        </Alert>
      ) : (
        <Alert severity="warning">
          Without creating a liquidity pool, your token won't be tradable on exchanges. You'll need to manually create a pool later.
        </Alert>
      )}
    </Box>
  );
} 