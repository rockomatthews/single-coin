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

  const handleChainChange = (blockchain: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'rsk') => {
    // Reset chain-specific params when switching
    updateTokenParams({
      blockchain,
      solana: blockchain === 'solana' ? (tokenParams.solana || {}) : undefined,
      hyperliquid: blockchain === 'hyperliquid' ? (tokenParams.hyperliquid || {}) : undefined,
      polygon: blockchain === 'polygon' ? (tokenParams.polygon || {}) : undefined,
      base: blockchain === 'base' ? (tokenParams.base || {}) : undefined,
      rsk: blockchain === 'rsk' ? (tokenParams.rsk || {}) : undefined,
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
    } else if (tokenParams.blockchain === 'rsk') {
      return (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            ₿ Bitcoin Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Supply"
                type="number"
                value={tokenParams.rsk?.totalSupply || 1000000}
                onChange={(e) => updateTokenParams({
                  rsk: {
                    ...tokenParams.rsk,
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
                  value={tokenParams.rsk?.decimals || 18}
                  onChange={(e) => updateTokenParams({
                    rsk: {
                      ...tokenParams.rsk,
                      decimals: parseInt(e.target.value as string),
                    }
                  })}
                  label="Decimals"
                >
                  <MenuItem value={6}>6 (USDC standard)</MenuItem>
                  <MenuItem value={18}>18 (RBTC standard)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tokenParams.rsk?.createLiquidity || false}
                    onChange={(e) => updateTokenParams({
                      rsk: {
                        ...tokenParams.rsk,
                        createLiquidity: e.target.checked,
                      }
                    })}
                  />
                }
                label="Create Liquidity Pool"
              />
            </Grid>
            
            {tokenParams.rsk?.createLiquidity && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Liquidity RBTC Amount"
                    type="number"
                    value={tokenParams.rsk?.liquidityRbtcAmount || 0}
                    onChange={(e) => updateTokenParams({
                      rsk: {
                        ...tokenParams.rsk,
                        liquidityRbtcAmount: parseFloat(e.target.value) || 0,
                      }
                    })}
                    helperText="RBTC to add to liquidity pool"
                    inputProps={{ min: 0, step: 0.0001 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>DEX Choice</InputLabel>
                    <Select
                      value={tokenParams.rsk?.dexChoice || 'sovryn'}
                      onChange={(e) => updateTokenParams({
                        rsk: {
                          ...tokenParams.rsk,
                          dexChoice: e.target.value as 'sovryn' | 'rskswap' | 'tropykus',
                        }
                      })}
                      label="DEX Choice"
                    >
                      <MenuItem value="sovryn">Sovryn (Leading Bitcoin DEX)</MenuItem>
                      <MenuItem value="rskswap">RSKSwap</MenuItem>
                      <MenuItem value="tropykus">Tropykus</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Bitcoin Benefits:</strong> Secured by 60% of Bitcoin's hashpower, EVM compatible smart contracts.<br/>
                  <strong>ERC-20 Standard:</strong> Compatible with Sovryn, RSKSwap, and other RSK DEXs. RBTC = Bitcoin 1:1.
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
        Token Settings
      </Typography>
      
      {/* Blockchain Selection */}
      <ChainSelector
        selectedChain={tokenParams.blockchain}
        onChainChange={handleChainChange}
        showCosts={true}
      />
      
      <Divider sx={{ my: 3 }} />
      
      {/* Core Token Settings */}
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
      
      {/* Chain-specific settings */}
      {renderChainSpecificSettings()}
    </Box>
  );
}