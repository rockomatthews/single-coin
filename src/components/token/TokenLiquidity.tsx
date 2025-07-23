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
    liquiditySolAmount: number; // Legacy field for Solana
    createPool: boolean;
    blockchain?: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron';
    // Chain-specific liquidity amounts
    polygon?: { liquidityMaticAmount?: number; };
    base?: { liquidityEthAmount?: number; };
    arbitrum?: { liquidityEthAmount?: number; };
    tron?: { liquidityTrxAmount?: number; };
  };
  updateTokenParams: (params: any) => void; // Use any to avoid complex type matching
  calculateTotalCost: () => string;
  walletInfo?: {
    wallet: string;
    network: string;
    blockchain: string | null;
  };
}

export default function TokenLiquidity({
  tokenParams,
  updateTokenParams,
  calculateTotalCost,
  walletInfo,
}: TokenLiquidityProps) {
  const getCurrency = () => {
    switch (tokenParams.blockchain) {
      case 'hyperliquid': return 'HYPE';
      case 'polygon': return 'MATIC';
      case 'base': return 'ETH';
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
      case 'arbitrum': return 'Camelot';
      case 'tron': return 'JustSwap';
      case 'bitcoin': return 'No DEX (BRC-20 Inscriptions)';
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
      case 'arbitrum': return tokenParams.arbitrum?.liquidityEthAmount || 0;
      case 'tron': return tokenParams.tron?.liquidityTrxAmount || 0;
      case 'solana':
      default: return tokenParams.liquiditySolAmount || 0;
    }
  };
  
  const liquidityAmount = getLiquidityAmount();

  // Handle liquidity amount slider change
  const handleLiquidityAmountChange = (_: Event, value: number | number[]) => {
    const amount = value as number;
    
    // Update the appropriate field based on blockchain
    switch (tokenParams.blockchain) {
      case 'polygon':
        updateTokenParams({ 
          polygon: { ...tokenParams.polygon, liquidityMaticAmount: amount }
        });
        break;
      case 'base':
        updateTokenParams({ 
          base: { ...tokenParams.base, liquidityEthAmount: amount }
        });
        break;
      case 'arbitrum':
        updateTokenParams({ 
          arbitrum: { ...tokenParams.arbitrum, liquidityEthAmount: amount }
        });
        break;
      case 'tron':
        updateTokenParams({ 
          tron: { ...tokenParams.tron, liquidityTrxAmount: amount }
        });
        break;
      case 'solana':
      default:
        updateTokenParams({ liquiditySolAmount: amount });
        break;
    }
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
          ⚡ {walletInfo?.network || 'HYPER LIQUID'} ORDERBOOK TRADING
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enable your token for trading on {walletInfo?.network || 'HYPER LIQUID'}'s native orderbook with professional market making features.
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            🚀 NATIVE ORDERBOOK TRADING
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Your token will be tradeable on {walletInfo?.network || 'HYPER LIQUID'}'s advanced trading infrastructure:
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
            label={`Enable trading on ${walletInfo?.network || 'HYPER LIQUID'} (Recommended)`}
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
                  • Token standard: HIP-1 ({walletInfo?.network || 'HYPER LIQUID'} native)<br/>
                  • Orderbook: Native {walletInfo?.network || 'HYPER LIQUID'} exchange<br/>
                  • Market making: Available with initial orders<br/>
                  • <strong>Total cost: {calculateTotalCost()} HYPE</strong>
                </Typography>
              </Alert>

              <Typography variant="body2" color="text.secondary">
                {walletInfo?.network || 'HYPER LIQUID'} uses native orderbook trading instead of AMM pools. Your tokens will be immediately available for professional trading.
              </Typography>
            </>
          )}

          {!tokenParams.createPool && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Without enabling trading, your tokens won't be available on the {walletInfo?.network || 'HYPER LIQUID'} exchange. You can enable trading later.
              </Typography>
            </Alert>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Total Cost: {calculateTotalCost()} {currency}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Includes token deployment and trading setup costs
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Bitcoin special case
  if (isBitcoin) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          ⛏️ BITCOIN BRC-20 INSCRIPTION
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create a <strong>BRC-20 inscription</strong> on the Bitcoin blockchain. BRC-20 tokens are traded on specialized marketplaces and require manual inscription processes.
        </Typography>

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            ⚠️ NO TRADITIONAL LIQUIDITY POOLS
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Bitcoin BRC-20 tokens work differently from other blockchains:
          </Typography>
          <Box component="ul" sx={{ margin: 0, paddingLeft: 2 }}>
            <li>⚠️ <strong>No DEX pools</strong> - Traded on specialized marketplaces</li>
            <li>⚠️ <strong>Manual inscriptions</strong> - Each transfer requires inscription</li>
            <li>⚠️ <strong>Higher fees</strong> - Bitcoin network transaction costs</li>
            <li>⚠️ <strong>Limited liquidity</strong> - Depends on marketplace adoption</li>
          </Box>
        </Alert>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Total Cost: {calculateTotalCost()} {currency}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Includes inscription fees and Bitcoin network costs
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Multi-chain DEX UI
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        🏊 LIVE {dexName.toUpperCase()} POOL CREATION
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a <strong>REAL {dexName} pool</strong> that makes your tokens <strong>instantly tradeable</strong> on {walletInfo?.network || tokenParams.blockchain} DEXes and aggregators.
      </Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          ✨ REAL DEX INTEGRATION - IMMEDIATE TRADING!
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Your token will be <strong>INSTANTLY TRADEABLE</strong> on major {walletInfo?.network || tokenParams.blockchain} DEXes:
        </Typography>
        <Box component="ul" sx={{ margin: 0, paddingLeft: 2 }}>
          {tokenParams.blockchain === 'solana' && (
            <>
              <li>✅ <strong>Raydium</strong> - Native CPMM pool creation</li>
              <li>✅ <strong>Jupiter</strong> - Automatic aggregation</li>
              <li>✅ <strong>DexScreener</strong> - Live price charts</li>
              <li>✅ <strong>Birdeye</strong> - Analytics dashboard</li>
            </>
          )}
          {tokenParams.blockchain === 'polygon' && (
            <>
              <li>✅ <strong>Uniswap V3</strong> - Concentrated liquidity pools</li>
              <li>✅ <strong>1inch</strong> - DEX aggregation</li>
              <li>✅ <strong>DexScreener</strong> - Live price charts</li>
              <li>✅ <strong>CoinGecko</strong> - Price tracking</li>
            </>
          )}
          {tokenParams.blockchain === 'base' && (
            <>
              <li>✅ <strong>Aerodrome</strong> - Native BASE DEX</li>
              <li>✅ <strong>Uniswap V3</strong> - Multi-chain support</li>
              <li>✅ <strong>DexScreener</strong> - Live price charts</li>
              <li>✅ <strong>1inch</strong> - DEX aggregation</li>
            </>
          )}
          {tokenParams.blockchain === 'arbitrum' && (
            <>
              <li>✅ <strong>Camelot</strong> - Native Arbitrum DEX</li>
              <li>✅ <strong>Uniswap V3</strong> - Multi-chain support</li>
              <li>✅ <strong>DexScreener</strong> - Live price charts</li>
              <li>✅ <strong>1inch</strong> - DEX aggregation</li>
            </>
          )}
          {tokenParams.blockchain === 'tron' && (
            <>
              <li>✅ <strong>JustSwap</strong> - Native TRON DEX</li>
              <li>✅ <strong>SunSwap</strong> - Alternative TRON DEX</li>
              <li>✅ <strong>DexScreener</strong> - Live price charts</li>
              <li>✅ <strong>CoinMarketCap</strong> - Price tracking</li>
            </>
          )}
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
          label={`Create LIVE ${dexName} pool (Recommended)`}
          sx={{ mb: 2 }}
        />

        {tokenParams.createPool && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography gutterBottom>
              {currency} amount for initial liquidity: <strong>{liquidityAmount.toFixed(liquidityAmount < 1 ? 4 : 2)} {currency}</strong>
            </Typography>

            <Box sx={{ px: 2, mb: 3 }}>
              <Slider
                value={liquidityAmount}
                onChange={handleLiquidityAmountChange}
                step={currency === 'MATIC' ? 1 : 0.1}
                min={currency === 'MATIC' ? 1 : 0.1}
                max={currency === 'MATIC' ? 500 : 100}
                marks={currency === 'MATIC' ? [
                  { value: 1, label: '1' },
                  { value: 10, label: '10' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                  { value: 500, label: '500' },
                ] : [
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
                • Initial price: {(liquidityAmount / liquidityTokens).toFixed(8)} {currency} per token<br/>
                • Market cap: ${((liquidityAmount / liquidityTokens) * tokenParams.supply * (currency === 'SOL' ? 200 : currency === 'MATIC' ? 1 : currency === 'ETH' ? 3000 : currency === 'TRX' ? 0.1 : 200)).toFixed(0)} (estimated)<br/>
                • Your liquidity: {liquidityAmount.toFixed(liquidityAmount < 1 ? 4 : 2)} {currency} + {liquidityTokens.toLocaleString()} tokens<br/>
                • Platform fee: Retention-based (varies by % kept)<br/>
                • {dexName} pool fees: {currency === 'SOL' ? '0.154' : currency === 'MATIC' ? '0.01' : currency === 'ETH' ? '0.001' : currency === 'TRX' ? '50' : '0.01'} {currency} (protocol costs)<br/>
                • <strong>Total cost: {calculateTotalCost()} {currency}</strong>
              </Typography>
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Platform fee is based on token retention percentage, not liquidity amount. Pool creation uses YOUR {currency} for liquidity, platform only keeps the fee.
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
          Total Cost: {calculateTotalCost()} {currency}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Includes token creation fee + liquidity pool amount
        </Typography>
      </Paper>
    </Box>
  );
} 