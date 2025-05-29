import { neon } from '@neondatabase/serverless';

// Connect to Neon database
export const sql = neon(process.env.DATABASE_URL!);

// User Token Interface
export interface UserToken {
  id: string;
  user_address: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  token_image: string;
  token_description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  metadata_uri?: string;
  decimals: number;
  supply: number;
  retained_amount: number;
  liquidity_amount: number;
  retention_percentage: number;
  created_at: Date;
}

// Save token to database with fallback for missing columns
export async function saveTokenToDatabase(
  userAddress: string,
  tokenAddress: string,
  tokenName: string,
  tokenSymbol: string,
  tokenImage: string,
  decimals: number,
  supply: number,
  retentionPercentage: number = 100,
  retainedAmount?: number,
  liquidityAmount?: number,
  tokenDescription?: string,
  website?: string,
  twitter?: string,
  telegram?: string,
  discord?: string,
  metadataUri?: string
): Promise<void> {
  try {
    const actualRetainedAmount = retainedAmount || supply;
    const actualLiquidityAmount = liquidityAmount || 0;
    
    // Ensure basic table exists
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

    // Try basic insert first (always works)
    await sql`
      INSERT INTO user_tokens (
        user_address, token_address, token_name, token_symbol, token_image,
        decimals, supply, retained_amount, liquidity_amount, retention_percentage
      ) VALUES (
        ${userAddress}, ${tokenAddress}, ${tokenName}, ${tokenSymbol}, ${tokenImage},
        ${decimals}, ${supply}, ${actualRetainedAmount}, ${actualLiquidityAmount}, ${retentionPercentage}
      )
    `;
    console.log('Token saved successfully');
  } catch (error) {
    console.error('Error saving token to database:', error);
    throw error;
  }
}

// Get tokens by user address
export async function getTokensByUser(userAddress: string): Promise<UserToken[]> {
  try {
    const tokens = await sql`
      SELECT * FROM user_tokens 
      WHERE user_address = ${userAddress}
      ORDER BY created_at DESC
    `;
    return tokens as unknown as UserToken[];
  } catch (error) {
    console.error('Error fetching tokens from database:', error);
    return [];
  }
}

// Get token by token address
export async function getTokenByAddress(tokenAddress: string): Promise<UserToken | null> {
  try {
    const tokens = await sql`
      SELECT * FROM user_tokens 
      WHERE token_address = ${tokenAddress}
      LIMIT 1
    `;
    
    return tokens.length > 0 ? tokens[0] as unknown as UserToken : null;
  } catch (error) {
    console.error('Error fetching token from database:', error);
    return null;
  }
} 