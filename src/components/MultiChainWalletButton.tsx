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
  Tooltip
} from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';
import { useHyperLiquid } from './HyperLiquidProvider';
import { usePolygon } from './PolygonProvider';
import { useBase } from './BaseProvider';
import { useRsk } from './RskProvider';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';

export default function MultiChainWalletButton() {
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<'solana' | 'hyperliquid' | 'polygon' | 'base' | 'rsk' | null>(null);
  
  const solanaWallet = useWallet();
  const hyperLiquidWallet = useHyperLiquid();
  const polygonWallet = usePolygon();
  const baseWallet = useBase();
  const rskWallet = useRsk();

  const isConnected = solanaWallet.connected || hyperLiquidWallet.connected || polygonWallet.connected || baseWallet.connected || rskWallet.connected;
  const connectedNetwork = solanaWallet.connected ? 'solana' : hyperLiquidWallet.connected ? 'hyperliquid' : polygonWallet.connected ? 'polygon' : baseWallet.connected ? 'base' : rskWallet.connected ? 'rsk' : null;

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
      if (rskWallet.connected) {
        rskWallet.disconnect();
      }
    } else {
      // If not connected, show network selection
      setShowNetworkModal(true);
    }
  };

  const handleNetworkSelect = async (network: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'rsk') => {
    setSelectedNetwork(network);
    setShowNetworkModal(false);
    
    try {
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
      } else if (network === 'rsk') {
        // Connect to Bitcoin (RSK)
        await rskWallet.connect();
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
    
    if (rskWallet.connected && rskWallet.address) {
      return {
        network: 'Bitcoin',
        address: `${rskWallet.address.slice(0, 4)}...${rskWallet.address.slice(-4)}`,
        color: '#F7931A'
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
          
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
            <Card 
              sx={{ 
                flex: 1, 
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
                <Avatar sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: '#14F195', 
                  mx: 'auto', 
                  mb: 2,
                  fontSize: '1.5rem'
                }}>
                  ◎
                </Avatar>
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

            <Card 
              sx={{ 
                flex: 1, 
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
                <Avatar sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: '#8247E5', 
                  mx: 'auto', 
                  mb: 2,
                  fontSize: '1.5rem'
                }}>
                  🔷
                </Avatar>
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

            <Card 
              sx={{ 
                flex: 1, 
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
                <Avatar sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: '#0052FF', 
                  mx: 'auto', 
                  mb: 2,
                  fontSize: '1.5rem'
                }}>
                  🔵
                </Avatar>
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

            <Card 
              sx={{ 
                flex: 1, 
                cursor: 'pointer',
                border: '2px solid transparent',
                '&:hover': { 
                  border: '2px solid #F7931A',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                }
              }}
              onClick={() => handleNetworkSelect('rsk')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: '#F7931A', 
                  mx: 'auto', 
                  mb: 2,
                  fontSize: '1.5rem'
                }}>
                  ₿
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Bitcoin
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with MetaMask
                  <br />
                  RSK sidechain with Sovryn
                </Typography>
              </CardContent>
            </Card>

            <Card 
              sx={{ 
                flex: 1, 
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
                <Avatar sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: '#00D4AA', 
                  mx: 'auto', 
                  mb: 2,
                  fontSize: '1.2rem'
                }}>
                  HL
                </Avatar>
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
          </Box>
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