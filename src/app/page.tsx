'use client';

import { Box, Button, Container, Typography, Card, CardContent, CardMedia, Chip, Tooltip } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import Link from 'next/link';
import Image from 'next/image';
import SafeImage from '@/components/common/SafeImage';
import { useEffect, useState } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { formatMarketCap, formatPrice } from '@/utils/tokenPrices';

// Blockchain indicator component (+ Multi badge)
const BlockchainBadge = ({ blockchain, isMulti }: { blockchain?: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron', isMulti?: boolean }) => {
  if (!blockchain) return null;
  
  const config = {
    solana: { icon: '◎', color: '#14F195', label: 'SOL' },
    hyperliquid: { icon: 'HL', color: '#00D4AA', label: 'HL' },
    polygon: { icon: '🔷', color: '#8247E5', label: 'MATIC' },
    base: { icon: '🔵', color: '#0052FF', label: 'BASE' },
    bnb: { icon: '🟡', color: '#F0B90B', label: 'BNB' },
    bitcoin: { icon: '₿', color: '#F7931A', label: 'BTC' },
    arbitrum: { icon: '🔺', color: '#28A0F0', label: 'ARB' },
    tron: { icon: '🔴', color: '#FF0013', label: 'TRX' }
  };
  
  const { icon, color, label } = config[blockchain];
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: color,
        color: 'white',
        borderRadius: '12px',
        padding: '2px 6px',
        fontSize: '0.6rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        minWidth: '24px',
        justifyContent: 'center',
        zIndex: 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }}
    >
      <span style={{ fontSize: '0.7rem' }}>{icon}</span>
      <span>{label}</span>
      {isMulti && (
        <span style={{
          marginLeft: 4,
          background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
          borderRadius: 8,
          padding: '0 4px',
          fontSize: '0.55rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}>MULTI</span>
      )}
    </Box>
  );
};

// Token interface
interface Token {
  id?: number;
  token_address: string;
  token_name: string;
  token_symbol: string;
  token_image?: string;
  user_address?: string;
  decimals?: number;
  supply?: number;
  marketCap?: number; // New field for market cap
  price?: number;     // New field for token price
  created_at?: string; // Added for sorting by date
  blockchain?: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron'; // Multi-chain support
  network?: string;
  token_standard?: string;
  explorer_url?: string;
  // mark token as part of an omnichain batch
  chain_specific_data?: any;
}

