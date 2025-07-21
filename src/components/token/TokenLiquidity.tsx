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
    blockchain?: 'solana' | 'hyperliquid' | 'polygon';
  };
  updateTokenParams: (params: Partial<TokenLiquidityProps['tokenParams']>) => void;
  calculateTotalCost: () => string;
}

export default function TokenLiquidity({
  tokenParams,
  updateTokenParams,
  calculateTotalCost,
}: TokenLiquidityProps) {
  const isHyperLiquid = tokenParams.blockchain === 'hyperliquid';
  const currency = isHyperLiquid ? 'HYPE' : 'SOL';

  // Handle liquidity amount slider change
  const handleLiquidityAmountChange = (_: Event, value: number | number[]) => {
    updateTokenParams({ liquiditySolAmount: value as number });
  };

  // Handle toggle for creating pool/trading
  const handleCreatePoolToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateTokenParams({ createPool: event.target.checked });
  };

  // Calculate tokens for liquidity/trading
  const liquidityTokens = Math.floor(tokenParams.supply * ((100 - tokenParams.retentionPercentage) / 100));

  if (isHyperLiquid) {
    // HYPER LIQUID specific UI
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          ⚡ HYPER LIQUID ORDERBOOK TRADING
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enable your token for trading on HYPER LIQUID's native orderbook with professional market making features.
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            🚀 NATIVE ORDERBOOK TRADING
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Your token will be tradeable on HYPER LIQUID's advanced trading infrastructure:
          </Typography>
          <Box component="ul" sx={{ margin: 0, paddingLeft: 2 }}>
            <li>✅ <strong>Native Orderbook</strong> - Professional trading experience</li>
            <li>✅ <strong>Market Making</strong> - Automated liquidity provision</li>
            <li>✅ <strong>Price Discovery</strong> - Real-time order matching</li>
            <li>✅ <strong>Low Fees</strong> - Minimal trading costs</li>
          </Box>
        </Alert>

        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={tokenParams.createPool}
                onChange={handleCreatePoolToggle}
                color="primary"
              />
            }
            label="Enable trading on HYPER LIQUID (Recommended)"
            sx={{ mb: 2 }}
          />

          {tokenParams.createPool && (
            <>
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  🎯 Trading Configuration:
                </Typography>
                <Typography variant="body2">
                  • Trading tokens: {liquidityTokens.toLocaleString()} tokens ({100 - tokenParams.retentionPercentage}%)<br/>
                  • Token standard: HIP-1 (HYPER LIQUID native)<br/>
                  • Orderbook: Native HYPER LIQUID exchange<br/>
                  • Market making: Available with initial orders<br/>
                  • <strong>Total cost: {calculateTotalCost()} HYPE</strong>
                </Typography>
              </Alert>

              <Typography variant="body2" color="text.secondary">
                HYPER LIQUID uses native orderbook trading instead of AMM pools. Your tokens will be immediately available for professional trading.
              </Typography>
            </>
          )}

          {!tokenParams.createPool && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Without enabling trading, your tokens won't be available on the HYPER LIQUID exchange. You can enable trading later.
              </Typography>
            </Alert>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Total Cost: {calculateTotalCost()} HYPE
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Includes token deployment and trading setup costs
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Original Solana UI
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        🏊 LIVE RAYDIUM POOL CREATION
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a <strong>REAL Raydium CPMM pool</strong> that makes your tokens <strong>instantly tradeable</strong> on all major Solana DEXes including Jupiter, DexScreener, and Birdeye.
      </Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          ✨ REAL DEX INTEGRATION - IMMEDIATE TRADING!
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Your token will be <strong>INSTANTLY TRADEABLE</strong> on all major Solana DEXes:
        </Typography>
        <Box component="ul" sx={{ margin: 0, paddingLeft: 2 }}>
          <li>✅ <strong>Raydium</strong> - Native CPMM pool creation</li>
          <li>✅ <strong>Jupiter</strong> - Automatic aggregation</li>
          <li>✅ <strong>DexScreener</strong> - Live price charts</li>
          <li>✅ <strong>Birdeye</strong> - Analytics dashboard</li>
        </Box>
        <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
          🚀 No manual steps required - trading starts immediately!
        </Typography>
      </Alert>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={tokenParams.createPool}
              onChange={handleCreatePoolToggle}
              color="primary"
            />
          }
          label="Create LIVE Raydium pool (Recommended)"
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
                onChange={handleLiquidityAmountChange}
                step={0.1}
                min={0.1}
                max={100}
                marks={[
                  { value: 0.1, label: '0.1' },
                  { value: 1, label: '1' },
                  { value: 10, label: '10' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            {/* Pool Preview */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                🏊 Pool Details:
              </Typography>
              <Typography variant="body2">
                • Initial price: {(tokenParams.liquiditySolAmount / liquidityTokens).toFixed(8)} SOL per token<br/>
                • Market cap: ${((tokenParams.liquiditySolAmount / liquidityTokens) * tokenParams.supply * 200).toFixed(0)} (assuming $200 SOL)<br/>
                • Your liquidity: {tokenParams.liquiditySolAmount.toFixed(4)} SOL + {liquidityTokens.toLocaleString()} tokens<br/>
                • Platform fee: Retention-based (varies by % kept)<br/>
                • Raydium pool fees: 0.154 SOL (protocol costs)<br/>
                • <strong>Total cost: {calculateTotalCost()} SOL</strong>
              </Typography>
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Platform fee is based on token retention percentage, not liquidity amount. Pool creation uses YOUR SOL for liquidity, platform only keeps the fee.
            </Typography>
          </>
        )}

        {!tokenParams.createPool && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Without a liquidity pool, your tokens won't be tradeable on DEXes. You'll need to create a pool manually later.
            </Typography>
          </Alert>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Total Cost: {calculateTotalCost()} SOL
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Includes token creation fee + liquidity pool amount
        </Typography>
      </Paper>
    </Box>
  );
} 