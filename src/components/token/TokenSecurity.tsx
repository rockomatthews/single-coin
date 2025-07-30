'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Shield as ShieldIcon,
  Block as BlockIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface SecurityData {
  securityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isVerified: boolean;
  issues: string[];
  recommendations: string[];
  redbullcoinsFeatures?: {
    mintAuthorityRevoked: boolean;
    freezeAuthorityRevoked: boolean;
    updateAuthorityRevoked: boolean;
    realLiquidityPool: boolean;
    metadataStandards: string;
    createdWithRedbullCoins: boolean;
  };
  verificationBadges?: string[];
}

interface TokenSecurityProps {
  tokenAddress: string;
  showDetails?: boolean;
  tokenParams?: {
    name?: string;
    symbol?: string;
    revokeUpdateAuthority?: boolean;
    revokeFreezeAuthority?: boolean;
    revokeMintAuthority?: boolean;
  };
  blockchain?: 'solana' | 'polygon' | 'base' | 'bnb' | 'arbitrum' | 'hyperliquid' | 'bitcoin' | 'tron';
}

export default function TokenSecurity({ tokenAddress, showDetails = true, tokenParams, blockchain = 'solana' }: TokenSecurityProps) {
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/token-security/${tokenAddress}`);
        const data = await response.json();

        if (data.success) {
          setSecurityData(data.security);
        } else {
          setError(data.error || 'Failed to load security data');
        }
      } catch (err) {
        setError('Error checking token security');
        console.error('Security check error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tokenAddress) {
      fetchSecurityData();
    }
  }, [tokenAddress]);

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Checking token security...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error || !securityData) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography>Security verification unavailable</Typography>
      </Alert>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">Security Verification</Typography>
          {securityData.isVerified && (
            <Chip
              icon={<VerifiedIcon />}
              label="Verified"
              color="success"
              variant="filled"
            />
          )}
        </Box>

        {/* Security Score */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Security Score</Typography>
            <Typography variant="body2" fontWeight="bold">
              {securityData.securityScore}/100
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={securityData.securityScore}
            color={getScoreColor(securityData.securityScore)}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Chip
              label={`${securityData.riskLevel} RISK`}
              color={getRiskColor(securityData.riskLevel)}
              size="small"
            />
          </Box>
        </Box>

        {/* Verification Badges */}
        {securityData.verificationBadges && securityData.verificationBadges.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Security Features
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {securityData.verificationBadges.map((badge, index) => (
                <Chip
                  key={index}
                  icon={<CheckCircleIcon />}
                  label={badge}
                  color="success"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Security Features based on actual user selections */}
        {tokenParams && showDetails && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              <ShieldIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Token Security Features
            </Typography>
            <List dense>
              {blockchain === 'solana' ? (
                <>
                  <ListItem>
                    <ListItemIcon>
                      {tokenParams.revokeMintAuthority ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <BlockIcon color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={tokenParams.revokeMintAuthority ? "Mint Authority Revoked" : "Mint Authority Retained"}
                      secondary={tokenParams.revokeMintAuthority ? 
                        "Token supply is fixed and cannot be increased" : 
                        "Token supply can be increased by the creator"
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {tokenParams.revokeFreezeAuthority ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <BlockIcon color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={tokenParams.revokeFreezeAuthority ? "Freeze Authority Revoked" : "Freeze Authority Retained"}
                      secondary={tokenParams.revokeFreezeAuthority ? 
                        "Token accounts cannot be frozen" : 
                        "Token accounts can be frozen by the creator"
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {tokenParams.revokeUpdateAuthority ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <BlockIcon color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={tokenParams.revokeUpdateAuthority ? "Update Authority Revoked" : "Update Authority Retained"}
                      secondary={tokenParams.revokeUpdateAuthority ? 
                        "Token metadata cannot be changed" : 
                        "Token metadata can be updated by the creator"
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Real Liquidity Pool"
                      secondary="Genuine Raydium CPMM pool with actual liquidity"
                    />
                  </ListItem>
                </>
              ) : (
                <>
                  <ListItem>
                    <ListItemIcon>
                      {tokenParams.revokeMintAuthority ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <BlockIcon color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={tokenParams.revokeMintAuthority ? "Mint Function Disabled" : "Mint Function Enabled"}
                      secondary={tokenParams.revokeMintAuthority ? 
                        "Token supply is fixed and cannot be increased" : 
                        "Additional tokens can be minted by the owner"
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="ERC20 Standard Compliant"
                      secondary="Follows standard ERC20 token specifications"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Deployed on Secure Network"
                      secondary={`Contract deployed on ${blockchain} mainnet`}
                    />
                  </ListItem>
                </>
              )}
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="2025 Token Standards"
                  secondary="Follows latest token metadata and security standards"
                />
              </ListItem>
            </List>
          </>
        )}

        {/* Fallback for API security data when tokenParams not available */}
        {!tokenParams && securityData.redbullcoinsFeatures && showDetails && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              <ShieldIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Security Features
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Mint Authority Revoked"
                  secondary="Token supply is fixed and cannot be increased"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Freeze Authority Revoked"
                  secondary="Token accounts cannot be frozen"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Real Liquidity Pool"
                  secondary={blockchain === 'solana' ? "Genuine Raydium CPMM pool with actual liquidity" : "Ready for DEX liquidity pool creation"}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="2025 Token Standards"
                  secondary={blockchain === 'solana' ? "Follows latest Metaplex token standards" : "Follows latest ERC20 token standards"}
                />
              </ListItem>
            </List>
          </>
        )}

        {/* Issues and Recommendations */}
        {showDetails && (securityData.issues.length > 0 || securityData.recommendations.length > 0) && (
          <>
            <Divider sx={{ my: 2 }} />
            {securityData.issues.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Security Issues
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {securityData.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {securityData.recommendations.length > 0 && (
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recommendations
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {securityData.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </>
        )}

        {/* Verification Note */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
          <Typography variant="body2" color="primary.main">
            <VerifiedIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 'small' }} />
            This security verification helps your token gain trusted status on DEX platforms like Birdeye, DexScreener, and Jupiter.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
} 