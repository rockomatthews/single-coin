'use client';

import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Paper,
  Link,
  Stack,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';

interface TokenSuccessProps {
  tokenAddress: string | null;
}

export default function TokenSuccess({ tokenAddress }: TokenSuccessProps) {
  if (!tokenAddress) {
    return (
      <Alert severity="error">
        Token address is missing. Please try again or contact support.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" color="primary" gutterBottom fontWeight="bold">
          Token Successfully Created!
        </Typography>
        <Typography variant="body1">
          Your token has been created and should appear in your wallet shortly.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Token Address
        </Typography>
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: 'background.paper', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            wordBreak: 'break-all',
            mb: 3
          }}
        >
          <Typography variant="body2" fontFamily="monospace">
            {tokenAddress}
          </Typography>
        </Box>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            component={Link}
            href={`https://solscan.io/token/${tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<ArrowOutwardIcon />}
            fullWidth
          >
            View on Solscan
          </Button>
          <Button
            variant="outlined"
            component={Link}
            href={`https://solana.fm/address/${tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<LinkIcon />}
            fullWidth
          >
            View on Solana FM
          </Button>
        </Stack>
      </Paper>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Next Steps
        </Typography>
        <Typography variant="body2">
          • Your token will be visible in your wallet shortly<br />
          • It may take a few minutes for metadata to display properly<br />
          • If you created a liquidity pool, the token will be tradable shortly
        </Typography>
      </Alert>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Thank you for using Coinbull to create your token!
      </Typography>
    </Box>
  );
} 