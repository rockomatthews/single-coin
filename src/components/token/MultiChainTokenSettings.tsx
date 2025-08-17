'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import ChainSelector from '../blockchain/ChainSelector';
import { UnifiedTokenParams } from '@/utils/blockchain-factory';
import { getHyperLiquidConfig } from '@/config/hyperliquid';

interface MultiChainTokenSettingsProps {
  tokenParams: UnifiedTokenParams;
  updateTokenParams: (updates: Partial<UnifiedTokenParams>) => void;
}

export default function MultiChainTokenSettings({
  tokenParams,
  updateTokenParams,
}: MultiChainTokenSettingsProps) {
  const [imagePreview, setImagePreview] = useState<string>('');
  
  useEffect(() => {
    if (tokenParams.image && !tokenParams.image.startsWith('data:') && !tokenParams.image.startsWith('blob:')) {
      setImagePreview(tokenParams.image);
    }
  }, [tokenParams.image]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        updateTokenParams({ image: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChainChange = (blockchain: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron') => {
    // Reset chain-specific params when switching
    updateTokenParams({
      blockchain,
      solana: blockchain === 'solana' ? (tokenParams.solana || {}) : undefined,
      hyperliquid: blockchain === 'hyperliquid' ? (tokenParams.hyperliquid || {}) : undefined,
      polygon: blockchain === 'polygon' ? (tokenParams.polygon || {}) : undefined,
      base: blockchain === 'base' ? (tokenParams.base || {}) : undefined,
      bitcoin: blockchain === 'bitcoin' ? (tokenParams.bitcoin || {}) : undefined,
      arbitrum: blockchain === 'arbitrum' ? (tokenParams.arbitrum || {}) : undefined,
      tron: blockchain === 'tron' ? (tokenParams.tron || {}) : undefined,
    });
  };

  const renderChainSpecificSettings = () => {
    if (tokenParams.blockchain === 'hyperliquid') {
      const config = getHyperLiquidConfig();
      
      return (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            ₿ HYPER LIQUID Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Token Standard</InputLabel>
                <Select
                  value={tokenParams.hyperliquid?.tokenStandard || 'HIP-1'}
                  onChange={(e) => updateTokenParams({
                    hyperliquid: {
                      ...tokenParams.hyperliquid,
                      tokenStandard: e.target.value as 'HIP-1' | 'HIP-2',
                    }
                  })}
                  label="Token Standard"
                >
                  <MenuItem value="HIP-1">
                    <Box>
                      <Typography variant="body2">HIP-1</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Capped supply fungible token with spot order book
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="HIP-2">
                    <Box>
                      <Typography variant="body2">HIP-2</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Hyperliquidity with automated market making
                      </Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Maximum Supply"
                type="number"
                value={tokenParams.hyperliquid?.maxSupply || 1000000000}
                onChange={(e) => updateTokenParams({
                  hyperliquid: {
                    ...tokenParams.hyperliquid,
                    maxSupply: parseInt(e.target.value) || 1000000000,
                  }
                })}
                helperText="Total token supply (1 billion default)"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Size Decimals"
                type="number"
                value={tokenParams.hyperliquid?.szDecimals || 6}
                onChange={(e) => updateTokenParams({
                  hyperliquid: {
                    ...tokenParams.hyperliquid,
                    szDecimals: parseInt(e.target.value) || 6,
                  }
                })}
                helperText="Decimals for display purposes"
                inputProps={{ min: 0, max: 18 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Wei Decimals"
                type="number"
                value={tokenParams.hyperliquid?.weiDecimals || 18}
                onChange={(e) => updateTokenParams({
                  hyperliquid: {
                    ...tokenParams.hyperliquid,
                    weiDecimals: parseInt(e.target.value) || 18,
                  }
                })}
                helperText="Internal precision decimals"
                inputProps={{ min: 0, max: 18 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tokenParams.hyperliquid?.enableHyperliquidity || false}
                    onChange={(e) => updateTokenParams({
                      hyperliquid: {
                        ...tokenParams.hyperliquid,
                        enableHyperliquidity: e.target.checked,
                      }
                    })}
                  />
                }
                label="Enable Hyperliquidity (Automated Market Making)"
              />
              {tokenParams.hyperliquid?.enableHyperliquidity && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Hyperliquidity provides automated market making with {config.FEES.HYPERLIQUIDITY_SPREAD * 100}% spread, 
                  refreshing every {config.FEES.REFRESH_INTERVAL / 1000} seconds.
                </Alert>
              )}
            </Grid>
            
            {tokenParams.hyperliquid?.enableHyperliquidity && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Initial Price (USDC)"
                    type="number"
                    value={tokenParams.hyperliquid?.initialPrice || 1.0}
                    onChange={(e) => updateTokenParams({
                      hyperliquid: {
                        ...tokenParams.hyperliquid,
                        initialPrice: parseFloat(e.target.value) || 1.0,
                      }
                    })}
                    inputProps={{ min: 0.001, step: 0.001 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Order Size"
                    type="number"
                    value={tokenParams.hyperliquid?.orderSize || 1000}
                    onChange={(e) => updateTokenParams({
                      hyperliquid: {
                        ...tokenParams.hyperliquid,
                        orderSize: parseInt(e.target.value) || 1000,
                      }
                    })}
                    helperText="Size of each market making order"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Number of Orders"
                    type="number"
                    value={tokenParams.hyperliquid?.numberOfOrders || 10}
                    onChange={(e) => updateTokenParams({
                      hyperliquid: {
                        ...tokenParams.hyperliquid,
                        numberOfOrders: parseInt(e.target.value) || 10,
                      }
                    })}
                    helperText="Orders on each side of the book"
                    inputProps={{ min: 1, max: 50 }}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Maximum Gas (HYPE)"
                type="number"
                value={tokenParams.hyperliquid?.maxGas || 5000}
                onChange={(e) => updateTokenParams({
                  hyperliquid: {
                    ...tokenParams.hyperliquid,
                    maxGas: parseInt(e.target.value) || 5000,
                  }
                })}
                helperText={`Dutch auction starts at this price, decreases to ${config.FEES.MIN_DEPLOYMENT_FEE} HYPE over 31 hours`}
                inputProps={{ min: config.FEES.MIN_DEPLOYMENT_FEE }}
              />
            </Grid>
          </Grid>
        </Paper>
      );
    } else if (tokenParams.blockchain === 'solana') {
      return (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            ◎ Solana Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Token Supply"
                type="number"
                value={tokenParams.solana?.supply || 1000000000}
                onChange={(e) => updateTokenParams({
                  solana: {
                    ...tokenParams.solana,
                    supply: parseInt(e.target.value) || 1000000000,
                  }
                })}
                helperText="Total number of tokens to create"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Decimals</InputLabel>
                <Select
                  value={tokenParams.solana?.decimals || 9}
                  onChange={(e) => updateTokenParams({
                    solana: {
                      ...tokenParams.solana,
                      decimals: parseInt(e.target.value as string),
                    }
                  })}
                  label="Decimals"
                >
                  <MenuItem value={0}>0 (FungibleAsset - Rich metadata)</MenuItem>
                  <MenuItem value={6}>6 (USDC standard)</MenuItem>
                  <MenuItem value={9}>9 (SOL standard)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>0 decimals:</strong> Creates a FungibleAsset token with rich metadata display in Phantom wallet<br/>
                  <strong>6-9 decimals:</strong> Creates a standard Fungible token compatible with Raydium pools
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Paper>
      );
    } else if (tokenParams.blockchain === 'polygon') {
      return (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            🔷 Polygon Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Supply"
                type="number"
                value={tokenParams.polygon?.totalSupply || 1000000}
                onChange={(e) => updateTokenParams({
                  polygon: {
                    ...tokenParams.polygon,
                    totalSupply: parseInt(e.target.value) || 1000000,
                  }
                })}
                helperText="Total number of tokens to create"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Decimals</InputLabel>
                <Select
                  value={tokenParams.polygon?.decimals || 18}
                  onChange={(e) => updateTokenParams({
                    polygon: {
                      ...tokenParams.polygon,
                      decimals: parseInt(e.target.value as string),
                    }
                  })}
                  label="Decimals"
                >
                  <MenuItem value={6}>6 (USDC standard)</MenuItem>
                  <MenuItem value={18}>18 (ETH/MATIC standard)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tokenParams.polygon?.createLiquidity || false}
                    onChange={(e) => updateTokenParams({
                      polygon: {
                        ...tokenParams.polygon,
                        createLiquidity: e.target.checked,
                      }
                    })}
                  />
                }
                label="Create Liquidity Pool"
              />
            </Grid>
            
            {tokenParams.polygon?.createLiquidity && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Liquidity MATIC Amount"
                    type="number"
                    value={tokenParams.polygon?.liquidityMaticAmount || 0}
                    onChange={(e) => updateTokenParams({
                      polygon: {
                        ...tokenParams.polygon,
                        liquidityMaticAmount: parseFloat(e.target.value) || 0,
                      }
                    })}
                    helperText="MATIC to add to liquidity pool"
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>DEX Choice</InputLabel>
                    <Select
                      value={tokenParams.polygon?.dexChoice || 'uniswap-v3'}
                      onChange={(e) => updateTokenParams({
                        polygon: {
                          ...tokenParams.polygon,
                          dexChoice: e.target.value as 'uniswap-v3' | 'quickswap' | 'sushiswap',
                        }
                      })}
                      label="DEX Choice"
                    >
                      <MenuItem value="uniswap-v3">Uniswap V3</MenuItem>
                      <MenuItem value="quickswap">QuickSwap</MenuItem>
                      <MenuItem value="sushiswap">SushiSwap</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Polygon Benefits:</strong> Ultra-low fees (~$0.01), Ethereum compatibility, and instant finality.<br/>
                  <strong>ERC-20 Standard:</strong> Compatible with all major DEXs and wallets on Polygon.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Paper>
      );
    } else if (tokenParams.blockchain === 'base') {
      return (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            🔵 BASE Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Supply"
                type="number"
                value={tokenParams.base?.totalSupply || 1000000}
                onChange={(e) => updateTokenParams({
                  base: {
                    ...tokenParams.base,
                    totalSupply: parseInt(e.target.value) || 1000000,
                  }
                })}
                helperText="Total number of tokens to create"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Decimals</InputLabel>
                <Select
                  value={tokenParams.base?.decimals || 18}
                  onChange={(e) => updateTokenParams({
                    base: {
                      ...tokenParams.base,
                      decimals: parseInt(e.target.value as string),
                    }
                  })}
                  label="Decimals"
                >
                  <MenuItem value={6}>6 (USDC standard)</MenuItem>
                  <MenuItem value={18}>18 (ETH standard)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tokenParams.base?.createLiquidity || false}
                    onChange={(e) => updateTokenParams({
                      base: {
                        ...tokenParams.base,
                        createLiquidity: e.target.checked,
                      }
                    })}
                  />
                }
                label="Create Liquidity Pool"
              />
            </Grid>
            
            {tokenParams.base?.createLiquidity && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Liquidity ETH Amount"
                    type="number"
                    value={tokenParams.base?.liquidityEthAmount || 0}
                    onChange={(e) => updateTokenParams({
                      base: {
                        ...tokenParams.base,
                        liquidityEthAmount: parseFloat(e.target.value) || 0,
                      }
                    })}
                    helperText="ETH to add to liquidity pool"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>DEX Choice</InputLabel>
                    <Select
                      value={tokenParams.base?.dexChoice || 'uniswap-v3'}
                      onChange={(e) => updateTokenParams({
                        base: {
                          ...tokenParams.base,
                          dexChoice: e.target.value as 'uniswap-v3' | 'aerodrome' | 'sushiswap',
                        }
                      })}
                      label="DEX Choice"
                    >
                      <MenuItem value="uniswap-v3">Uniswap V3</MenuItem>
                      <MenuItem value="aerodrome">Aerodrome (Native BASE DEX)</MenuItem>
                      <MenuItem value="sushiswap">SushiSwap</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>BASE Benefits:</strong> Coinbase backing, low fees (~$3-5), and growing ecosystem.<br/>
                  <strong>ERC-20 Standard:</strong> Compatible with Uniswap V3, Aerodrome, and other BASE DEXs.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Paper>
      );
    } else if (tokenParams.blockchain === 'bitcoin') {
      return (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            ₿ Bitcoin BRC-20 Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ticker (4 characters)"
                value={tokenParams.bitcoin?.tick || tokenParams.symbol.slice(0, 4).toUpperCase()}
                onChange={(e) => updateTokenParams({
                  bitcoin: {
                    ...tokenParams.bitcoin,
                    tick: e.target.value.toUpperCase().slice(0, 4),
                  }
                })}
                helperText="Exactly 4 characters (like PEPE, ORDI)"
                inputProps={{ maxLength: 4 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Supply"
                type="number"
                value={tokenParams.bitcoin?.max || 21000000}
                onChange={(e) => updateTokenParams({
                  bitcoin: {
                    ...tokenParams.bitcoin,
                    max: parseInt(e.target.value) || 21000000,
                  }
                })}
                helperText="Total maximum supply (like Bitcoin's 21M)"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mint Limit"
                type="number"
                value={tokenParams.bitcoin?.lim || 1000}
                onChange={(e) => updateTokenParams({
                  bitcoin: {
                    ...tokenParams.bitcoin,
                    lim: parseInt(e.target.value) || 1000,
                  }
                })}
                helperText="Maximum tokens per mint transaction"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Decimals"
                value="0"
                disabled
                helperText="BRC-20 tokens always have 0 decimals"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>BRC-20 Notice:</strong> BRC-20 tokens are Bitcoin inscriptions, not smart contracts. 
                  They don't have traditional liquidity pools. Trading happens through specialized marketplaces.
                </Typography>
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Bitcoin Benefits:</strong> True Bitcoin network, immutable inscriptions, proven store of value.<br/>
                  <strong>BRC-20 Standard:</strong> Compatible with Unisat, OKX, and other Bitcoin inscription wallets.
                  <br/>
                  <strong>Examples:</strong> ORDI (first BRC-20), PEPE, MEME tokens on Bitcoin.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Paper>
      );
    } else if (tokenParams.blockchain === 'arbitrum') {
      return (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            🔺 Arbitrum Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Supply"
                type="number"
                value={tokenParams.arbitrum?.totalSupply || 1000000}
                onChange={(e) => updateTokenParams({
                  arbitrum: {
                    ...tokenParams.arbitrum,
                    totalSupply: parseInt(e.target.value) || 1000000,
                  }
                })}
                helperText="Total number of tokens to create"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Decimals</InputLabel>
                <Select
                  value={tokenParams.arbitrum?.decimals || 18}
                  onChange={(e) => updateTokenParams({
                    arbitrum: {
                      ...tokenParams.arbitrum,
                      decimals: parseInt(e.target.value as string),
                    }
                  })}
                  label="Decimals"
                >
                  <MenuItem value={6}>6 (USDC standard)</MenuItem>
                  <MenuItem value={18}>18 (ETH standard)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tokenParams.arbitrum?.createLiquidity || false}
                    onChange={(e) => updateTokenParams({
                      arbitrum: {
                        ...tokenParams.arbitrum,
                        createLiquidity: e.target.checked,
                      }
                    })}
                  />
                }
                label="Create Liquidity Pool"
              />
            </Grid>
            
            {tokenParams.arbitrum?.createLiquidity && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Liquidity ETH Amount"
                    type="number"
                    value={tokenParams.arbitrum?.liquidityEthAmount || 0}
                    onChange={(e) => updateTokenParams({
                      arbitrum: {
                        ...tokenParams.arbitrum,
                        liquidityEthAmount: parseFloat(e.target.value) || 0,
                      }
                    })}
                    helperText="ETH to add to liquidity pool"
                    inputProps={{ min: 0, step: 0.001 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>DEX Choice</InputLabel>
                    <Select
                      value={tokenParams.arbitrum?.dexChoice || 'uniswap-v3'}
                      onChange={(e) => updateTokenParams({
                        arbitrum: {
                          ...tokenParams.arbitrum,
                          dexChoice: e.target.value as 'uniswap-v3' | 'camelot' | 'sushiswap',
                        }
                      })}
                      label="DEX Choice"
                    >
                      <MenuItem value="uniswap-v3">Uniswap V3</MenuItem>
                      <MenuItem value="camelot">Camelot (Native Arbitrum DEX)</MenuItem>
                      <MenuItem value="sushiswap">SushiSwap</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Arbitrum Benefits:</strong> 95% lower fees than Ethereum, fast finality (~1-2 seconds).<br/>
                  <strong>ERC-20 Standard:</strong> Compatible with Uniswap V3, Camelot, and other Arbitrum DEXs.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Paper>
      );
    } else if (tokenParams.blockchain === 'tron') {
      return (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            🔴 TRON Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Token Standard</InputLabel>
                <Select
                  value={tokenParams.tron?.tokenStandard || 'TRC-20'}
                  onChange={(e) => updateTokenParams({
                    tron: {
                      ...tokenParams.tron,
                      tokenStandard: e.target.value as 'TRC-10' | 'TRC-20',
                    }
                  })}
                  label="Token Standard"
                >
                  <MenuItem value="TRC-20">
                    <Box>
                      <Typography variant="body2">TRC-20</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Full smart contract features (recommended)
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="TRC-10">
                    <Box>
                      <Typography variant="body2">TRC-10</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Simple token, lower fees
                      </Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Supply"
                type="number"
                value={tokenParams.tron?.totalSupply || 1000000}
                onChange={(e) => updateTokenParams({
                  tron: {
                    ...tokenParams.tron,
                    totalSupply: parseInt(e.target.value) || 1000000,
                  }
                })}
                helperText="Total number of tokens to create"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Decimals</InputLabel>
                <Select
                  value={tokenParams.tron?.decimals || 6}
                  onChange={(e) => updateTokenParams({
                    tron: {
                      ...tokenParams.tron,
                      decimals: parseInt(e.target.value as string),
                    }
                  })}
                  label="Decimals"
                >
                  <MenuItem value={0}>0 (Whole numbers only)</MenuItem>
                  <MenuItem value={6}>6 (USDT/TRX standard)</MenuItem>
                  <MenuItem value={18}>18 (Ethereum style)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tokenParams.tron?.createLiquidity || false}
                    onChange={(e) => updateTokenParams({
                      tron: {
                        ...tokenParams.tron,
                        createLiquidity: e.target.checked,
                      }
                    })}
                  />
                }
                label="Create Liquidity Pool"
              />
            </Grid>
            
            {tokenParams.tron?.createLiquidity && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Liquidity TRX Amount"
                    type="number"
                    value={tokenParams.tron?.liquidityTrxAmount || 0}
                    onChange={(e) => updateTokenParams({
                      tron: {
                        ...tokenParams.tron,
                        liquidityTrxAmount: parseFloat(e.target.value) || 0,
                      }
                    })}
                    helperText="TRX to add to liquidity pool"
                    inputProps={{ min: 0, step: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>DEX Choice</InputLabel>
                    <Select
                      value={tokenParams.tron?.dexChoice || 'justswap'}
                      onChange={(e) => updateTokenParams({
                        tron: {
                          ...tokenParams.tron,
                          dexChoice: e.target.value as 'justswap' | 'sunswap' | 'uniswap-tron',
                        }
                      })}
                      label="DEX Choice"
                    >
                      <MenuItem value="justswap">JustSwap (Original TRON DEX)</MenuItem>
                      <MenuItem value="sunswap">SunSwap (Newest features)</MenuItem>
                      <MenuItem value="uniswap-tron">Uniswap on TRON</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>TRON Benefits:</strong> Ultra-low fees (~$0.10), fast transactions (~3 seconds).<br/>
                  <strong>TRC-20 Standard:</strong> Compatible with JustSwap, SunSwap, and other TRON DEXs.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Paper>
      );
    }
    
    return null;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Chain-specific Settings
      </Typography>
      
      {/* Blockchain Selection */}
      <ChainSelector
        selectedChain={tokenParams.blockchain}
        onChainChange={handleChainChange}
        showCosts={true}
      />
      
      <Divider sx={{ my: 3 }} />
      
      {/* Core Token Settings - hidden to avoid duplicate universal inputs */}
      {false && (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Token Name"
            value={tokenParams.name}
            onChange={(e) => updateTokenParams({ name: e.target.value })}
            placeholder="e.g., My Awesome Token"
            required
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Token Symbol"
            value={tokenParams.symbol}
            onChange={(e) => updateTokenParams({ symbol: e.target.value.toUpperCase() })}
            placeholder="e.g., MAT"
            inputProps={{ maxLength: 10 }}
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={tokenParams.description}
            onChange={(e) => updateTokenParams({ description: e.target.value })}
            placeholder="Describe your token's purpose and features"
            multiline
            rows={3}
          />
        </Grid>
        
        {/* Image Upload */}
        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="body2" gutterBottom>
              Token Image
            </Typography>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="image-upload"
              type="file"
              onChange={handleImageUpload}
            />
            <label htmlFor="image-upload">
              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 1,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  minHeight: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Token preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 100,
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Click to upload token image
                  </Typography>
                )}
              </Box>
            </label>
          </Box>
        </Grid>
        
        {/* Image Preview Info */}
        {imagePreview && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" gutterBottom>
                Image Guidelines:
              </Typography>
              <Chip label="Square aspect ratio recommended" size="small" />
              <Chip label="256x256, 512x512, or 1024x1024 optimal" size="small" />
              <Chip label="PNG/JPG format" size="small" />
              <Chip label="Will be uploaded to IPFS" size="small" color="primary" />
            </Box>
          </Grid>
        )}
        
        {/* Social Links */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Social Links (Optional)
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Website"
            value={tokenParams.website}
            onChange={(e) => updateTokenParams({ website: e.target.value })}
            placeholder="https://yourproject.com"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Twitter"
            value={tokenParams.twitter}
            onChange={(e) => updateTokenParams({ twitter: e.target.value })}
            placeholder="https://twitter.com/yourproject"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Telegram"
            value={tokenParams.telegram}
            onChange={(e) => updateTokenParams({ telegram: e.target.value })}
            placeholder="https://t.me/yourproject"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Discord"
            value={tokenParams.discord}
            onChange={(e) => updateTokenParams({ discord: e.target.value })}
            placeholder="https://discord.gg/yourproject"
          />
        </Grid>
      </Grid>
      )}
      
      {/* Chain-specific settings */}
      {renderChainSpecificSettings()}
    </Box>
  );
}