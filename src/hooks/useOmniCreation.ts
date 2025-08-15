"use client";

import { useState, useCallback } from 'react';
import { UnifiedTokenParams, getBlockchainProvider } from '@/utils/blockchain-factory';
import { saveMultiChainToken } from '@/utils/database';

export type SupportedChain = 'solana' | 'polygon' | 'base' | 'bnb' | 'arbitrum' | 'tron' | 'bitcoin' | 'hyperliquid';

export interface OmniChainRunResult {
  chain: SupportedChain;
  success: boolean;
  tokenAddress?: string;
  txHash?: string;
  poolTxId?: string;
  explorerUrl?: string;
  poolAddress?: string;
  message?: string;
  error?: string;
  dexscreenerUrl?: string;
  swapUrl?: string;
}

interface OmniState {
  isRunning: boolean;
  error: string | null;
  results: OmniChainRunResult[];
  progressText: string;
}

function explorerFor(chain: SupportedChain, tokenAddress?: string): string | undefined {
  if (!tokenAddress) return undefined;
  switch (chain) {
    case 'polygon': return `https://polygonscan.com/token/${tokenAddress}`;
    case 'base': return `https://basescan.org/token/${tokenAddress}`;
    case 'bnb': return `https://bscscan.com/token/${tokenAddress}`;
    case 'arbitrum': return `https://arbiscan.io/token/${tokenAddress}`;
    case 'solana': return `https://solscan.io/token/${tokenAddress}`;
    case 'tron': return undefined; // Tron scanners vary; provider returns
    case 'bitcoin': return undefined; // BRC-20 explorers vary
    case 'hyperliquid': return undefined;
  }
}

function dexScreenerFor(chain: SupportedChain, address?: string): string | undefined {
  if (!address) return undefined;
  switch (chain) {
    case 'polygon': return `https://dexscreener.com/polygon/${address}`;
    case 'base': return `https://dexscreener.com/base/${address}`;
    case 'bnb': return `https://dexscreener.com/bsc/${address}`;
    case 'arbitrum': return `https://dexscreener.com/arbitrum/${address}`;
    case 'solana': return `https://dexscreener.com/solana/${address}`;
    default: return undefined;
  }
}

function defaultSwapUrl(chain: SupportedChain, tokenAddress?: string): string | undefined {
  if (!tokenAddress) return undefined;
  switch (chain) {
    case 'polygon': return `https://quickswap.exchange/#/swap?outputCurrency=${tokenAddress}`;
    case 'base': return `https://app.uniswap.org/swap?outputCurrency=${tokenAddress}&chain=base`;
    case 'bnb': return `https://pancakeswap.finance/swap?outputCurrency=${tokenAddress}`;
    case 'arbitrum': return `https://app.uniswap.org/swap?outputCurrency=${tokenAddress}&chain=arbitrum`;
    case 'solana': return `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${tokenAddress}`;
    default: return undefined;
  }
}

export function useOmniCreation() {
  const [state, setState] = useState<OmniState>({ isRunning: false, error: null, results: [], progressText: '' });

  const run = useCallback(async (selectedChains: SupportedChain[], baseParams: UnifiedTokenParams) => {
    if (state.isRunning) return;
    setState(prev => ({ ...prev, isRunning: true, error: null, results: [], progressText: 'Starting omnichain deployment…' }));

    try {
      const omniBatchId = `omni-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      // Build per-chain params
      const jobs = selectedChains.map((chain) => {
        const chainParams: UnifiedTokenParams = { ...baseParams, blockchain: chain };
        // ensure name/symbol consistent
        chainParams.name = baseParams.name;
        chainParams.symbol = baseParams.symbol;
        return chainParams;
      });

      const results = await Promise.allSettled(jobs.map(async (params) => {
        const provider = getBlockchainProvider(params.blockchain);
        // upload metadata per chain
        const metadataUri = await provider.uploadMetadata(params);
        const createRes = await provider.createToken(params);
        if (!createRes.success) {
          throw new Error(createRes.error || 'Creation failed');
        }
        // save
        await saveMultiChainToken({
          userAddress: 'UNKNOWN_USER',
          tokenAddress: createRes.tokenAddress!,
          tokenName: params.name,
          tokenSymbol: params.symbol,
          tokenImage: params.image,
          tokenDescription: params.description,
          website: params.website,
          twitter: params.twitter,
          telegram: params.telegram,
          discord: params.discord,
          metadataUri,
          decimals: (params as any)[params.blockchain]?.decimals || (params.blockchain === 'solana' ? 9 : params.blockchain === 'tron' ? 6 : 18),
          supply: (params as any)[params.blockchain]?.totalSupply || (params as any)[params.blockchain]?.supply || (params as any)[params.blockchain]?.max || 0,
          retentionPercentage: params.retentionPercentage,
          retainedAmount: params.retainedAmount,
          liquidityAmount: params.liquidityAmount,
          blockchain: params.blockchain as SupportedChain,
          network: params.blockchain === 'solana' ? (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet') : 'mainnet',
          chainSpecificData: { ...(params as any)[params.blockchain], omniBatchId },
          tokenStandard: params.blockchain === 'solana' ? 'SPL' : params.blockchain === 'tron' ? 'TRC-20' : params.blockchain === 'bitcoin' ? 'BRC-20' : 'ERC-20',
          poolTxId: createRes.poolTxId,
          explorerUrl: createRes.explorer_url,
        });

        const chain = params.blockchain as SupportedChain;
        const tokenAddress = createRes.tokenAddress!;
        const explorerUrl = createRes.explorer_url || explorerFor(chain, tokenAddress);
        const poolAddress = (createRes as any).liquidityPool?.poolAddress;

        const res: OmniChainRunResult = {
          chain,
          success: true,
          tokenAddress,
          txHash: createRes.txHash,
          poolTxId: createRes.poolTxId,
          explorerUrl,
          poolAddress,
          message: createRes.message,
          dexscreenerUrl: dexScreenerFor(chain, poolAddress || tokenAddress),
          swapUrl: defaultSwapUrl(chain, tokenAddress),
        };
        return res;
      }));

      const normalized: OmniChainRunResult[] = results.map((r, idx) => {
        const chain = selectedChains[idx];
        if (r.status === 'fulfilled') return r.value;
        return { chain, success: false, error: r.reason instanceof Error ? r.reason.message : String(r.reason) };
      });

      setState({ isRunning: false, error: null, results: normalized, progressText: 'Completed.' });
      return normalized;
    } catch (e: any) {
      setState({ isRunning: false, error: e?.message || 'Omnichain deployment failed', results: [], progressText: 'Failed.' });
      return null;
    }
  }, [state.isRunning]);

  const reset = useCallback(() => setState({ isRunning: false, error: null, results: [], progressText: '' }), []);

  return { ...state, run, reset };
}
