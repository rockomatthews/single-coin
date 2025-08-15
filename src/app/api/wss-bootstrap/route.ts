import { NextRequest, NextResponse } from 'next/server';
import { subscribePolygonWss } from '@/utils/wss-subscriptions';
import { POLYGON_UNISWAP_V3_ADDRESSES } from '@/utils/uniswap-v3-polygon';

let started = false;
let handle: { close: () => void } | null = null;

export async function GET(_req: NextRequest) {
  try {
    if (started) {
      return NextResponse.json({ started: true, message: 'WSS already running' });
    }

    const wssUrl = process.env.NEXT_PUBLIC_POLYGON_WSS_URL;
    const serviceWallet = process.env.NEXT_PUBLIC_SERVICE_WALLET_ADDRESS || process.env.NEXT_PUBLIC_SERVICE_PUBLIC_WALLET || process.env.NEXT_PUBLIC_POLYGON_FEE_RECIPIENT_ADDRESS;

    if (!wssUrl) {
      return NextResponse.json({ started: false, error: 'NEXT_PUBLIC_POLYGON_WSS_URL not configured' }, { status: 500 });
    }

    handle = subscribePolygonWss({
      wssUrl,
      addresses: {
        serviceWallet: serviceWallet || undefined,
        factory: POLYGON_UNISWAP_V3_ADDRESSES.Factory,
        positionManager: POLYGON_UNISWAP_V3_ADDRESSES.NonfungiblePositionManager,
      }
    }, async (evt) => {
      try {
        // Decode minimal: log types and leave heavy parsing to QuickNode Parsed Events webhooks
        if (evt.type === 'PoolCreated' || evt.type === 'Mint' || evt.type === 'IncreaseLiquidity') {
          console.log('WSS Event:', evt.type);
        }
        if (evt.type === 'serviceWalletIncoming') {
          console.log('Service wallet incoming MATIC:', evt.hash, evt.value);
        }
      } catch (e) {
        console.error('Error handling WSS event:', e);
      }
    });

    started = true;
    return NextResponse.json({ started: true, message: 'Polygon WSS listener started' });
  } catch (error: any) {
    return NextResponse.json({ started: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    handle?.close();
    started = false;
    return NextResponse.json({ stopped: true });
  } catch (error: any) {
    return NextResponse.json({ stopped: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