export default function Home() {
  const [hotTokens, setHotTokens] = useState<Token[]>([]);
  const [recentTokens, setRecentTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMoreRecent, setShowMoreRecent] = useState(false);

  // Fetch tokens from the API
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        
        // Fetch tokens from API
        const response = await fetch('/api/tokens/recent');
        const data = await response.json();
        
        if (data.success && data.tokens && data.tokens.length > 0) {
          // Sort tokens by creation date for recent tokens (newest first)
          const sortedByDate = [...data.tokens].sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          
          // Sort tokens by market cap for hot tokens (highest first)
          const sortedByMarketCap = [...data.tokens].sort((a, b) => 
            (b.marketCap || 0) - (a.marketCap || 0)
          );
          
          setRecentTokens(sortedByDate);
          setHotTokens(sortedByMarketCap);
        } else {
          // Generate placeholders if API request fails or returns empty data
          const placeholders = generatePlaceholders(100);
          setHotTokens(placeholders);
          setRecentTokens(placeholders);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
        const placeholders = generatePlaceholders(100);
        setHotTokens(placeholders);
        setRecentTokens(placeholders);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  // Generate placeholder tokens if no real tokens are available
  const generatePlaceholders = (count: number) => {
    return Array(count).fill(null).map((_, i) => {
      // Random price for demonstration
      const price = Math.random() * 0.001;
      const supply = Math.floor(Math.random() * 1000000000) + 1000000;
      const marketCap = price * supply;
      const blockchains: ('solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron')[] = ['solana', 'hyperliquid', 'polygon', 'base', 'bnb', 'bitcoin', 'arbitrum', 'tron'];
      const blockchain = blockchains[i % blockchains.length]; // Mix of all blockchains
      
      return {
        token_address: blockchain === 'hyperliquid' ? `HL_${i}` : `placeholder-${i}`,
        token_name: `Token ${i+1}`,
        token_symbol: `TKN${i+1}`,
        token_image: `/images/logo.png`,
        supply,
        price,
        marketCap,
        blockchain,
        token_standard: blockchain === 'hyperliquid' ? 'HIP-1' : blockchain === 'polygon' || blockchain === 'base' || blockchain === 'arbitrum' ? 'ERC-20' : blockchain === 'bitcoin' ? 'BRC-20' : blockchain === 'tron' ? 'TRC-20' : 'SPL',
        created_at: new Date(Date.now() - i * 86400000).toISOString() // Decreasing dates
      };
    });
  };

  // Use real tokens if available, otherwise show empty state
  const displayedHotTokens = hotTokens.length > 0 ? hotTokens : [];
  const displayedRecentTokens = recentTokens.length > 0 ? recentTokens : [];

  return (
    <>
      {/* Hero section - compact for token wall focus */}
      <Container maxWidth="lg" sx={{ py: { xs: 1, md: 1.5 } }}>
        <Grid container spacing={{ xs: 1, md: 2 }} sx={{ my: { xs: 0, md: 0.5 } }}>
          <Grid xs={12} sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <Typography variant="body2" component="h2" color="text.secondary" paragraph sx={{ mb: 1 }}>
              Create DEX-tradable tokens with liquidity pools in just one step. Now supporting 8 major blockchain networks:
            </Typography>
            
            {/* Chain logos row */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5 },
              mb: 2,
              flexWrap: 'wrap'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Image
                  src="/images/chain-logos/Solana.png"
                  alt="Solana"
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Solana</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Image
                  src="/images/chain-logos/Polygon.png"
                  alt="Polygon"
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Polygon</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Image
                  src="/images/chain-logos/Base.png"
                  alt="BASE"
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>BASE</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Image
                  src="/images/chain-logos/Bnb.png"
                  alt="BNB Chain"
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>BNB Chain</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Image
                  src="/images/chain-logos/Arbitrum.png"
                  alt="Arbitrum"
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Arbitrum</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Image
                  src="/images/chain-logos/Bitcoin.png"
                  alt="Bitcoin"
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Bitcoin</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Image
                  src="/images/chain-logos/Tron.png"
                  alt="TRON"
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>TRON</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Image
                  src="/images/chain-logos/HyperLiquid.png"
                  alt="HYPER LIQUID"
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>HYPER LIQUID</Typography>
              </Box>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              gap: 1.5, 
              mt: 0,
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'center'
            }}>
              <Button 
                component={Link}
                href="/create-token"
                variant="contained" 
                size="small"
                color="primary"
                fullWidth={false}
              >
                Create Token
              </Button>
                <Button
                  component={Link}
                  href="/create-multichain"
                  variant="outlined"
                  size="small"
                  color="secondary"
                  fullWidth={false}
                >
                  Create MultiChain Token
                </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Hot Tokens Section - NO SIDE PADDING */}
      <Box sx={{ bgcolor: 'background.paper', py: 3 }}>
        {/* Title with minimal container */}
        <Container maxWidth="lg" sx={{ mb: 2 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            align="center" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2rem' }
            }}
          >
            <LocalFireDepartmentIcon sx={{ mr: 1, color: 'orange' }} /> Hot Tokens <LocalFireDepartmentIcon sx={{ ml: 1, color: 'orange' }} />
          </Typography>
        </Container>

        {/* Tokens grid - FULL WIDTH, NO PADDING */}
        <Box sx={{ px: { xs: 0.5, sm: 1 } }}>
          <Grid container spacing={{ xs: 0.5, sm: 1 }}>
            {displayedHotTokens.length > 0 ? (
              displayedHotTokens.slice(0, 20).map((token) => (
                <Grid 
                  key={token.token_address} 
                  xs={3} 
                  sm={4} 
                  md={2.4} 
                  lg={1.2} 
                  xl={1.2}
                  sx={{
                    // Custom breakpoint for huge screens (10 across)
                    '@media (min-width: 1920px)': {
                      flexBasis: '10%',
                      maxWidth: '10%'
                    }
                  }}
                >
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.03)',
                      }
                    }}
                    component={Link}
                    href={`/token/${token.token_address}`}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia 
                        component="div"
                        sx={{
                          position: 'relative',
                          paddingTop: '100%', // 1:1 aspect ratio
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '2px solid #333',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                      >
                        <SafeImage
                          src={token.token_image || '/images/logo.png'}
                          alt={token.token_name}
                          fill
                          sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, (max-width: 1920px) 20vw, 10vw"
                          style={{ objectFit: 'cover' }}
                        />
                      </CardMedia>
                      <BlockchainBadge blockchain={token.blockchain} isMulti={Boolean((token as any)?.chain_specific_data?.omniBatchId)} />
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 1, '&:last-child': { pb: 1 } }}>
                      <Typography variant="caption" align="center" noWrap sx={{ fontWeight: 'bold', display: 'block', lineHeight: 1.2, mb: 0.5 }}>
                        {token.token_name}
                      </Typography>
                      <Typography variant="caption" align="center" color="text.secondary" display="block" sx={{ fontSize: '0.65rem', mb: 0.75 }}>
                        {token.token_symbol}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Tooltip title="Market Cap">
                          <Chip 
                            icon={<TrendingUpIcon sx={{ fontSize: '0.8rem !important' }} />}
                            label={formatMarketCap(token.marketCap)}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              width: '100%', 
                              height: '24px',
                              '& .MuiChip-label': { 
                                fontSize: '0.65rem',
                                px: 0.5
                              }
                            }}
                          />
                        </Tooltip>
                        
                        <Tooltip title="Token Price">
                          <Chip 
                            icon={<AttachMoneyIcon sx={{ fontSize: '0.8rem !important' }} />}
                            label={formatPrice(token.price)}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              width: '100%',
                              height: '24px',
                              '& .MuiChip-label': { 
                                fontSize: '0.65rem',
                                px: 0.5
                              }
                            }}
                          />
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid xs={12}>
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  color: 'text.secondary'
                }}>
                  <Typography variant="h6" gutterBottom>
                    🚀 No hot tokens yet!
                  </Typography>
                  <Typography variant="body2">
                    Be the first to create a token that gets trending
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>

      {/* Recently Created Tokens Section - NO SIDE PADDING */}
      <Box sx={{ py: 3 }}>
        {/* Title with minimal container */}
        <Container maxWidth="lg" sx={{ mb: 2 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            align="center" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              mb: 2,
              fontSize: { xs: '1.5rem', md: '1.75rem' }
            }}
          >
            Recently Created Tokens
          </Typography>
        </Container>

        {/* Tokens grid - FULL WIDTH, NO PADDING, EVEN SMALLER */}
        <Box sx={{ px: { xs: 0.25, sm: 0.5 } }}>
          <Grid container spacing={{ xs: 0.25, sm: 0.5 }}>
            {displayedRecentTokens.length > 0 ? (
              displayedRecentTokens.slice(0, showMoreRecent ? 100 : 50).map((token) => (
                <Grid 
                  key={token.token_address} 
                  xs={2} 
                  sm={3} 
                  md={1.5} 
                  lg={0.8} 
                  xl={0.8}
                  sx={{
                    // Custom breakpoint for huge screens (15 across)
                    '@media (min-width: 1920px)': {
                      flexBasis: '6.666%',
                      maxWidth: '6.666%'
                    }
                  }}
                >
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      }
                    }}
                    component={Link}
                    href={`/token/${token.token_address}`}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia 
                        component="div"
                        sx={{
                          position: 'relative',
                          paddingTop: '100%', // 1:1 aspect ratio
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '2px solid #333',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                      >
                        <SafeImage
                          src={token.token_image || '/images/logo.png'}
                          alt={token.token_name}
                          fill
                          sizes="(max-width: 600px) 50vw, (max-width: 960px) 25vw, (max-width: 1920px) 12vw, 6.666vw"
                          style={{ objectFit: 'cover' }}
                        />
                      </CardMedia>
                      <BlockchainBadge blockchain={token.blockchain} isMulti={Boolean((token as any)?.chain_specific_data?.omniBatchId)} />
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 0.75, '&:last-child': { pb: 0.75 } }}>
                      <Typography variant="caption" align="center" noWrap sx={{ 
                        fontWeight: 'bold', 
                        display: 'block', 
                        lineHeight: 1.1,
                        fontSize: '0.65rem',
                        mb: 0.25
                      }}>
                        {token.token_name}
                      </Typography>
                      <Typography variant="caption" align="center" color="text.secondary" display="block" sx={{ 
                        fontSize: '0.55rem', 
                        mb: 0.5,
                        lineHeight: 1
                      }}>
                        {token.token_symbol}
                      </Typography>
                      <Tooltip title="Market Cap">
                        <Chip 
                          icon={<TrendingUpIcon sx={{ fontSize: '0.7rem !important' }} />}
                          label={formatMarketCap(token.marketCap)}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            width: '100%',
                            height: '20px',
                            '& .MuiChip-label': { 
                              fontSize: '0.6rem',
                              px: 0.25
                            }
                          }}
                        />
                      </Tooltip>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid xs={12}>
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  color: 'text.secondary'
                }}>
                  <Typography variant="h6" gutterBottom>
                    🎯 No tokens created yet!
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Start creating the first meme coin on Redbull Coins
                  </Typography>
                  <Button 
                    component={Link}
                    href="/create-token"
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                  >
                    Create Your First Token
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Load More Button */}
          {displayedRecentTokens.length > 50 && !showMoreRecent && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button 
                variant="outlined" 
                onClick={() => setShowMoreRecent(true)}
                size="large"
                sx={{ px: 4 }}
              >
                Load More Tokens
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
}
