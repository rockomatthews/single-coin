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
}

export default function Home() {
  const [hotTokens, setHotTokens] = useState<Token[]>([]);
  const [recentTokens, setRecentTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotTokensToShow, setHotTokensToShow] = useState(28); // 14 x 2 rows
  const [recentTokensToShow, setRecentTokensToShow] = useState(50);

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
      
      return {
        token_address: `placeholder-${i}`,
        token_name: `Token ${i+1}`,
        token_symbol: `TKN${i+1}`,
        token_image: `/images/logo.png`,
        supply,
        price,
        marketCap,
        created_at: new Date(Date.now() - i * 86400000).toISOString() // Decreasing dates
      };
    });
  };

  // Load more functions
  const loadMoreHotTokens = () => {
    setHotTokensToShow(prev => prev + 28);
  };

  const loadMoreRecentTokens = () => {
    setRecentTokensToShow(prev => prev + 50);
  };

  // Use real tokens if available, otherwise show empty state
  const displayedHotTokens = hotTokens.length > 0 ? hotTokens : [];
  const displayedRecentTokens = recentTokens.length > 0 ? recentTokens : [];

  return (
    <>
      {/* Hero section - compact for token wall focus */}
      <Container maxWidth="lg" sx={{ py: { xs: 1, md: 1.5 } }}>
        <Grid container spacing={{ xs: 1, md: 2 }} sx={{ my: { xs: 0, md: 0.5 } }}>
          <Grid xs={12} md={6} sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: { xs: 'center', md: 'flex-start' },
            textAlign: { xs: 'center', md: 'left' }
          }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ 
              color: 'primary.main', 
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', md: '1.8rem' },
              mb: 1
            }}>
              Coinbull
            </Typography>
            <Typography variant="body2" component="h2" color="text.secondary" paragraph sx={{ mb: 1.5 }}>
              Create verified Solana meme coins with a liquidity pool and a rich metadata display in just one step.
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1.5, 
              mt: 0,
              flexDirection: { xs: 'column', sm: 'row' }
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
                href="/my-tokens"
                variant="outlined" 
                size="small"
                fullWidth={false}
              >
                My Tokens
              </Button>
            </Box>
          </Grid>
          <Grid xs={12} md={6} sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            mt: { xs: 1, md: 0 }
          }}>
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: { xs: '80px', sm: '100px' }, 
              height: { xs: '80px', sm: '100px' }
            }}>
              <Image
                src="/images/logo.png" 
                alt="Coinbull Logo" 
                fill
                priority
                style={{ 
                  objectFit: 'contain',
                }} 
              />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Hot Tokens Section - Coin Wall */}
      <Box sx={{ bgcolor: 'background.paper', py: 4, px: 0 }}>
        <Container maxWidth="lg" sx={{ px: 0 }}>
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
              mb: 3,
              px: 2
            }}
          >
            <LocalFireDepartmentIcon sx={{ mr: 1, color: 'orange' }} /> 🔥Hot Tokens🔥 <LocalFireDepartmentIcon sx={{ ml: 1, color: 'orange' }} />
          </Typography>
          
          {/* Custom CSS Grid for exactly 14 across */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(14, 1fr)',
            gap: '4px',
            px: '2px',
            '@media (max-width: 1200px)': {
              gridTemplateColumns: 'repeat(10, 1fr)',
            },
            '@media (max-width: 900px)': {
              gridTemplateColumns: 'repeat(6, 1fr)',
            },
            '@media (max-width: 600px)': {
              gridTemplateColumns: 'repeat(4, 1fr)',
            },
          }}>
            {displayedHotTokens.length > 0 ? (
              displayedHotTokens.slice(0, hotTokensToShow).map((token) => (
                <Card 
                  key={token.token_address}
                  sx={{ 
                    aspectRatio: '1',
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      zIndex: 1,
                    },
                    cursor: 'pointer',
                  }}
                  component={Link}
                  href={`/token/${token.token_address}`}
                >
                  <CardMedia 
                    component="div"
                    sx={{
                      position: 'relative',
                      paddingTop: '70%',
                      flex: 1,
                    }}
                  >
                    <SafeImage
                      src={token.token_image || '/images/logo.png'}
                      alt={token.token_name}
                      fill
                      sizes="100px"
                      style={{ objectFit: 'cover' }}
                    />
                  </CardMedia>
                  <CardContent sx={{ p: '4px !important', minHeight: '40px' }}>
                    <Typography variant="caption" align="center" noWrap sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
                      {token.token_symbol}
                    </Typography>
                    <Typography variant="caption" align="center" color="text.secondary" display="block" sx={{ fontSize: '0.55rem' }}>
                      {formatMarketCap(token.marketCap)}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            ) : (
              Array(28).fill(null).map((_, i) => (
                <Card 
                  key={`placeholder-${i}`}
                  sx={{ 
                    aspectRatio: '1',
                    display: 'flex', 
                    flexDirection: 'column',
                    opacity: 0.3,
                  }}
                >
                  <CardMedia 
                    component="div"
                    sx={{
                      position: 'relative',
                      paddingTop: '70%',
                      flex: 1,
                      bgcolor: 'grey.200'
                    }}
                  />
                  <CardContent sx={{ p: '4px !important', minHeight: '40px' }}>
                    <Typography variant="caption" align="center" sx={{ fontSize: '0.65rem' }}>
                      ---
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>

          {/* Load More Hot Tokens */}
          {displayedHotTokens.length > hotTokensToShow && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button 
                variant="outlined" 
                onClick={loadMoreHotTokens}
                sx={{ px: 4 }}
              >
                Load More Hot Tokens
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      {/* Recently Created Tokens Section - Smaller Coin Wall */}
      <Box sx={{ py: 4, px: 0 }}>
        <Container maxWidth="lg" sx={{ px: 0 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            align="center" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              mb: 3,
              px: 2
            }}
          >
            Recently Created Tokens
          </Typography>
          
          {/* Custom CSS Grid for smaller tokens - more across */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(25, 1fr)',
            gap: '2px',
            px: '1px',
            '@media (max-width: 1400px)': {
              gridTemplateColumns: 'repeat(20, 1fr)',
            },
            '@media (max-width: 1200px)': {
              gridTemplateColumns: 'repeat(15, 1fr)',
            },
            '@media (max-width: 900px)': {
              gridTemplateColumns: 'repeat(10, 1fr)',
            },
            '@media (max-width: 600px)': {
              gridTemplateColumns: 'repeat(6, 1fr)',
            },
          }}>
            {displayedRecentTokens.length > 0 ? (
              displayedRecentTokens.slice(0, recentTokensToShow).map((token) => (
                <Card 
                  key={token.token_address}
                  sx={{ 
                    aspectRatio: '1',
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      zIndex: 1,
                    },
                    cursor: 'pointer',
                  }}
                  component={Link}
                  href={`/token/${token.token_address}`}
                >
                  <CardMedia 
                    component="div"
                    sx={{
                      position: 'relative',
                      paddingTop: '80%',
                      flex: 1,
                    }}
                  >
                    <SafeImage
                      src={token.token_image || '/images/logo.png'}
                      alt={token.token_name}
                      fill
                      sizes="60px"
                      style={{ objectFit: 'cover' }}
                    />
                  </CardMedia>
                  <CardContent sx={{ p: '2px !important', minHeight: '20px' }}>
                    <Typography variant="caption" align="center" noWrap sx={{ fontSize: '0.5rem', lineHeight: 1 }}>
                      {token.token_symbol}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            ) : (
              Array(50).fill(null).map((_, i) => (
                <Card 
                  key={`recent-placeholder-${i}`}
                  sx={{ 
                    aspectRatio: '1',
                    display: 'flex', 
                    flexDirection: 'column',
                    opacity: 0.2,
                  }}
                >
                  <CardMedia 
                    component="div"
                    sx={{
                      position: 'relative',
                      paddingTop: '80%',
                      flex: 1,
                      bgcolor: 'grey.200'
                    }}
                  />
                  <CardContent sx={{ p: '2px !important', minHeight: '20px' }}>
                    <Typography variant="caption" align="center" sx={{ fontSize: '0.5rem' }}>
                      --
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>

          {/* Load More Recent Tokens */}
          {displayedRecentTokens.length > recentTokensToShow && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button 
                variant="outlined" 
                onClick={loadMoreRecentTokens}
                sx={{ px: 4 }}
              >
                Load More Recent Tokens
              </Button>
            </Box>
          )}

          {/* Empty state for recent tokens */}
          {displayedRecentTokens.length === 0 && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              color: 'text.secondary'
            }}>
              <Typography variant="h6" gutterBottom>
                🎯 No tokens created yet!
              </Typography>
              <Typography variant="body2" gutterBottom>
                Start creating the first meme coin on Coinbull
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
          )}
        </Container>
      </Box>
    </>
  );
}
