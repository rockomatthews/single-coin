// API route to securely call QuickNode Functions with server-side secrets
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenName, tokenSymbol, totalSupply, userAddress, revokeUpdateAuthority, revokeMintAuthority } = body;

    // Validate required parameters
    if (!tokenName || !tokenSymbol || !totalSupply || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get server-side environment variables
    const QUICKNODE_API_KEY = process.env.NEXT_PUBLIC_QUICKNODE_API_KEY;
    const SERVICE_PRIVATE_KEY = process.env.SERVICE_PRIVATE_KEY;
    const QUICKNODE_POLYGON_RPC_URL = process.env.QUICKNODE_POLYGON_RPC_URL;

    console.log('🔍 Environment check:', {
      hasApiKey: !!QUICKNODE_API_KEY,
      hasPrivateKey: !!SERVICE_PRIVATE_KEY,
      hasRpcUrl: !!QUICKNODE_POLYGON_RPC_URL
    });

    if (!QUICKNODE_API_KEY) {
      return NextResponse.json(
        { error: 'QuickNode API key not configured' },
        { status: 500 }
      );
    }

    if (!SERVICE_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Service private key not configured' },
        { status: 500 }
      );
    }

    if (!QUICKNODE_POLYGON_RPC_URL) {
      return NextResponse.json(
        { error: 'QuickNode Polygon RPC URL not configured' },
        { status: 500 }
      );
    }

    // QuickNode Function configuration
    const QUICKNODE_FUNCTION_ID = '6e7e0949-40ec-4fe2-be32-46419dfe246c';
    const QUICKNODE_FUNCTION_URL = `https://api.quicknode.com/functions/rest/v1/functions/${QUICKNODE_FUNCTION_ID}/call`;

    // Prepare payload for QuickNode Function
    const functionPayload = {
      tokenName,
      tokenSymbol,
      totalSupply: totalSupply.toString(),
      userAddress,
      revokeUpdateAuthority: revokeUpdateAuthority || false,
      revokeMintAuthority: revokeMintAuthority || false,
      servicePrivateKey: SERVICE_PRIVATE_KEY,
      rpcUrl: QUICKNODE_POLYGON_RPC_URL
    };

    console.log('🚀 Server-side QuickNode API call starting...');

    // Call QuickNode Function API
    const response = await fetch(QUICKNODE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': QUICKNODE_API_KEY,
      },
      body: JSON.stringify({
        network: 'polygon-mainnet',
        user_data: functionPayload
      })
    });

    console.log('📡 QuickNode response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ QuickNode error response:', errorText);
      return NextResponse.json(
        { error: `QuickNode API call failed: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const fullResponse = await response.json();
    console.log('📡 Full QuickNode Function response:', fullResponse);

    // Extract the actual function result
    let result;
    if (fullResponse.execution && fullResponse.execution.result) {
      result = fullResponse.execution.result;
    } else {
      result = fullResponse;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown server error' },
      { status: 500 }
    );
  }
}