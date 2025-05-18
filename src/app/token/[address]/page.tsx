'use client';

import { useEffect, useState } from 'react';
import { 
  Avatar, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
  Container, 
  Divider, 
  Grid, 
  Link as MuiLink, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableRow, 
  Typography 
} from '@mui/material';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Connection, PublicKey } from '@solana/web3.js';
import { UserToken } from '@/utils/database';

export default function TokenDetailPage() {
  const params = useParams();
  const [token, setToken] = useState<UserToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (!params.address) return;

      try {
        // Fetch token details from our database
        const response = await fetch(`/api/tokens/${params.address}`);
        const data = await response.json();

        if (data.success) {
          setToken(data.token);
        } else {
          setError(data.error || 'Failed to load token details');
        }
      } catch (err) {
        setError('An error occurred while fetching token details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenDetails();
  }, [params.address]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography>Loading token details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !token) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error || 'Token not found'}
          </Typography>
          <Typography paragraph>
            The token you are looking for could not be found or is not available.
          </Typography>
          <Button 
            component={Link} 
            href="/my-tokens" 
            variant="contained"
            sx={{ mt: 2 }}
          >
            Back to My Tokens
          </Button>
        </Paper>
      </Container>
    );
  }

  const tokenAddress = params.address as string;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Button 
          component={Link} 
          href="/my-tokens" 
          variant="outlined" 
          sx={{ mb: 2 }}
        >
          ← Back to My Tokens
        </Button>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Avatar 
                  src={token.token_image || 'https://placehold.co/400x400/orange/white?text=Token'} 
                  alt={token.token_name}
                  sx={{ width: 120, height: 120 }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {token.token_name}
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  ${token.token_symbol}
                </Typography>
                <Chip 
                  label="Verified" 
                  color="success" 
                  size="small" 
                  sx={{ mb: 2 }} 
                />
                <Typography variant="body2" paragraph>
                  Created on {new Date(token.created_at).toLocaleString()}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    component={MuiLink}
                    href={`https://explorer.solana.com/address/${tokenAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mr: 2 }}
                  >
                    View on Solana Explorer
                  </Button>
                  <Button
                    variant="outlined"
                    component={MuiLink}
                    href={`https://solscan.io/token/${tokenAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Solscan
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Typography variant="h5" component="h2" gutterBottom>
          Token Details
        </Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ width: '30%', fontWeight: 'bold' }}>
                  Token Address
                </TableCell>
                <TableCell>
                  <Box sx={{ 
                    fontFamily: 'monospace', 
                    wordBreak: 'break-all', 
                    bgcolor: 'background.paper', 
                    p: 1, 
                    borderRadius: 1 
                  }}>
                    {tokenAddress}
                  </Box>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  Total Supply
                </TableCell>
                <TableCell>{Number(token.supply).toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  Tokens Kept
                </TableCell>
                <TableCell>{Number(token.retained_amount).toLocaleString()} ({token.retention_percentage}%)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  Tokens in Liquidity
                </TableCell>
                <TableCell>{Number(token.liquidity_amount).toLocaleString()} ({100 - token.retention_percentage}%)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  Decimals
                </TableCell>
                <TableCell>{token.decimals}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  Owner
                </TableCell>
                <TableCell>
                  <Box sx={{ 
                    fontFamily: 'monospace', 
                    wordBreak: 'break-all', 
                    bgcolor: 'background.paper', 
                    p: 1, 
                    borderRadius: 1 
                  }}>
                    {token.user_address}
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Next Steps
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Create Liquidity Pool
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Add liquidity to make your token tradable on decentralized exchanges.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    component={MuiLink}
                    href="https://raydium.io/liquidity/create/"
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                  >
                    Go to Raydium
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Create Token Website
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Build a landing page for your meme coin to share with the community.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    component={MuiLink}
                    href="https://coinfactory.app/en/token-page"
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                  >
                    Create Token Page
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
} 