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
  Divider,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

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
      {/* Success Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" color="primary" gutterBottom fontWeight="bold">
          🎉 Token Successfully Created!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Your token with Raydium liquidity pool has been created and is <strong>LIVE on Solana!</strong>
        </Typography>
      </Box>

      {/* Trading Live Alert */}
      <Alert 
        severity="success" 
        icon={<CheckCircleIcon />}
        sx={{ mb: 3, '& .MuiAlert-message': { width: '100%' } }}
      >
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          🚀 CONGRATULATIONS! Your Token is NOW TRADEABLE!
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Your Raydium CPMM pool is live and tokens are immediately tradeable on all major DEXes!
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          📈 Start sharing your trading links now!
        </Typography>
      </Alert>

      {/* Token Address */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Your Token Address
        </Typography>
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: 'background.paper', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            wordBreak: 'break-all',
            mb: 2,
            fontFamily: 'monospace'
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

      {/* Next Steps - Trading URLs */}
      <Card sx={{ mb: 3, border: '2px solid', borderColor: 'success.main' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom color="success.main">
            🔗 LIVE Trading URLs - Share These Now!
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Your token is live and tradeable on all major Solana DEXes. Share these links to start trading!
          </Typography>
          
          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              href={`https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<SwapHorizIcon />}
              fullWidth
              sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
            >
              Trade on Raydium (Native Pool)
            </Button>
            
            <Button
              variant="outlined"
              component={Link}
              href={`https://jup.ag/swap/SOL-${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<SwapHorizIcon />}
              fullWidth
              color="success"
            >
              Trade on Jupiter (Aggregator)
            </Button>

            <Button
              variant="outlined"
              component={Link}
              href={`https://dexscreener.com/solana/${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<LinkIcon />}
              fullWidth
              color="success"
            >
              View Charts on DexScreener
            </Button>

            <Button
              variant="outlined"
              component={Link}
              href={`https://birdeye.so/token/${tokenAddress}?chain=solana`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<LinkIcon />}
              fullWidth
              color="success"
            >
              View Analytics on Birdeye
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Pool Success Details */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="bold">
            🏊 Pool Details & What Happened
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>
            Raydium CPMM Pool Created Successfully:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <li><Typography variant="body2">✅ Real Raydium CPMM pool created (not a simulation)</Typography></li>
            <li><Typography variant="body2">✅ Tokens and SOL locked in liquidity pool</Typography></li>
            <li><Typography variant="body2">✅ Pool ID generated and registered with Raydium</Typography></li>
            <li><Typography variant="body2">✅ Immediately indexed by Jupiter aggregator</Typography></li>
            <li><Typography variant="body2">✅ Available on DexScreener for price tracking</Typography></li>
            <li><Typography variant="body2">✅ Accessible via Birdeye analytics</Typography></li>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            <strong>Technical:</strong> Your token uses Raydium's latest CPMM program (CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C) which doesn't require OpenBook markets, making it immediately compatible with all Solana DEX aggregators.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Marketing Steps */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          🚀 Next Steps: Grow Your Token
        </Typography>
        
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography variant="body2">
              Share trading links on X (Twitter), Telegram, and Discord
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography variant="body2">
              Submit to CoinGecko: https://www.coingecko.com/en/coins/new
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography variant="body2">
              List on CoinMarketCap for broader visibility
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography variant="body2">
              Build community through social media and partnerships
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Wallet Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          <AccountBalanceWalletIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Adding Token to Your Wallet
        </Typography>
        <Typography variant="body2">
          Your token should appear automatically in Phantom wallet. If not:
          <br />• Open Phantom → Tokens tab → "+" button → Paste token address → Add Token
        </Typography>
      </Alert>

      {/* Footer */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        🎯 <strong>Success!</strong> Your token is live and tradeable on Solana DEX ecosystem!
        <br />
        Start trading, build community, and grow your project. Need help with marketing? Contact our team!
      </Typography>
    </Box>
  );
} 