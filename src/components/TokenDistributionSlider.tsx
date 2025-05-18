'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Slider,
  Stack,
  Typography,
  LinearProgress,
} from '@mui/material';
import { calculateFee } from '@/utils/solana';

interface TokenDistributionSliderProps {
  totalSupply: number;
  value: number;
  onChange: (value: number) => void;
}

export default function TokenDistributionSlider({
  totalSupply,
  value,
  onChange,
}: TokenDistributionSliderProps) {
  const [percentage, setPercentage] = useState(value);
  const [fee, setFee] = useState(0);
  
  // Calculate fee with exponential increase based on retention percentage
  useEffect(() => {
    setFee(calculateFee(percentage));
  }, [percentage]);
  
  const handleChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setPercentage(value);
    onChange(value);
  };

  const formatSupply = (num: number) => {
    return num.toLocaleString();
  };

  // Calculate token amounts based on percentage
  const retainedTokens = Math.floor(totalSupply * (percentage / 100));
  const liquidityTokens = totalSupply - retainedTokens;

  return (
    <Card variant="outlined" sx={{ mb: 3, backgroundColor: 'black', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="white">
          Token Distribution
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set the percentage of tokens you want to keep. The rest will be 
          added to liquidity pools to make your token tradable.
          Higher retention percentages incur higher fees.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography id="token-distribution-slider" gutterBottom color="white">
            You keep: {percentage}% of tokens
          </Typography>
          <Slider
            value={percentage}
            onChange={handleChange}
            aria-labelledby="token-distribution-slider"
            valueLabelDisplay="auto"
            step={1}
            marks={[
              { value: 0, label: '0%' },
              { value: 25, label: '25%' },
              { value: 50, label: '50%' },
              { value: 75, label: '75%' },
              { value: 100, label: '100%' },
            ]}
            sx={{
              '& .MuiSlider-rail': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
              '& .MuiSlider-track': {
                backgroundColor: '#FFD700',
              },
              '& .MuiSlider-thumb': {
                backgroundColor: '#FFD700',
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(255, 215, 0, 0.16)',
                }
              },
              '& .MuiSlider-mark': {
                backgroundColor: '#FFFFFF',
              },
              '& .MuiSlider-markLabel': {
                color: '#FFFFFF',
              },
            }}
          />
        </Box>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Tokens You Keep
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" color="white">{formatSupply(retainedTokens)}</Typography>
              <Typography variant="body2" color="primary">
                {percentage}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={percentage} 
              color="primary" 
              sx={{ mt: 1, height: 8, borderRadius: 2 }}
            />
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Tokens for Liquidity
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" color="white">{formatSupply(liquidityTokens)}</Typography>
              <Typography variant="body2" color="secondary">
                {100 - percentage}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={100 - percentage} 
              color="secondary" 
              sx={{ mt: 1, height: 8, borderRadius: 2 }}
            />
          </Box>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.3)', borderRadius: 1, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Creation Fee:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
              <Typography variant="h5" color="#FFD700">{fee}</Typography>
              <Typography variant="body2" sx={{ ml: 0.5 }} color="white">SOL</Typography>
            </Box>
            {percentage > 75 && (
              <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                Higher fees apply as you retain more tokens.
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
} 