'use client';

import { Box, Typography, Button, Paper, Link, Divider } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface TokenSuccessInstructionsProps {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
}

export default function TokenSuccessInstructions({ 
  tokenAddress, 
  tokenName, 
  tokenSymbol 
}: TokenSuccessInstructionsProps) {
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Your token has been created!
      </Typography>
      
      <Typography variant="body2" paragraph>
        If your token doesn't appear automatically in your wallet, you may need to add it manually:
      </Typography>
      
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="subtitle2">Token Address:</Typography>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: 'background.paper',
          p: 1.5,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexGrow: 1,
            }}
          >
            {tokenAddress}
          </Typography>
          <Button
            onClick={() => copyToClipboard(tokenAddress)}
            size="small"
            startIcon={<ContentCopyIcon />}
            sx={{ ml: 1 }}
          >
            Copy
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        How to add to Phantom Wallet:
      </Typography>
      
      <Box component="ol" sx={{ pl: 2 }}>
        <li>
          <Typography variant="body2">
            Open your Phantom wallet
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Click "Tokens" tab
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Click the "+" button at the bottom of your token list
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Paste the token address copied above
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Click "Add Token"
          </Typography>
        </li>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="body2">
        You can view your token on Solana Explorer:
      </Typography>
      
      <Button 
        variant="outlined" 
        size="small" 
        component={Link}
        href={`https://solscan.io/token/${tokenAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ mt: 1 }}
      >
        View on Solscan
      </Button>
    </Paper>
  );
} 