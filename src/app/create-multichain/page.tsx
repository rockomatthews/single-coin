"use client";

import React, { useState } from 'react';
import { Box, Container, Typography, Paper, Grid, Button, Stepper, Step, StepLabel, Alert, Checkbox, FormControlLabel, Table, TableBody, TableCell, TableHead, TableRow, Link as MuiLink, TextField } from '@mui/material';
import MultiChainTokenSettings from '@/components/token/MultiChainTokenSettings';
import { useMultiChainTokenCreation } from '@/hooks/useMultiChainTokenCreation';
import { UnifiedTokenParams } from '@/utils/blockchain-factory';
import { useOmniCreation, SupportedChain } from '@/hooks/useOmniCreation';

const defaultParams: UnifiedTokenParams = {
  blockchain: 'polygon',
  name: '',
  symbol: '',
  description: '',
  image: '',
  website: '',
  twitter: '',
  telegram: '',
  discord: '',
  retentionPercentage: 20,
  retainedAmount: undefined,
  liquidityAmount: undefined,
  // chain specific placeholders
  solana: { supply: 1000000000, decimals: 9 },
  polygon: { totalSupply: 1000000000, decimals: 18, createLiquidity: true, liquidityMaticAmount: 1 },
  base: { totalSupply: 1000000000, decimals: 18, createLiquidity: false, liquidityEthAmount: 0 },
  arbitrum: { totalSupply: 1000000000, decimals: 18, createLiquidity: false, liquidityEthAmount: 0 },
  tron: { totalSupply: 1000000000, decimals: 6, tokenStandard: 'TRC-20', createLiquidity: false, liquidityTrxAmount: 0 },
  bitcoin: { tick: 'TKN', max: 21000000, lim: 1000 },
  hyperliquid: { tokenStandard: 'HIP-1', szDecimals: 6, weiDecimals: 18, maxSupply: 1000000000, enableHyperliquidity: false }
};

const steps = ['Configure', 'Upload Metadata', 'Deploy', 'Liquidity', 'Done'];

export default function CreateMultiChainPage() {
  const [params, setParams] = useState<UnifiedTokenParams>(defaultParams);
  const { isCreating, error, progress, createToken, resetState } = useMultiChainTokenCreation();
  const omni = useOmniCreation();
  const [selectedChains, setSelectedChains] = useState<SupportedChain[]>(['polygon']);
  const [universalImagePreview, setUniversalImagePreview] = useState<string>(params.image || '');
  const isReady = (params.name?.trim()?.length || 0) > 0 && !!params.image;

  const updateTokenParams = (updates: Partial<UnifiedTokenParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
  };

  const onCreate = async () => {
    // Kick off the selected chain path; extended OMNICHAIN rollout can iterate chains
    await createToken(params);
  };

  const toggleChain = (chain: SupportedChain) => {
    setSelectedChains((prev) => prev.includes(chain) ? prev.filter(c => c !== chain) : [...prev, chain]);
  };

  const onRunOmni = async () => {
    await omni.run(selectedChains, params);
  };

  const handleUniversalImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUniversalImagePreview(result);
      updateTokenParams({ image: result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Create MultiChain Token (Omnichain)
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        One flow to configure and deploy tokens across multiple supported chains. Start with one chain, then repeat for others to complete your omnichain rollout.
      </Typography>

      {/* Universal Metadata (applies to all chains) */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Universal Metadata</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Token Name"
              value={params.name}
              onChange={(e) => updateTokenParams({ name: e.target.value })}
              placeholder="e.g., My Awesome Token"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Token Symbol"
              value={params.symbol}
              onChange={(e) => updateTokenParams({ symbol: e.target.value.toUpperCase() })}
              inputProps={{ maxLength: 10 }}
              placeholder="e.g., MAT"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Website"
              value={params.website}
              onChange={(e) => updateTokenParams({ website: e.target.value })}
              placeholder="https://yourproject.com"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Twitter"
              value={params.twitter}
              onChange={(e) => updateTokenParams({ twitter: e.target.value })}
              placeholder="https://twitter.com/yourproject"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telegram"
              value={params.telegram}
              onChange={(e) => updateTokenParams({ telegram: e.target.value })}
              placeholder="https://t.me/yourproject"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Discord"
              value={params.discord}
              onChange={(e) => updateTokenParams({ discord: e.target.value })}
              placeholder="https://discord.gg/yourproject"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="body2" gutterBottom>Token Image</Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="universal-image-upload"
                type="file"
                onChange={handleUniversalImageUpload}
              />
              <label htmlFor="universal-image-upload">
                <Box
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    minHeight: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  {universalImagePreview ? (
                    <img
                      src={universalImagePreview}
                      alt="Token preview"
                      style={{ maxWidth: '100%', maxHeight: 90, objectFit: 'contain' }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">Click to upload token image</Typography>
                  )}
                </Box>
              </label>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <MultiChainTokenSettings tokenParams={params} updateTokenParams={updateTokenParams} />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={Math.min(progress.step, steps.length - 1)} alternativeLabel>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">{progress.currentAction}</Typography>
        </Box>
      </Paper>

      {(!isReady) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please add a token name and upload an image to continue.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Omnichain Targets</Typography>
        <Grid container spacing={2}>
          {(['solana','polygon','base','bnb','arbitrum','tron','bitcoin','hyperliquid'] as SupportedChain[]).map(chain => (
            <Grid item key={chain} xs={6} sm={3} md={2}>
              <FormControlLabel
                control={<Checkbox checked={selectedChains.includes(chain)} onChange={() => toggleChain(chain)} />}
                label={chain}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid item>
          <Button variant="contained" color="primary" onClick={onCreate} disabled={isCreating || !isReady}>
            {isCreating ? 'Creating…' : 'Create on Selected Chain'}
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" color="secondary" onClick={resetState} disabled={isCreating}>
            Reset
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="success" onClick={onRunOmni} disabled={omni.isRunning || !isReady}>
            {omni.isRunning ? 'Deploying Omnichain…' : 'Deploy Omnichain (Parallel)'}
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          To go full Omnichain: select your target chains above, then deploy in parallel. We’ll consolidate results and links for you.
        </Alert>
      </Box>

      {omni.results.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>Omnichain Results</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Chain</TableCell>
                <TableCell>Token Address</TableCell>
                <TableCell>Explorer</TableCell>
                <TableCell>LP / Pool</TableCell>
                <TableCell>DexScreener</TableCell>
                <TableCell>Swap</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {omni.results.map(r => (
                <TableRow key={r.chain}>
                  <TableCell>{r.chain}</TableCell>
                  <TableCell>{r.tokenAddress || '-'}</TableCell>
                  <TableCell>
                    {r.explorerUrl ? (
                      <MuiLink href={r.explorerUrl} target="_blank" rel="noopener">View</MuiLink>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {r.poolAddress ? (
                      <Typography variant="caption">{r.poolAddress}</Typography>
                    ) : (r.poolTxId || '-')}
                  </TableCell>
                  <TableCell>
                    {r.dexscreenerUrl ? (
                      <MuiLink href={r.dexscreenerUrl} target="_blank" rel="noopener">DexScreener</MuiLink>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {r.swapUrl ? (
                      <MuiLink href={r.swapUrl} target="_blank" rel="noopener">Trade</MuiLink>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{r.success ? '✅' : `❌ ${r.error}`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}
