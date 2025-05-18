'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Box, Button, Card, CardContent, CardMedia, Container, Grid, Typography } from '@mui/material';
import Link from 'next/link';
import { UserToken } from '@/utils/database';

export default function MyTokensPage() {
  const { connected, publicKey } = useWallet();
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserTokens();
    }
  }, [connected, publicKey]);

  const fetchUserTokens = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tokens?address=${publicKey.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTokens(data.tokens || []);
      } else {
        console.error('Error fetching tokens:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Tokens
        </Typography>
        <Box sx={{ textAlign: 'center', my: 8, py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Connect your wallet to view your tokens
          </Typography>
          <Box sx={{ mt: 3 }}>
            <WalletMultiButton />
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          My Tokens
        </Typography>
        <Button
          component={Link}
          href="/create-token"
          variant="contained"
          color="primary"
        >
          Create New Token
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading your tokens...</Typography>
        </Box>
      ) : tokens.length === 0 ? (
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" gutterBottom>
              You haven't created any tokens yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first Solana meme coin to see it displayed here
            </Typography>
            <Button
              component={Link}
              href="/create-token"
              variant="contained"
              color="primary"
            >
              Create Token
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {tokens.map((token) => (
            <Grid item xs={12} sm={6} md={4} key={token.token_address}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={token.token_image || 'https://placehold.co/400x400/orange/white?text=Token'}
                  alt={token.token_name}
                  sx={{ objectFit: 'contain', bgcolor: 'background.paper', p: 2 }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {token.token_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ${token.token_symbol}
                  </Typography>
                  <Typography variant="body2">
                    Supply: {Number(token.supply).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Decimals: {token.decimals}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      component={Link}
                      href={`/token/${token.token_address}`}
                      size="small"
                      variant="outlined"
                      fullWidth
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
} 