import { NextRequest, NextResponse } from 'next/server';
import { updateTokenChainInfo, getTokenByAddress } from '@/utils/database';

// QuickNode Stream/Webhook receiver
// Configure one or more Streams:
// 1) Wallet transfers: service wallet incoming MATIC
// 2) Contract events: Uniswap V3 Factory PoolCreated; NFPM Mint/IncreaseLiquidity
// Destination: this endpoint (public URL)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Streams may send arrays or single events; normalize
    const events = Array.isArray(body?.data) ? body.data : [body];

    for (const evt of events) {
      // Handle parsed contract events if you configure Parsed Contract Events with ABI at QuickNode
      if (evt.eventName === 'PoolCreated' && evt.parsed && evt.parsed.args) {
        const { token0, token1, fee, pool } = evt.parsed.args;
        const myToken = await matchOurToken(token0, token1);
        if (myToken) {
          await updateTokenChainInfo(myToken, {
            poolAddress: pool,
            chainSpecificData: { poolFee: fee, poolConfirmedBy: 'webhook' }
          });
        }
      }

      if (evt.eventName === 'IncreaseLiquidity' && evt.parsed && evt.parsed.args) {
        const { tokenId } = evt.parsed.args;
        // Optionally persist latest LP tx
        if (evt.transactionHash && evt.tokenAddress) {
          await updateTokenChainInfo(evt.tokenAddress, {
            poolTxId: evt.transactionHash,
            chainSpecificData: { lastIncreaseTokenId: tokenId, lpConfirmedBy: 'webhook' }
          });
        }
      }

      // Wallet transfers template: detect service wallet incoming MATIC
      if (evt.type === 'wallet_transfer' && evt.to && evt.value && evt.chainId === '0x89') {
        // If your payload includes metadata to correlate with a token, trigger the LP finalizer here.
        // Example: assume body includes tokenAddress and liquidityMaticAmount
        const tokenAddress = evt.tokenAddress || body.tokenAddress;
        const liquidityMaticAmount = evt.liquidityMaticAmount || body.liquidityMaticAmount;
        if (tokenAddress && liquidityMaticAmount) {
          await triggerLpFinalizer(tokenAddress, liquidityMaticAmount);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Webhook error:', e?.message || e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Helper: match token0/token1 to one of our tokens by address
async function matchOurToken(token0: string, token1: string): Promise<string | null> {
  // Minimal: if your app only creates new tokens, check in-memory cache or DB lookup
  // For simplicity, return token0 (assume it's ours) — replace with DB search
  try {
    const addr = token0 || token1;
    return addr || null;
  } catch {
    return null;
  }
}

async function triggerLpFinalizer(tokenAddress: string, liquidityMaticAmount: number) {
  try {
    // Call our own server route to run the QuickNode LP function
    const origin = process.env.NEXT_PUBLIC_BASE_URL || '';
    const resp = await fetch(`${origin}/api/trigger-lp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress, liquidityMaticAmount })
    });
    if (!resp.ok) {
      const t = await resp.text();
      console.error('trigger-lp failed:', t);
    }
  } catch (e) {
    console.error('Error triggering LP finalizer:', e);
  }
}
