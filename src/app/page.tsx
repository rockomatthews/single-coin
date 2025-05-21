'use client';

import { Box, Button, Container, Typography, Card, CardContent, CardMedia, Chip, Tooltip } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import Link from 'next/link';
import Image from 'next/image';
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
          const placeholders = generatePlaceholders(32);
          setHotTokens(placeholders);
          setRecentTokens(placeholders);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
        const placeholders = generatePlaceholders(32);
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

  // Use real tokens if available, otherwise use placeholders
  const displayedHotTokens = hotTokens.length > 0 ? hotTokens : generatePlaceholders(12);
  const displayedRecentTokens = recentTokens.length > 0 ? recentTokens : generatePlaceholders(32);

  return (
    <>
      {/* Hero section - reduced to 1/3 height */}
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Grid container spacing={{ xs: 2, md: 4 }} sx={{ my: { xs: 1, md: 2 } }}>
          <Grid xs={12} md={6} sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: { xs: 'center', md: 'flex-start' },
            textAlign: { xs: 'center', md: 'left' }
          }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ 
              color: 'primary.main', 
              fontWeight: 'bold',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}>
              Coinbull
            </Typography>
            <Typography variant="body1" component="h2" color="text.secondary" paragraph>
              Create verified Solana meme coins that show up with pictures, links, and descriptions.
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mt: 1,
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Button 
                component={Link}
                href="/create-token"
                variant="contained" 
                size="medium"
                color="primary"
                fullWidth={false}
              >
                Create Token
              </Button>
              <Button 
                component={Link}
                href="/my-tokens"
                variant="outlined" 
                size="medium"
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
            mt: { xs: 2, md: 0 }
          }}>
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: { xs: '120px', sm: '150px' }, 
              height: { xs: '120px', sm: '150px' }
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

      {/* Hot Tokens Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 4 }}>
        <Container maxWidth="lg">
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
              mb: 3
            }}
          >
            <LocalFireDepartmentIcon sx={{ mr: 1, color: 'orange' }} /> Hot Tokens <LocalFireDepartmentIcon sx={{ ml: 1, color: 'orange' }} />
          </Typography>
          
          <Grid container spacing={2}>
            {displayedHotTokens.slice(0, 12).map((token) => (
              <Grid key={token.token_address} xs={6} sm={3} md={2} lg={2}>
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
                  <CardMedia 
                    component="div"
                    sx={{
                      position: 'relative',
                      paddingTop: '100%', // 1:1 aspect ratio
                    }}
                  >
                    <Box 
                      component={Image}
                      src={token.token_image || '/images/logo.png'}
                      alt={token.token_name}
                      fill
                      sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </CardMedia>
                  <CardContent sx={{ flexGrow: 1, p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2" align="center" noWrap>
                      {token.token_name}
                    </Typography>
                    <Typography variant="caption" align="center" color="text.secondary" display="block">
                      {token.token_symbol}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                      <Tooltip title="Market Cap">
                        <Chip 
                          icon={<TrendingUpIcon fontSize="small" />}
                          label={formatMarketCap(token.marketCap)}
                          size="small"
                          variant="outlined"
                          sx={{ width: '100%' }}
                        />
                      </Tooltip>
                      
                      <Tooltip title="Token Price">
                        <Chip 
                          icon={<AttachMoneyIcon fontSize="small" />}
                          label={formatPrice(token.price)}
                          size="small"
                          variant="outlined"
                          sx={{ width: '100%' }}
                        />
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Recently Created Tokens Section */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography 
          variant="h4" 
          component="h2" 
          align="center" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            mb: 3
          }}
        >
          Recently Created Tokens
        </Typography>
        
        <Grid container spacing={2}>
          {displayedRecentTokens.slice(0, 32).map((token) => (
            <Grid key={token.token_address} xs={6} sm={3} md={2} lg={1.5}>
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
                <CardMedia 
                  component="div"
                  sx={{
                    position: 'relative',
                    paddingTop: '100%', // 1:1 aspect ratio
                  }}
                >
                  <Box 
                    component={Image}
                    src={token.token_image || '/images/logo.png'}
                    alt={token.token_name}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                </CardMedia>
                <CardContent sx={{ flexGrow: 1, p: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body2" align="center" noWrap>
                    {token.token_name}
                  </Typography>
                  <Typography variant="caption" align="center" color="text.secondary" display="block">
                    {token.token_symbol}
                  </Typography>
                  <Tooltip title="Market Cap">
                    <Chip 
                      icon={<TrendingUpIcon fontSize="small" />}
                      label={formatMarketCap(token.marketCap)}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 0.5, width: '100%' }}
                    />
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
