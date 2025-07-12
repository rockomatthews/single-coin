import { NextResponse } from 'next/server';
import { sql } from '@/utils/database';
import { getMultipleTokenPrices } from '@/utils/tokenPrices';

// Force dynamic behavior
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create tokens table if it doesn't exist with multi-chain support
    await sql`
      CREATE TABLE IF NOT EXISTS user_tokens (
        id SERIAL PRIMARY KEY,
        user_address TEXT NOT NULL,
        token_address TEXT NOT NULL UNIQUE,
        token_name TEXT NOT NULL,
        token_symbol TEXT NOT NULL,
        token_image TEXT,
        token_description TEXT,
        website TEXT,
        twitter TEXT,
        telegram TEXT,
        discord TEXT,
        metadata_uri TEXT,
        decimals INTEGER NOT NULL,
        supply BIGINT NOT NULL,
        retained_amount BIGINT NOT NULL,
        liquidity_amount BIGINT NOT NULL,
        retention_percentage INTEGER NOT NULL,
        blockchain VARCHAR(20) DEFAULT 'solana',
        network VARCHAR(20),
        chain_specific_data JSONB,
        token_standard VARCHAR(20),
        pool_tx_id TEXT,
        explorer_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add missing columns if they don't exist (migration)
    try {
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS blockchain VARCHAR(20) DEFAULT 'solana'`;
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS network VARCHAR(20)`;
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS chain_specific_data JSONB`;
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS token_standard VARCHAR(20)`;
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS pool_tx_id TEXT`;
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS explorer_url TEXT`;
    } catch (migrationError) {
      console.log('Migration already applied or columns exist');
    }
    
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