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
  IconButton,
  Tooltip,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert the file to a base64 data URL which persists across page refreshes
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateTokenParams({ image: base64String });
      };
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Error reading the selected file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
    
    // Reset file input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle click on upload button
  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle removing the image
  const handleClearImage = () => {
    updateTokenParams({ image: 'https://via.placeholder.com/200?text=Token+Logo' });
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
        
        {/* Image Upload Section */}
        <Grid item xs={12}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Upload an image for your token (square PNG or JPG, 500x500px recommended)
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            
            {tokenParams.image && tokenParams.image !== 'https://via.placeholder.com/200?text=Token+Logo' ? (
              <Box
                sx={{
                  position: 'relative',
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #FFD700',
                }}
              >
                <img
                  src={tokenParams.image}
                  alt="Token Image"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    console.error('Failed to load image:', tokenParams.image);
                    // Reset to placeholder on error
                    updateTokenParams({ image: 'https://via.placeholder.com/200?text=Token+Logo' });
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully');
                  }}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    },
                  }}
                  size="small"
                  onClick={handleClearImage}
                >
                  <ClearIcon />
                </IconButton>
              </Box>
            ) : (
              <Box
                onClick={handleClickUpload}
                sx={{
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  border: '2px dashed rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#FFD700',
                    backgroundColor: 'rgba(255, 215, 0, 0.05)',
                  },
                }}
              >
                <Tooltip title="Upload Image">
                  <AddCircleOutlineIcon
                    sx={{
                      fontSize: 40,
                      color: '#FFD700',
                    }}
                  />
                </Tooltip>
              </Box>
            )}
          </Box>
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
              <MenuItem value={0}>0 - FungibleAsset (Best for meme coins, shows more metadata)</MenuItem>
              <MenuItem value={6}>6</MenuItem>
              <MenuItem value={9}>9 - Standard Fungible</MenuItem>
              <MenuItem value={12}>12</MenuItem>
            </Select>
            <FormHelperText>
              0 decimals = FungibleAsset with rich metadata display (description, links) in Phantom wallet. 9 decimals = standard fungible token with basic display.
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