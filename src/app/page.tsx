'use client';

import { Box, Button, Container, Typography, Card, CardContent, CardMedia } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import Link from 'next/link';
import Image from 'next/image';

// Mock token data for demonstration
const mockTokens = Array(16).fill(null).map((_, i) => ({
  id: i,
  name: `Token ${i+1}`,
  symbol: `TKN${i+1}`,
  image: `/images/logo.png`,
}));

export default function Home() {
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
            🔥 Hot Tokens 🔥
          </Typography>
          
          <Grid container spacing={2}>
            {mockTokens.slice(0, 8).map(token => (
              <Grid key={token.id} xs={6} sm={4} md={3} lg={1.5}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia 
                    component="div"
                    sx={{
                      position: 'relative',
                      paddingTop: '100%', // 1:1 aspect ratio
                    }}
                  >
                    <Box 
                      component={Image}
                      src={token.image}
                      alt={token.name}
                      fill
                      sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </CardMedia>
                  <CardContent sx={{ flexGrow: 1, p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2" align="center" noWrap>
                      {token.name}
                    </Typography>
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
          {mockTokens.slice(8, 16).map(token => (
            <Grid key={token.id} xs={6} sm={4} md={3} lg={1.5}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia 
                  component="div"
                  sx={{
                    position: 'relative',
                    paddingTop: '100%', // 1:1 aspect ratio
                  }}
                >
                  <Box 
                    component={Image}
                    src={token.image}
                    alt={token.name}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                </CardMedia>
                <CardContent sx={{ flexGrow: 1, p: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body2" align="center" noWrap>
                    {token.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
