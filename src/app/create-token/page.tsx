'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Alert,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import TokenDistributionSlider from '@/components/TokenDistributionSlider';
import { useTokenCreation } from '@/hooks/useTokenCreation';
import { calculateFee } from '@/utils/solana';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';

// Token creation steps
const steps = ['Token Details', 'Customize', 'Distribution', 'Review & Create'];

export default function CreateTokenPage() {
  const { connected } = useWallet();
  const { isCreating, error, success, createToken } = useTokenCreation();
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [tokenData, setTokenData] = useState({
    name: '',
    symbol: '',
    description: '',
    decimals: 9,
    supply: 1000000000,
    image: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    retentionPercentage: 50, // Default to 50% retention
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = useCallback(() => {
    // Validate current step
    const newErrors: Record<string, string> = {};
    
    if (activeStep === 0) {
      if (!tokenData.name) newErrors.name = 'Token name is required';
      if (!tokenData.symbol) newErrors.symbol = 'Token symbol is required';
      if (tokenData.symbol.length > 10) newErrors.symbol = 'Symbol must be 10 characters or less';
      if (!tokenData.supply || tokenData.supply <= 0) newErrors.supply = 'Supply must be greater than 0';
    } else if (activeStep === 1) {
      if (!tokenData.image) newErrors.image = 'Token image is required for verification';
    }
    
    setErrors(newErrors);
    
    // If no errors, proceed to next step
    if (Object.keys(newErrors).length === 0) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  }, [activeStep, tokenData]);

  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => prevStep - 1);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setTokenData((prev) => ({ ...prev, [name]: value }));
      
      // Clear error when field is updated
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  }, [errors]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear any previous errors
      if (errors.image) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.image;
          return newErrors;
        });
      }
      
      // Create a URL for the selected file
      const imageUrl = URL.createObjectURL(file);
      setTokenData((prev) => ({ ...prev, image: imageUrl }));
    }
    
    // Reset file input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [errors]);

  const handleClickUpload = useCallback(() => {
    // Trigger file input click programmatically
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleClearImage = useCallback(() => {
    setTokenData((prev) => ({ ...prev, image: '' }));
  }, []);

  const handleRetentionChange = useCallback((value: number) => {
    setTokenData((prev) => ({ ...prev, retentionPercentage: value }));
  }, []);

  const handleCreateToken = useCallback(async () => {
    // Calculate token amounts based on retention percentage
    const retainedTokens = Math.floor(tokenData.supply * (tokenData.retentionPercentage / 100));
    const liquidityTokens = tokenData.supply - retainedTokens;

    try {
      await createToken({
        ...tokenData,
        retainedAmount: retainedTokens,
        liquidityAmount: liquidityTokens
      });
      
      // The success state is handled by the useTokenCreation hook
      // If successful, it will be set to true and we'll show the success UI
    } catch (error) {
      console.error('Error in token creation:', error);
    }
  }, [tokenData, createToken]);

  const renderStepContent = useCallback(() => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Basic Token Information
            </Typography>
            <Grid container spacing={3}>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Token Name"
                  name="name"
                  value={tokenData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name || 'The full name of your token (e.g., "Coinbull")'}
                  required
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Token Symbol"
                  name="symbol"
                  value={tokenData.symbol}
                  onChange={handleChange}
                  error={!!errors.symbol}
                  helperText={errors.symbol || 'The ticker symbol (e.g., "BULL")'}
                  inputProps={{ maxLength: 10 }}
                  required
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={tokenData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  helperText="A brief description of your token and its purpose"
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="decimals-label">Decimals</InputLabel>
                  <Select
                    labelId="decimals-label"
                    name="decimals"
                    value={tokenData.decimals}
                    label="Decimals"
                    onChange={handleChange}
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
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Initial Supply"
                  name="supply"
                  type="number"
                  value={tokenData.supply}
                  onChange={handleChange}
                  error={!!errors.supply}
                  helperText={errors.supply || 'Total number of tokens to create'}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Token Customization
            </Typography>
            <Grid container spacing={3}>
              <Grid xs={12}>
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
                  
                  {tokenData.image ? (
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
                        src={tokenData.image}
                        alt="Token Image"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
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
                        border: errors.image 
                          ? '2px dashed #CC0000' 
                          : '2px dashed rgba(255, 255, 255, 0.5)',
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
                            color: errors.image ? '#CC0000' : '#FFD700',
                          }}
                        />
                      </Tooltip>
                    </Box>
                  )}
                  
                  {errors.image && (
                    <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                      {errors.image}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Social Links (Optional)
                </Typography>
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={tokenData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">🌐</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Twitter"
                  name="twitter"
                  value={tokenData.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/youraccount"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">𝕏</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telegram"
                  name="telegram"
                  value={tokenData.telegram}
                  onChange={handleChange}
                  placeholder="https://t.me/yourgroupname"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">📱</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Discord"
                  name="discord"
                  value={tokenData.discord}
                  onChange={handleChange}
                  placeholder="https://discord.gg/yourserver"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">🎮</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Token Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Decide how many tokens you want to keep and how many should be sent to liquidity pools.
              Keeping a higher percentage will increase the creation fee.
            </Typography>
            
            <TokenDistributionSlider 
              totalSupply={tokenData.supply}
              value={tokenData.retentionPercentage}
              onChange={handleRetentionChange}
            />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              The remaining {100 - tokenData.retentionPercentage}% of tokens will be used to create 
              liquidity pools on decentralized exchanges like Birdeye and Raydium, making your token tradable.
            </Alert>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review and Confirm
            </Typography>
            <Stack spacing={2}>
              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid xs={12} sm={6}>
                      <Typography variant="subtitle2">Token Name</Typography>
                      <Typography variant="body1">{tokenData.name}</Typography>
                    </Grid>
                    <Grid xs={12} sm={6}>
                      <Typography variant="subtitle2">Token Symbol</Typography>
                      <Typography variant="body1">{tokenData.symbol}</Typography>
                    </Grid>
                    <Grid xs={12} sm={6}>
                      <Typography variant="subtitle2">Decimals</Typography>
                      <Typography variant="body1">{tokenData.decimals}</Typography>
                    </Grid>
                    <Grid xs={12} sm={6}>
                      <Typography variant="subtitle2">Initial Supply</Typography>
                      <Typography variant="body1">{tokenData.supply.toLocaleString()}</Typography>
                    </Grid>
                    <Grid xs={12}>
                      <Typography variant="subtitle2">Description</Typography>
                      <Typography variant="body1">{tokenData.description || "No description provided"}</Typography>
                    </Grid>
                    {tokenData.image && (
                      <Grid xs={12}>
                        <Typography variant="subtitle2">Image</Typography>
                        <Box sx={{ mt: 1, maxWidth: 150, maxHeight: 150, overflow: 'hidden', borderRadius: 2 }}>
                          <img
                            src={tokenData.image}
                            alt={`${tokenData.name} token`}
                            style={{ width: '100%', height: 'auto' }}
                            onError={(e) => {
                              // Handle image loading errors
                              e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23cccccc"/><text x="50%" y="50%" font-size="18" text-anchor="middle" alignment-baseline="middle" font-family="Arial, sans-serif" fill="%23ffffff">Image Error</text></svg>';
                            }}
                          />
                        </Box>
                      </Grid>
                    )}
                    <Grid xs={12}>
                      <Typography variant="subtitle2">Token Distribution</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">You keep:</Typography>
                        <Typography variant="body2">
                          {Math.floor(tokenData.supply * (tokenData.retentionPercentage / 100)).toLocaleString()} ({tokenData.retentionPercentage}%)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">To liquidity pools:</Typography>
                        <Typography variant="body2">
                          {Math.floor(tokenData.supply * ((100 - tokenData.retentionPercentage) / 100)).toLocaleString()} ({100 - tokenData.retentionPercentage}%)
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              <Typography variant="body2" color="text.secondary">
                You will need to approve a transaction to create this token. Make sure all the details are correct before proceeding.
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  Transaction Fee: ~{calculateFee(tokenData.retentionPercentage)} SOL
                </Typography>
                {tokenData.retentionPercentage > 75 && (
                  <Typography variant="caption" color="warning.main">
                    High retention percentage increases your fee significantly.
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        );
      case 4:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h5" color="primary" gutterBottom>
              Token Successfully Created!
            </Typography>
            <Typography variant="body1" paragraph>
              Your {tokenData.name} ({tokenData.symbol}) token has been created and {tokenData.retentionPercentage}% of tokens ({Math.floor(tokenData.supply * (tokenData.retentionPercentage / 100)).toLocaleString()}) 
              have been sent to your wallet.
            </Typography>
            <Typography variant="body1" paragraph>
              The remaining {100 - tokenData.retentionPercentage}% ({Math.floor(tokenData.supply * ((100 - tokenData.retentionPercentage) / 100)).toLocaleString()}) tokens
              have been allocated for liquidity on DEXes.
            </Typography>
            <Button
              variant="contained"
              href="/my-tokens"
              sx={{ mt: 2 }}
            >
              View My Tokens
            </Button>
          </Box>
        );
      default:
        return null;
    }
  }, [activeStep, tokenData, errors, handleChange, handleClickUpload, handleClearImage, handleRetentionChange, calculateFee]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Meme Coin
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Create your own verified Solana meme coin that displays correctly in wallets with your custom image and metadata.
      </Typography>
      
      {!connected ? (
        <Box sx={{ textAlign: 'center', my: 8, py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Connect your wallet to get started
          </Typography>
          <Box sx={{ mt: 3 }}>
            <WalletMultiButton />
          </Box>
        </Box>
      ) : (
        <>
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            sx={{ pt: 3, pb: 5 }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Card>
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              {success ? renderStepContent() : (
                <>
                  {renderStepContent()}
                  
                  {activeStep < steps.length && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      {activeStep > 0 && (
                        <Button 
                          onClick={handleBack} 
                          sx={{ mr: 1 }}
                          disabled={isCreating}
                        >
                          Back
                        </Button>
                      )}
                      
                      {activeStep === steps.length - 1 ? (
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={handleCreateToken}
                          disabled={isCreating}
                        >
                          {isCreating ? 'Creating...' : 'Create Token'}
                        </Button>
                      ) : (
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={handleNext}
                        >
                          Next
                        </Button>
                      )}
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  );
} 