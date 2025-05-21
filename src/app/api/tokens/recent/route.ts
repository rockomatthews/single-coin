import { NextResponse } from 'next/server';
import { sql } from '@/utils/database';
import { getMultipleTokenPrices } from '@/utils/tokenPrices';

// Force dynamic behavior
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create tokens table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS user_tokens (
        id SERIAL PRIMARY KEY,
        user_address TEXT NOT NULL,
        token_address TEXT NOT NULL UNIQUE,
        token_name TEXT NOT NULL,
        token_symbol TEXT NOT NULL,
        token_image TEXT,
        decimals INTEGER NOT NULL,
        supply BIGINT NOT NULL,
        retained_amount BIGINT NOT NULL,
        liquidity_amount BIGINT NOT NULL,
        retention_percentage INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Fetch the most recent tokens
    const tokens = await sql`
      SELECT * FROM user_tokens 
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    // Extract token addresses for price lookup
    const tokenAddresses = tokens.map((token: any) => token.token_address);
    
    // Fetch real market data for all tokens in a single batch
    const priceData = await getMultipleTokenPrices(tokenAddresses);
    
    // Add market data to token information
    const tokensWithMarketData = tokens.map((token: any) => {
      // Get price data for this specific token
      const tokenPriceData = priceData[token.token_address] || { 
        price: 0, 
        marketCap: 0 
      };
      
      return {
        ...token,
        price: tokenPriceData.price,
        marketCap: tokenPriceData.marketCap
      };
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      tokens: tokensWithMarketData
    });
  } catch (error) {
    console.error('Error fetching recent tokens:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent tokens', details: (error as Error).message },
      { status: 500 }
    );
  }
} 