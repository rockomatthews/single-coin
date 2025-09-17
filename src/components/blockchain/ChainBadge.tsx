'use client';

import React from 'react';
import { Chip, Box, Typography, Tooltip } from '@mui/material';

interface ChainBadgeProps {
  blockchain: 'solana' | 'hyperliquid' | 'katana';
  size?: 'small' | 'medium';
  showName?: boolean;
  variant?: 'outlined' | 'filled';
}

export default function ChainBadge({ 
  blockchain, 
  size = 'small', 
  showName = true,
  variant = 'filled'
}: ChainBadgeProps) {
  const getChainInfo = (chain: string) => {
    switch (chain) {
      case 'solana':
        return {
          name: 'Solana',
          icon: '◎',
          color: '#9945FF' as const,
          bgColor: '#9945FF20',
          description: 'Fast & cheap Solana blockchain'
        };
      case 'hyperliquid':
        return {
          name: 'HYPER LIQUID',
          icon: '₿',
          color: '#FF6B35' as const,
          bgColor: '#FF6B3520',
          description: 'Bitcoin L2 with native order book'
        };
      case 'katana':
        return {
          name: 'Katana',
          icon: '🗡️',
          color: '#3843D0' as const,
          bgColor: '#3843D020',
          description: 'Katana network'
        };
      default:
        return {
          name: 'Unknown',
          icon: '?',
          color: '#666666' as const,
          bgColor: '#66666620',
          description: 'Unknown blockchain'
        };
    }
  };

  const chainInfo = getChainInfo(blockchain);

  if (showName) {
    return (
      <Tooltip title={chainInfo.description} arrow>
        <Chip
          icon={
            <Typography 
              variant={size === 'small' ? 'caption' : 'body2'} 
              component="span"
              sx={{ fontSize: size === 'small' ? '0.7rem' : '0.9rem' }}
            >
              {chainInfo.icon}
            </Typography>
          }
          label={chainInfo.name}
          size={size}
          variant={variant}
          sx={{
            color: variant === 'filled' ? 'white' : chainInfo.color,
            bgcolor: variant === 'filled' ? chainInfo.color : chainInfo.bgColor,
            borderColor: chainInfo.color,
            fontWeight: 'bold',
            '& .MuiChip-icon': {
              color: 'inherit',
            },
          }}
        />
      </Tooltip>
    );
  }

  // Icon only version
  return (
    <Tooltip title={`${chainInfo.name} - ${chainInfo.description}`} arrow>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size === 'small' ? 24 : 32,
          height: size === 'small' ? 24 : 32,
          borderRadius: '50%',
          bgcolor: chainInfo.bgColor,
          border: `2px solid ${chainInfo.color}`,
          cursor: 'help',
        }}
      >
        <Typography 
          variant={size === 'small' ? 'caption' : 'body2'} 
          component="span"
          sx={{ 
            color: chainInfo.color,
            fontWeight: 'bold',
            fontSize: size === 'small' ? '0.8rem' : '1rem'
          }}
        >
          {chainInfo.icon}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// Additional component for chain comparison
export function ChainComparison({ 
  chains 
}: { 
  chains: Array<'solana' | 'hyperliquid'> 
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {chains.map((chain, index) => (
        <React.Fragment key={chain}>
          <ChainBadge blockchain={chain} size="medium" />
          {index < chains.length - 1 && (
            <Typography variant="body2" color="text.secondary">
              vs
            </Typography>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}