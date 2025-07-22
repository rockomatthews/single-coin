'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
  Paper,
  Grid,
} from '@mui/material';
import { getSupportedBlockchains } from '@/utils/blockchain-factory';

interface ChainSelectorProps {
  selectedChain: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bitcoin' | 'arbitrum' | 'tron';
  onChainChange: (chain: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bitcoin' | 'arbitrum' | 'tron') => void;
  showCosts?: boolean;
}

export default function ChainSelector({ 
  selectedChain, 
  onChainChange, 
  showCosts = false 
}: ChainSelectorProps) {
  const blockchains = getSupportedBlockchains();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChainChange(event.target.value as 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bitcoin' | 'arbitrum' | 'tron');
  };

  const getChainFeatures = (chainId: string) => {
    switch (chainId) {
      case 'solana':
        return {
          features: ['SPL Tokens', 'Raydium DEX', 'Fast & Cheap', 'Phantom Wallet'],
          pros: ['Low fees (~$0.01)', 'Fast finality', 'Established ecosystem'],
          cons: ['Network congestion', 'Validator centralization'],
          costs: {
            baseFee: '0.01-50 SOL',
            liquidityFee: '+ liquidity amount',
            currency: 'SOL'
          }
        };
      case 'hyperliquid':
        return {
          features: ['HIP-1/HIP-2 Tokens', 'Native Order Book', 'Hyperliquidity', 'BTC L2'],
          pros: ['Built-in market making', 'Advanced trading', 'Bitcoin backing'],
          cons: ['Newer ecosystem', 'Less wallet support'],
          costs: {
            baseFee: '500-5000 HYPE',
            liquidityFee: '+ optional hyperliquidity',
            currency: 'HYPE'
          }
        };
      case 'polygon':
        return {
          features: ['ERC-20 Tokens', 'Uniswap V3', 'MetaMask', 'Ethereum L2'],
          pros: ['Ultra-low fees (~$0.01)', 'Ethereum compatibility', 'Mature ecosystem'],
          cons: ['Centralized validators', 'Ethereum dependency'],
          costs: {
            baseFee: '0.001-0.01 MATIC',
            liquidityFee: '+ liquidity amount',
            currency: 'MATIC'
          }
        };
      case 'base':
        return {
          features: ['ERC-20 Tokens', 'Uniswap V3', 'Aerodrome', 'Coinbase L2'],
          pros: ['Low fees (~$3-5)', 'Coinbase backing', 'Growing ecosystem'],
          cons: ['Newer network', 'Higher fees than Polygon'],
          costs: {
            baseFee: '0.001-0.002 ETH',
            liquidityFee: '+ liquidity amount',
            currency: 'ETH'
          }
        };
      case 'bitcoin':
        return {
          features: ['BRC-20 Inscriptions', 'Ordinals Protocol', 'Unisat Wallet', 'Bitcoin Native'],
          pros: ['True Bitcoin network', 'Immutable inscriptions', 'PEPE & ORDI style tokens'],
          cons: ['Higher fees', 'Limited smart contracts', 'Wallet compatibility'],
          costs: {
            baseFee: '0.0001-0.0005 BTC',
            liquidityFee: 'Manual trading',
            currency: 'BTC'
          }
        };
      case 'arbitrum':
        return {
          features: ['ERC-20 Tokens', 'Uniswap V3', 'Camelot DEX', 'Ethereum L2'],
          pros: ['95% lower fees than Ethereum', 'Fast finality (~1-2 seconds)', 'Growing ecosystem'],
          cons: ['Requires ETH bridging', 'Newer than mainnet'],
          costs: {
            baseFee: '0.002-0.005 ETH',
            liquidityFee: '+ liquidity amount',
            currency: 'ETH'
          }
        };
      case 'tron':
        return {
          features: ['TRC-20 Tokens', 'JustSwap DEX', 'SunSwap', 'Ultra-Low Fees'],
          pros: ['Ultra-cheap fees (~$0.10)', 'Fast transactions (~3 seconds)', 'TronLink integration'],
          cons: ['Smaller ecosystem than Ethereum', 'Less DeFi options'],
          costs: {
            baseFee: '3-5 TRX',
            liquidityFee: '+ liquidity amount',
            currency: 'TRX'
          }
        };
      default:
        return { features: [], pros: [], cons: [], costs: null };
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Blockchain
      </Typography>
      
      <FormControl component="fieldset" fullWidth>
        <RadioGroup
          value={selectedChain}
          onChange={handleChange}
          name="blockchain-selector"
        >
          <Grid container spacing={2}>
            {blockchains.map((blockchain) => {
              const features = getChainFeatures(blockchain.id);
              const isSelected = selectedChain === blockchain.id;
              
              return (
                <Grid item xs={12} md={6} key={blockchain.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: isSelected ? 2 : 1,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'primary.50' : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      }
                    }}
                    onClick={() => onChainChange(blockchain.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <FormControlLabel
                          value={blockchain.id}
                          control={<Radio />}
                          label=""
                          sx={{ mr: 1, mt: -0.5 }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h4" component="span">
                              {blockchain.icon}
                            </Typography>
                            <Typography variant="h6" component="span" fontWeight="bold">
                              {blockchain.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {blockchain.description}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Features */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Features:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {features.features.map((feature, index) => (
                            <Chip
                              key={index}
                              label={feature}
                              size="small"
                              variant="outlined"
                              color={isSelected ? 'primary' : 'default'}
                            />
                          ))}
                        </Box>
                      </Box>

                      {/* Pros */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom color="success.main">
                          ✓ Advantages:
                        </Typography>
                        <Box sx={{ ml: 1 }}>
                          {features.pros.map((pro, index) => (
                            <Typography key={index} variant="caption" display="block" color="text.secondary">
                              • {pro}
                            </Typography>
                          ))}
                        </Box>
                      </Box>

                      {/* Cons */}
                      <Box sx={{ mb: showCosts ? 2 : 0 }}>
                        <Typography variant="subtitle2" gutterBottom color="warning.main">
                          ⚠ Considerations:
                        </Typography>
                        <Box sx={{ ml: 1 }}>
                          {features.cons.map((con, index) => (
                            <Typography key={index} variant="caption" display="block" color="text.secondary">
                              • {con}
                            </Typography>
                          ))}
                        </Box>
                      </Box>

                      {/* Costs */}
                      {showCosts && features.costs && (
                        <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            💰 Cost Structure:
                          </Typography>
                          <Typography variant="caption" display="block">
                            Base Fee: {features.costs.baseFee}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Liquidity: {features.costs.liquidityFee}
                          </Typography>
                          <Typography variant="caption" display="block" fontWeight="bold">
                            Currency: {features.costs.currency}
                          </Typography>
                        </Paper>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </RadioGroup>
      </FormControl>

      {/* Selected Chain Summary */}
      {selectedChain && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
          <Typography variant="body2" color="primary.main">
            <strong>Selected:</strong> {blockchains.find(b => b.id === selectedChain)?.name}
            {' '}({blockchains.find(b => b.id === selectedChain)?.icon})
          </Typography>
        </Box>
      )}
    </Box>
  );
}