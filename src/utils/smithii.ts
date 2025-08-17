export type SmithiiChain = 'polygon' | 'base' | 'bnb' | 'arbitrum';

export interface SmithiiDeployResponse {
  success: boolean;
  tokenAddress?: string;
  txHash?: string;
  explorerUrl?: string;
  poolTxId?: string | null;
  error?: string;
}

export interface SmithiiDeployPayload {
  chain: SmithiiChain;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  totalSupply?: number;
  decimals?: number;
  createLiquidity?: boolean;
  liquidityNativeAmount?: number; // e.g., MATIC/ETH/BNB
  retentionPercentage?: number;
  // extra fields pass-through
  [key: string]: unknown;
}

export async function deployEvmTokenViaSmithii(payload: SmithiiDeployPayload): Promise<SmithiiDeployResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_SMITHII_API_URL || process.env.SMITHII_API_URL;
  const apiKey = process.env.NEXT_PUBLIC_SMITHII_API_KEY || process.env.SMITHII_API_KEY;

  if (!apiUrl || !apiKey) {
    return { success: false, error: 'Smithii API not configured. Set NEXT_PUBLIC_SMITHII_API_URL and NEXT_PUBLIC_SMITHII_API_KEY.' };
  }

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      return { success: false, error: `Smithii error ${res.status}: ${err}` };
    }

    const data = (await res.json()) as Partial<SmithiiDeployResponse>;
    return {
      success: Boolean(data.success),
      tokenAddress: data.tokenAddress,
      txHash: data.txHash,
      explorerUrl: data.explorerUrl,
      poolTxId: data.poolTxId ?? undefined,
      error: data.error,
    };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error calling Smithii API' };
  }
}
