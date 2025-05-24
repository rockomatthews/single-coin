import { NextRequest, NextResponse } from 'next/server';

/**
 * Shortcuts API endpoint for Phantom wallet integration
 * This endpoint provides curated action links for tokens created on Coinbull
 * Format follows Phantom's shortcuts specification v2
 */
export async function GET(request: NextRequest) {
  try {
    // Get token address from query params if provided
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get('token');
    
    // Base shortcuts available for all Coinbull tokens
    const shortcuts = [
      {
        label: "View on Coinbull",
        uri: tokenAddress 
          ? `https://coinbull.vercel.app/token/${tokenAddress}`
          : "https://coinbull.vercel.app",
        type: "fungible",
        icon: "view",
        prefersExternalTarget: false,
        preferredPresentation: "default",
        platform: "all"
      },
      {
        label: "Create Token",
        uri: "https://coinbull.vercel.app/create-token",
        type: "fungible", 
        icon: "mint",
        prefersExternalTarget: false,
        preferredPresentation: "default",
        platform: "all"
      },
      {
        label: "Join Discord",
        uri: "https://discord.gg/coinbull",
        type: "fungible",
        icon: "discord",
        prefersExternalTarget: true,
        preferredPresentation: "default",
        platform: "all"
      },
      {
        label: "Follow Twitter",
        uri: "https://twitter.com/coinbull",
        type: "fungible",
        icon: "twitter",
        prefersExternalTarget: true,
        preferredPresentation: "default",
        platform: "all"
      },
      {
        label: "Trade on DEX",
        uri: tokenAddress 
          ? `https://birdeye.so/token/${tokenAddress}?chain=solana`
          : "https://birdeye.so",
        type: "fungible",
        icon: "generic-link",
        prefersExternalTarget: true,
        preferredPresentation: "default",
        platform: "all"
      },
      {
        label: "View Analytics",
        uri: tokenAddress 
          ? `https://dexscreener.com/solana/${tokenAddress}`
          : "https://dexscreener.com/solana",
        type: "fungible",
        icon: "view",
        prefersExternalTarget: true,
        preferredPresentation: "default",
        platform: "all"
      }
    ];

    // Create shortcuts response following Phantom v2 specification
    const shortcutsResponse = {
      version: 2,
      shortcuts: shortcuts
    };

    // Return the shortcuts with proper CORS headers
    return NextResponse.json(shortcutsResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('Error generating shortcuts:', error);
    
    // Return minimal shortcuts on error
    return NextResponse.json({
      version: 2,
      shortcuts: [
        {
          label: "Visit Coinbull",
          uri: "https://coinbull.vercel.app",
          type: "fungible",
          icon: "generic-link",
          prefersExternalTarget: true
        }
      ]
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
} 