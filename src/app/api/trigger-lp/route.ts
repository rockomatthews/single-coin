import { NextRequest, NextResponse } from 'next/server';
import { getTokenByAddress, updateTokenChainInfo } from '@/utils/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenAddress, liquidityMaticAmount } = body || {};
    if (!tokenAddress) {
      return NextResponse.json({ success: false, error: 'tokenAddress is required' }, { status: 400 });
    }

    const QUICKNODE_API_KEY = process.env.NEXT_PUBLIC_QUICKNODE_API_KEY;
    const LP_FUNCTION_ID = process.env.QUICKNODE_LP_FUNCTION_ID; // set this to the QuickNode Function ID for LP_FINALIZER
    const SERVICE_PRIVATE_KEY = process.env.SERVICE_PRIVATE_KEY;
    const QUICKNODE_POLYGON_RPC_URL = process.env.QUICKNODE_POLYGON_RPC_URL;

    if (!QUICKNODE_API_KEY || !LP_FUNCTION_ID || !SERVICE_PRIVATE_KEY || !QUICKNODE_POLYGON_RPC_URL) {
      return NextResponse.json({ success: false, error: 'Missing env: QUICKNODE API/LP FUNCTION/SERVICE KEY/RPC' }, { status: 500 });
    }

    // Fetch token to infer pending LP amount if not provided
    const token = await getTokenByAddress(tokenAddress);
    let lpAmount = liquidityMaticAmount;
    if (!lpAmount && token && token.chain_specific_data) {
      // Try polygon.liquidityMaticAmount or pendingLp.liquidityMaticAmount
      lpAmount = token.chain_specific_data?.liquidityMaticAmount
        || token.chain_specific_data?.polygon?.liquidityMaticAmount
        || token.chain_specific_data?.pendingLp?.liquidityMaticAmount;
    }

    if (!lpAmount || Number(lpAmount) <= 0) {
      return NextResponse.json({ success: false, error: 'liquidityMaticAmount not provided or not found in DB' }, { status: 400 });
    }

    const url = `https://api.quicknode.com/functions/rest/v1/functions/${LP_FUNCTION_ID}/call`;
    const payload = {
      network: 'polygon-mainnet',
      user_data: {
        tokenAddress,
        liquidityMaticAmount: Number(lpAmount),
        servicePrivateKey: SERVICE_PRIVATE_KEY,
        rpcUrl: QUICKNODE_POLYGON_RPC_URL,
      }
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': QUICKNODE_API_KEY,
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ success: false, error: `QuickNode call failed: ${resp.status} ${text}` }, { status: 500 });
    }

    const full = await resp.json();
    const result = full.execution?.result || full;

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'LP finalizer failed' }, { status: 500 });
    }

    // Persist pool and tx
    await updateTokenChainInfo(tokenAddress, {
      poolAddress: result.poolAddress,
      poolTxId: result.txHash,
      chainSpecificData: { lpFinalizedAt: new Date().toISOString(), lpSource: 'quicknode-function' }
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown server error' }, { status: 500 });
  }
}
