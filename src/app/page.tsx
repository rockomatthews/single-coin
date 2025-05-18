'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Grid container spacing={{ xs: 2, md: 6 }} sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 4, md: 6 } }}>
        <Grid xs={12} md={6} sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: { xs: 'center', md: 'flex-start' },
          textAlign: { xs: 'center', md: 'left' }
        }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ 
            color: 'primary.main', 
            fontWeight: 'bold',
            fontSize: { xs: '2.5rem', md: '3.75rem' }
          }}>
            Coinbull
          </Typography>
          <Typography variant="h5" component="h2" color="text.secondary" paragraph>
            Create verified Solana meme coins that show up with pictures, links, and descriptions.
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mt: 4,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button 
              component={Link}
              href="/create-token"
              variant="contained" 
              size="large"
              color="primary"
              fullWidth={false}
            >
              Create Token
            </Button>
            <Button 
              component={Link}
              href="/my-tokens"
              variant="outlined" 
              size="large"
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
          mt: { xs: 4, md: 0 }
        }}>
          <Box sx={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: { xs: '280px', sm: '400px' }, 
            height: { xs: '280px', sm: '400px' }
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
  );
}
