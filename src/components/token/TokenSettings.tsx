'use client';

import React, { useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Grid,
  SelectChangeEvent,
} from '@mui/material';

interface TokenSettingsProps {
  tokenParams: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    decimals: number;
    supply: number;
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  updateTokenParams: (params: Partial<TokenSettingsProps['tokenParams']>) => void;
}

export default function TokenSettings({
  tokenParams,
  updateTokenParams,
}: TokenSettingsProps) {
  // Handle text field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name) {
      updateTokenParams({ [name]: value });
    }
  };
  
  // Handle select field changes
  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    const { name, value } = e.target;
    if (name) {
      updateTokenParams({ [name]: value });
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Basic Token Information
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Token Name"
            name="name"
            value={tokenParams.name}
            onChange={handleChange}
            helperText="The full name of your token (e.g., 'Coinbull')"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Token Symbol"
            name="symbol"
            value={tokenParams.symbol}
            onChange={handleChange}
            helperText="The ticker symbol (e.g., 'BULL')"
            inputProps={{ maxLength: 10 }}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={tokenParams.description}
            onChange={handleChange}
            multiline
            rows={3}
            helperText="A brief description of your token and its purpose"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="decimals-label">Decimals</InputLabel>
            <Select
              labelId="decimals-label"
              name="decimals"
              value={tokenParams.decimals}
              label="Decimals"
              onChange={handleSelectChange}
            >
              <MenuItem value={0}>0</MenuItem>
              <MenuItem value={6}>6</MenuItem>
              <MenuItem value={9}>9</MenuItem>
              <MenuItem value={12}>12</MenuItem>
            </Select>
            <FormHelperText>
              Number of decimal places (9 is standard for most tokens)
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Initial Supply"
            name="supply"
            type="number"
            value={tokenParams.supply}
            onChange={handleChange}
            helperText="Total number of tokens to create"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Website"
            name="website"
            value={tokenParams.website}
            onChange={handleChange}
            placeholder="https://example.com"
            helperText="Optional: Your token's website"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Twitter"
            name="twitter"
            value={tokenParams.twitter}
            onChange={handleChange}
            placeholder="https://twitter.com/youraccount"
            helperText="Optional: Your token's Twitter account"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Telegram"
            name="telegram"
            value={tokenParams.telegram}
            onChange={handleChange}
            placeholder="https://t.me/yourgroupname"
            helperText="Optional: Your token's Telegram group"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Discord"
            name="discord"
            value={tokenParams.discord}
            onChange={handleChange}
            placeholder="https://discord.gg/yourserver"
            helperText="Optional: Your token's Discord server"
          />
        </Grid>
      </Grid>
    </Box>
  );
} 