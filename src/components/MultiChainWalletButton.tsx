'use client';

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import { useHyperLiquid } from './HyperLiquidProvider';
import { usePolygon } from './PolygonProvider';
import { useBase } from './BaseProvider';
import { useBnb } from './BnbProvider';
import { useBrc20 } from './Brc20Provider';
import { useArbitrum } from './ArbitrumProvider';
import { useTron } from './TronProvider';
import { useKatana } from './KatanaProvider';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';

export default function MultiChainWalletButton() {
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron' | 'katana' | null>(null);
  
  const solanaWallet = useWallet();
  const hyperLiquidWallet = useHyperLiquid();
  const polygonWallet = usePolygon();
  const baseWallet = useBase();
  const bnbWallet = useBnb();
  const bitcoinWallet = useBrc20();
  const arbitrumWallet = useArbitrum();
  const tronWallet = useTron();
  const katanaWallet = useKatana();

  const isConnected = solanaWallet.connected || hyperLiquidWallet.connected || polygonWallet.connected || baseWallet.connected || bnbWallet.connected || bitcoinWallet.connected || arbitrumWallet.isConnected || tronWallet.isConnected || katanaWallet.connected;
  const connectedNetwork = solanaWallet.connected ? 'solana' : hyperLiquidWallet.connected ? 'hyperliquid' : polygonWallet.connected ? 'polygon' : baseWallet.connected ? 'base' : bnbWallet.connected ? 'bnb' : bitcoinWallet.connected ? 'bitcoin' : arbitrumWallet.isConnected ? 'arbitrum' : tronWallet.isConnected ? 'tron' : katanaWallet.connected ? 'katana' : null;

  const handleConnectClick = () => {
    if (isConnected) {
      // If connected, disconnect
      if (solanaWallet.connected) {
        solanaWallet.disconnect();
      }
      if (hyperLiquidWallet.connected) {
        hyperLiquidWallet.disconnect();
      }
      if (polygonWallet.connected) {
        polygonWallet.disconnect();
      }
      if (baseWallet.connected) {
        baseWallet.disconnect();
      }
      if (bnbWallet.connected) {
        bnbWallet.disconnect();
      }
      if (bitcoinWallet.connected) {
        bitcoinWallet.disconnect();
      }
      if (arbitrumWallet.isConnected) {
        arbitrumWallet.disconnect();
      }
      if (tronWallet.isConnected) {
        tronWallet.disconnect();
      }
    } else {
      // If not connected, show network selection
      setShowNetworkModal(true);
    }
  };

  const handleNetworkSelect = async (network: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron' | 'katana') => {
    setSelectedNetwork(network);
    setShowNetworkModal(false);
    
    try {
      // First, disconnect all existing connections to avoid conflicts
      if (solanaWallet.connected) {
        solanaWallet.disconnect();
      }
      if (hyperLiquidWallet.connected) {
        hyperLiquidWallet.disconnect();
      }
      if (polygonWallet.connected) {
        polygonWallet.disconnect();
      }
      if (baseWallet.connected) {
        baseWallet.disconnect();
      }
      if (bnbWallet.connected) {
        bnbWallet.disconnect();
      }
      if (bitcoinWallet.connected) {
        bitcoinWallet.disconnect();
      }
      if (arbitrumWallet.isConnected) {
        arbitrumWallet.disconnect();
      }
      if (tronWallet.isConnected) {
        tronWallet.disconnect();
      }
      if (katanaWallet.connected) {
        katanaWallet.disconnect();
      }

      // Small delay to ensure disconnection is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (network === 'solana') {
        // Solana connection is handled by WalletMultiButton
        // We'll trigger it programmatically
        const solanaButton = document.querySelector('.wallet-adapter-button') as HTMLButtonElement;
        if (solanaButton) {
          solanaButton.click();
        }
      } else if (network === 'hyperliquid') {
        // Connect to HYPER LIQUID
        await hyperLiquidWallet.connect();
      } else if (network === 'polygon') {
        // Connect to Polygon
        await polygonWallet.connect();
      } else if (network === 'base') {
        // Connect to BASE
        await baseWallet.connect();
      } else if (network === 'bnb') {
        // Connect to BNB Chain
        await bnbWallet.connect();
      } else if (network === 'bitcoin') {
        // Connect to Bitcoin (BRC-20)
        await bitcoinWallet.connect();
      } else if (network === 'arbitrum') {
        // Connect to Arbitrum
        await arbitrumWallet.connect();
      } else if (network === 'tron') {
        // Connect to TRON
        await tronWallet.connect();
      } else if (network === 'katana') {
        await katanaWallet.connect();
      }
    } catch (error) {
      console.error(`Failed to connect to ${network}:`, error);
    }
  };

  const getWalletDisplay = () => {
    if (solanaWallet.connected && solanaWallet.publicKey) {
      const address = solanaWallet.publicKey.toString();
      return {
        network: 'Solana',
        address: `${address.slice(0, 4)}...${address.slice(-4)}`,
        color: '#14F195'
      };
    }
    
    if (hyperLiquidWallet.connected && hyperLiquidWallet.address) {
      return {
        network: 'HYPER LIQUID',
        address: `${hyperLiquidWallet.address.slice(0, 4)}...${hyperLiquidWallet.address.slice(-4)}`,
        color: '#00D4AA'
      };
    }
    
    if (polygonWallet.connected && polygonWallet.address) {
      return {
        network: 'Polygon',
        address: `${polygonWallet.address.slice(0, 4)}...${polygonWallet.address.slice(-4)}`,
        color: '#8247E5'
      };
    }
    
    if (baseWallet.connected && baseWallet.address) {
      return {
        network: 'BASE',
        address: `${baseWallet.address.slice(0, 4)}...${baseWallet.address.slice(-4)}`,
        color: '#0052FF'
      };
    }
    
    if (bnbWallet.connected && bnbWallet.address) {
      return {
        network: 'BNB Chain',
        address: `${bnbWallet.address.slice(0, 4)}...${bnbWallet.address.slice(-4)}`,
        color: '#F0B90B'
      };
    }
    
    if (bitcoinWallet.connected && bitcoinWallet.address) {
      return {
        network: 'Bitcoin',
        address: `${bitcoinWallet.address.slice(0, 4)}...${bitcoinWallet.address.slice(-4)}`,
        color: '#F7931A'
      };
    }
    
    if (arbitrumWallet.isConnected && arbitrumWallet.account) {
      return {
        network: 'Arbitrum',
        address: `${arbitrumWallet.account.slice(0, 4)}...${arbitrumWallet.account.slice(-4)}`,
        color: '#28A0F0'
      };
    }
    
    if (tronWallet.isConnected && tronWallet.account) {
      return {
        network: 'TRON',
        address: `${tronWallet.account.slice(0, 4)}...${tronWallet.account.slice(-4)}`,
        color: '#FF0013'
      };
    }
    
    return null;
  };

  const walletInfo = getWalletDisplay();

  if (isConnected && walletInfo) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Card sx={{ 
          bgcolor: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)',
          border: `1px solid ${walletInfo.color}50`
        }}>
          <CardContent sx={{ p: '8px 12px !important', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar 
              sx={{ 
                width: 24, 
                height: 24, 
                bgcolor: walletInfo.color,
                fontSize: '0.7rem'
              }}
            >
              {walletInfo.network[0]}
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: walletInfo.color, display: 'block', lineHeight: 1 }}>
                {walletInfo.network}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'white', lineHeight: 1 }}>
                {walletInfo.address}
              </Typography>
            </Box>
            <Tooltip title="Disconnect">
              <IconButton 
                size="small" 
                onClick={handleConnectClick}
                sx={{ 
                  color: 'white', 
                  width: 20, 
                  height: 20,
                  '&:hover': { color: '#ff4444' }
                }}
              >
                <LogoutIcon sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <>
      <Button
        variant="contained"
        onClick={handleConnectClick}
        startIcon={<AccountBalanceWalletIcon />}
        sx={{
          fontSize: { xs: '0.75rem', md: '0.875rem' },
          padding: { xs: '6px 12px', md: '8px 16px' },
          minHeight: { xs: '36px', md: '40px' },
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
          }
        }}
      >
        Connect Wallet
      </Button>

      <Dialog 
        open={showNetworkModal} 
        onClose={() => setShowNetworkModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          Choose Your Network
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Select which blockchain network you want to use for creating tokens
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  '&:hover': { 
                    border: '2px solid #E3FF00',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => handleNetworkSelect('katana')}
              >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  mx: 'auto', 
                  mb: 2,
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #E3FF00'
                }}>
                  <Image
                    src="/images/chain-logos/Katana.png"
                    alt="Katana"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Katana
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with MetaMask
                  <br />
                  Factory-based deploy
                </Typography>
              </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  '&:hover': { 
                    border: '2px solid #14F195',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => handleNetworkSelect('solana')}
              >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  mx: 'auto', 
                  mb: 2,
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #14F195'
                }}>
                  <Image
                    src="/images/chain-logos/Solana.png"
                    alt="Solana"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Solana
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with Phantom wallet
                  <br />
                  Low fees, fast transactions
                </Typography>
              </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  '&:hover': { 
                    border: '2px solid #8247E5',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => handleNetworkSelect('polygon')}
              >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  mx: 'auto', 
                  mb: 2,
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #8247E5'
                }}>
                  <Image
                    src="/images/chain-logos/Polygon.png"
                    alt="Polygon"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Polygon
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with MetaMask
                  <br />
                  Ultra-low fees (~$0.01)
                </Typography>
              </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  '&:hover': { 
                    border: '2px solid #0052FF',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => handleNetworkSelect('base')}
              >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  mx: 'auto', 
                  mb: 2,
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #0052FF'
                }}>
                  <Image
                    src="/images/chain-logos/Base.png"
                    alt="BASE"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  BASE
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with MetaMask
                  <br />
                  Coinbase L2 (~$3-5 fees)
                </Typography>
              </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  '&:hover': { 
                    border: '2px solid #F0B90B',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => handleNetworkSelect('bnb')}
              >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  mx: 'auto', 
                  mb: 2,
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #F0B90B'
                }}>
                  <Image
                    src="/images/chain-logos/Bnb.png"
                    alt="BNB Chain"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  BNB Chain
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with MetaMask
                  <br />
                  Popular for memes (~$0.50 fees)
                </Typography>
              </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  '&:hover': { 
                    border: '2px solid #F7931A',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => handleNetworkSelect('bitcoin')}
              >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  mx: 'auto', 
                  mb: 2,
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #F7931A'
                }}>
                  <Image
                    src="/images/chain-logos/Bitcoin.png"
                    alt="Bitcoin"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Bitcoin
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with Unisat wallet
                  <br />
                  BRC-20 inscriptions like PEPE
                </Typography>
              </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  '&:hover': { 
                    border: '2px solid #28A0F0',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => handleNetworkSelect('arbitrum')}
              >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  mx: 'auto', 
                  mb: 2,
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #28A0F0'
                }}>
                  <Image
                    src="/images/chain-logos/Arbitrum.png"
                    alt="Arbitrum"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Arbitrum
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with MetaMask
                  <br />
                  95% cheaper than Ethereum
                </Typography>
              </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  '&:hover': { 
                    border: '2px solid #00D4AA',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => handleNetworkSelect('hyperliquid')}
              >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  mx: 'auto', 
                  mb: 2,
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #00D4AA'
                }}>
                  <Image
                    src="/images/chain-logos/HyperLiquid.png"
                    alt="HYPER LIQUID"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  HYPER LIQUID
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with MetaMask
                  <br />
                  Advanced DeFi features
                </Typography>
              </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  '&:hover': { 
                    border: '2px solid #FF0013',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => handleNetworkSelect('tron')}
              >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  mx: 'auto', 
                  mb: 2,
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #FF0013'
                }}>
                  <Image
                    src="/images/chain-logos/Tron.png"
                    alt="TRON"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  TRON
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with TronLink
                  <br />
                  Ultra-cheap (~$0.10 fees)
                </Typography>
              </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setShowNetworkModal(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden Solana wallet button for programmatic triggering */}
      <Box sx={{ display: 'none' }}>
        <WalletMultiButton />
      </Box>
    </>
  );
}