import { NextRequest, NextResponse } from 'next/server';
import { updateTokenChainInfo } from '@/utils/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenAddress, poolAddress, poolTxId, chainSpecificData } = body || {};

    if (!tokenAddress) {
      return NextResponse.json({ success: false, error: 'tokenAddress is required' }, { status: 400 });
    }

    await updateTokenChainInfo(tokenAddress, { poolAddress, poolTxId, chainSpecificData });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
