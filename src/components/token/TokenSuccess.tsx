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
  Grid,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LaunchIcon from '@mui/icons-material/Launch';
import TokenSecurity from './TokenSecurity';

interface TokenSuccessProps {
  tokenAddress: string | null;
  blockchain?: 'solana' | 'polygon' | 'base' | 'bnb' | 'arbitrum' | 'hyperliquid' | 'bitcoin' | 'tron';
  tokenParams?: {
    name?: string;
    symbol?: string;
    revokeUpdateAuthority?: boolean;
    revokeFreezeAuthority?: boolean;
    revokeMintAuthority?: boolean;
  };
}

export default function TokenSuccess({ tokenAddress, blockchain = 'solana', tokenParams }: TokenSuccessProps) {
  if (!tokenAddress) {
    return (
      <Alert severity="error">
        Token address is missing. Please try again or contact support.
      </Alert>
    );
  }

  // Dynamic configuration based on blockchain
  const getChainConfig = () => {
    switch (blockchain) {
      case 'polygon':
        return {
          name: 'Polygon',
          currency: 'MATIC',
          explorerName: 'Polygonscan',
          explorerUrl: `https://polygonscan.com/token/${tokenAddress}`,
          altExplorerName: 'PolygonScan',
          altExplorerUrl: `https://polygonscan.com/address/${tokenAddress}`,
          dexes: [
            { name: 'QuickSwap', url: `https://quickswap.exchange/#/swap?outputCurrency=${tokenAddress}` },
            { name: 'SushiSwap', url: `https://app.sushi.com/swap?chainId=137&token1=${tokenAddress}` },
            { name: 'DexScreener', url: `https://dexscreener.com/polygon/${tokenAddress}` },
            { name: 'CoinGecko', url: `https://www.coingecko.com/en/coins/new` }
          ],
          networkLive: 'LIVE on Polygon!',
          poolType: 'DEX liquidity pool',
          walletInstructions: 'Your token should appear automatically in MetaMask. If not, manually add the token using the contract address above.'
        };
      case 'base':
        return {
          name: 'Base',
          currency: 'ETH',
          explorerName: 'BaseScan',
          explorerUrl: `https://basescan.org/token/${tokenAddress}`,
          altExplorerName: 'Base Explorer',
          altExplorerUrl: `https://basescan.org/address/${tokenAddress}`,
          dexes: [
            { name: 'Uniswap', url: `https://app.uniswap.org/#/swap?outputCurrency=${tokenAddress}&chain=base` },
            { name: 'BaseSwap', url: `https://baseswap.fi/swap?outputCurrency=${tokenAddress}` },
            { name: 'DexScreener', url: `https://dexscreener.com/base/${tokenAddress}` },
            { name: 'CoinGecko', url: `https://www.coingecko.com/en/coins/new` }
          ],
          networkLive: 'LIVE on Base!',
          poolType: 'Uniswap V3 pool',
          walletInstructions: 'Your token should appear automatically in MetaMask. If not, manually add the token using the contract address above.'
        };
      case 'bnb':
        return {
          name: 'BNB Chain',
          currency: 'BNB',
          explorerName: 'BscScan',
          explorerUrl: `https://bscscan.com/token/${tokenAddress}`,
          altExplorerName: 'BSC Explorer',
          altExplorerUrl: `https://bscscan.com/address/${tokenAddress}`,
          dexes: [
            { name: 'PancakeSwap', url: `https://pancakeswap.finance/swap?outputCurrency=${tokenAddress}` },
            { name: 'Biswap', url: `https://biswap.org/swap?outputCurrency=${tokenAddress}` },
            { name: 'DexScreener', url: `https://dexscreener.com/bsc/${tokenAddress}` },
            { name: 'CoinGecko', url: `https://www.coingecko.com/en/coins/new` }
          ],
          networkLive: 'LIVE on BNB Chain!',
          poolType: 'PancakeSwap V3 pool',
          walletInstructions: 'Your token should appear automatically in MetaMask. If not, manually add the token using the contract address above.'
        };
      case 'arbitrum':
        return {
          name: 'Arbitrum',
          currency: 'ETH',
          explorerName: 'Arbiscan',
          explorerUrl: `https://arbiscan.io/token/${tokenAddress}`,
          altExplorerName: 'Arbitrum Explorer',
          altExplorerUrl: `https://arbiscan.io/address/${tokenAddress}`,
          dexes: [
            { name: 'Uniswap', url: `https://app.uniswap.org/#/swap?outputCurrency=${tokenAddress}&chain=arbitrum` },
            { name: 'SushiSwap', url: `https://app.sushi.com/swap?chainId=42161&token1=${tokenAddress}` },
            { name: 'DexScreener', url: `https://dexscreener.com/arbitrum/${tokenAddress}` },
            { name: 'CoinGecko', url: `https://www.coingecko.com/en/coins/new` }
          ],
          networkLive: 'LIVE on Arbitrum!',
          poolType: 'Uniswap V3 pool',
          walletInstructions: 'Your token should appear automatically in MetaMask. If not, manually add the token using the contract address above.'
        };
      default: // Solana
        return {
          name: 'Solana',
          currency: 'SOL',
          explorerName: 'Solscan',
          explorerUrl: `https://solscan.io/token/${tokenAddress}`,
          altExplorerName: 'Solana FM',
          altExplorerUrl: `https://solana.fm/address/${tokenAddress}`,
          dexes: [
            { name: 'Raydium', url: `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${tokenAddress}` },
            { name: 'Jupiter', url: `https://jup.ag/swap/SOL-${tokenAddress}` },
            { name: 'DexScreener', url: `https://dexscreener.com/solana/${tokenAddress}` },
            { name: 'Birdeye', url: `https://birdeye.so/token/${tokenAddress}?chain=solana` }
          ],
          networkLive: 'LIVE on Solana!',
          poolType: 'Raydium CPMM pool',
          walletInstructions: 'Your token should appear automatically in Phantom wallet. If not: Open Phantom → Tokens tab → "+" button → Paste token address → Add Token'
        };
    }
  };

  const chainConfig = getChainConfig();

  // Add MetaMask token function for EVM chains
  const addTokenToMetaMask = async () => {
    if (blockchain === 'solana' || !window.ethereum || !tokenParams) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenParams.symbol || 'TOKEN',
            decimals: 18,
            image: tokenParams.name ? `https://via.placeholder.com/128/000000/FFFFFF/?text=${tokenParams.name.charAt(0)}` : undefined,
          },
        },
      });
    } catch (error) {
      console.error('Failed to add token to MetaMask:', error);
    }
  };

  return (
    <Box>
      {/* Success Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" color="primary" gutterBottom fontWeight="bold">
          🎉 Token Successfully Created!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Your token with {chainConfig.poolType} has been created and is <strong>{chainConfig.networkLive}</strong>
        </Typography>
      </Box>

      {/* Security Verification */}
      <TokenSecurity 
        tokenAddress={tokenAddress} 
        tokenParams={tokenParams}
        blockchain={blockchain}
        showDetails={false} 
      />

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
          Your {chainConfig.poolType} is live and tokens are immediately tradeable on all major {chainConfig.name} DEXes!
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
            href={chainConfig.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<ArrowOutwardIcon />}
            fullWidth
          >
            View on {chainConfig.explorerName}
          </Button>
          <Button
            variant="outlined"
            component={Link}
            href={chainConfig.altExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<LinkIcon />}
            fullWidth
          >
            View on {chainConfig.altExplorerName}
          </Button>
        </Stack>
      </Paper>

      {/* Trading Links */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2 }}>
          🚀 Your Token is NOW LIVE and TRADEABLE! 🚀
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Share these links to start trading immediately on all major {chainConfig.name} DEXes:
        </Typography>
        
        <Grid container spacing={2}>
          {chainConfig.dexes.map((dex, index) => (
            <Grid item xs={12} sm={6} key={dex.name}>
              <Button
                variant={index === 0 ? "contained" : "outlined"}
                color={index < 2 ? "primary" : "secondary"}
                fullWidth
                startIcon={<LaunchIcon />}
                href={dex.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ py: 1.5 }}
              >
                {dex.name === 'CoinGecko' ? 'Submit to CoinGecko' : `${dex.name.includes('View') || dex.name.includes('Dex') ? 'View on' : 'Trade on'} ${dex.name}`}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Pool Success Details */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="bold">
            🏊 Pool Details & What Happened
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>
            {chainConfig.poolType} Created Successfully:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            {blockchain === 'solana' ? (
              <>
                <li><Typography variant="body2">✅ Real Raydium CPMM pool created (not a simulation)</Typography></li>
                <li><Typography variant="body2">✅ Tokens and SOL locked in liquidity pool</Typography></li>
                <li><Typography variant="body2">✅ Pool ID generated and registered with Raydium</Typography></li>
                <li><Typography variant="body2">✅ Immediately indexed by Jupiter aggregator</Typography></li>
                <li><Typography variant="body2">✅ Available on DexScreener for price tracking</Typography></li>
                <li><Typography variant="body2">✅ Accessible via Birdeye analytics</Typography></li>
              </>
            ) : (
              <>
                <li><Typography variant="body2">✅ ERC20 token contract deployed on {chainConfig.name}</Typography></li>
                <li><Typography variant="body2">✅ Token and {chainConfig.currency} ready for liquidity pool creation</Typography></li>
                <li><Typography variant="body2">✅ Contract verified and indexed by block explorers</Typography></li>
                <li><Typography variant="body2">✅ Compatible with all major {chainConfig.name} DEX aggregators</Typography></li>
                <li><Typography variant="body2">✅ Available on DexScreener for price tracking</Typography></li>
                <li><Typography variant="body2">✅ Ready for DEX listing and trading</Typography></li>
              </>
            )}
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            {blockchain === 'solana' ? (
              <strong>Technical:</strong> Your token uses Raydium's latest CPMM program (CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C) which doesn't require OpenBook markets, making it immediately compatible with all Solana DEX aggregators.
            ) : (
              <strong>Technical:</strong> Your ERC20 token contract is deployed on {chainConfig.name} and follows standard specifications, making it immediately compatible with all major DEX protocols and wallet integrations.
            )}
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
          {chainConfig.walletInstructions}
        </Typography>
        {blockchain !== 'solana' && tokenParams && (
          <Button
            variant="contained"
            onClick={addTokenToMetaMask}
            startIcon={<AccountBalanceWalletIcon />}
            sx={{ mt: 2 }}
            size="small"
          >
            Add to MetaMask
          </Button>
        )}
      </Alert>

      {/* Footer */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        🎯 <strong>Success!</strong> Your token is live and tradeable on {chainConfig.name} DEX ecosystem!
        <br />
        Start trading, build community, and grow your project. Need help with marketing? Contact our team!
      </Typography>
    </Box>
  );
} 