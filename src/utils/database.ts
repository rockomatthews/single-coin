import { neon } from '@neondatabase/serverless';

// Connect to Neon database
export const sql = neon(process.env.DATABASE_URL!);

// User Token Interface - Extended for multi-chain support
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
  
  // Multi-chain extensions
  blockchain: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron';
  network?: string; // mainnet, testnet, devnet
  chain_specific_data?: any; // JSON field for chain-specific metadata
  token_standard?: string; // SPL, HIP-1, HIP-2
  pool_tx_id?: string; // Transaction ID of pool creation
  explorer_url?: string; // Direct link to token on explorer
}

// Multi-chain token data interface
export interface MultiChainTokenData {
  userAddress: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string;
  decimals: number;
  supply: number;
  retentionPercentage?: number;
  retainedAmount?: number;
  liquidityAmount?: number;
  tokenDescription?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  metadataUri?: string;
  
  // Multi-chain specific
  blockchain: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron';
  network?: string;
  chainSpecificData?: any;
  tokenStandard?: string;
  poolTxId?: string;
  explorerUrl?: string;
}

// Enhanced save function for multi-chain tokens
export async function saveMultiChainToken(tokenData: MultiChainTokenData): Promise<void> {
  try {
    const {
      userAddress, tokenAddress, tokenName, tokenSymbol, tokenImage,
      decimals, supply, retentionPercentage = 100, retainedAmount, liquidityAmount,
      tokenDescription, website, twitter, telegram, discord, metadataUri,
      blockchain, network, chainSpecificData, tokenStandard, poolTxId, explorerUrl
    } = tokenData;
    
    const actualRetainedAmount = retainedAmount || supply;
    const actualLiquidityAmount = liquidityAmount || 0;
    
    // Ensure enhanced table exists with multi-chain support
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

    // Safe migration: Add missing columns if they don't exist
    try {
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS blockchain VARCHAR(20) DEFAULT 'solana'`;
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS network VARCHAR(20)`;
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS chain_specific_data JSONB`;
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS token_standard VARCHAR(20)`;
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS pool_tx_id TEXT`;
      await sql`ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS explorer_url TEXT`;
    } catch (migrationError) {
      console.log('Migration already applied or columns exist:', migrationError);
    }

    // Insert with full multi-chain support
    await sql`
      INSERT INTO user_tokens (
        user_address, token_address, token_name, token_symbol, token_image,
        token_description, website, twitter, telegram, discord, metadata_uri,
        decimals, supply, retained_amount, liquidity_amount, retention_percentage,
        blockchain, network, chain_specific_data, token_standard, pool_tx_id, explorer_url
      ) VALUES (
        ${userAddress}, ${tokenAddress}, ${tokenName}, ${tokenSymbol}, ${tokenImage},
        ${tokenDescription}, ${website}, ${twitter}, ${telegram}, ${discord}, ${metadataUri},
        ${decimals}, ${supply}, ${actualRetainedAmount}, ${actualLiquidityAmount}, ${retentionPercentage},
        ${blockchain}, ${network}, ${JSON.stringify(chainSpecificData)}, ${tokenStandard}, ${poolTxId}, ${explorerUrl}
      )
    `;
    console.log(`Multi-chain token saved successfully: ${blockchain} - ${tokenAddress}`);
  } catch (error) {
    console.error('Error saving multi-chain token to database:', error);
    throw error;
  }
}

// Update pool info and/or chain_specific_data for a token by address
export async function updateTokenChainInfo(
  tokenAddress: string,
  updates: {
    poolAddress?: string;
    poolTxId?: string;
    chainSpecificData?: any;
  }
): Promise<void> {
  try {
    // Merge chain_specific_data JSONB and optionally set pool_tx_id
    const chainDataJson = JSON.stringify(updates.chainSpecificData || {});
    await sql`
      UPDATE user_tokens
      SET 
        chain_specific_data = COALESCE(chain_specific_data, '{}'::jsonb) || ${chainDataJson}::jsonb,
        pool_tx_id = COALESCE(${updates.poolTxId}, pool_tx_id)
      WHERE token_address = ${tokenAddress}
    `;
    // If a poolAddress is provided, also merge into chain_specific_data
    if (updates.poolAddress) {
      await sql`
        UPDATE user_tokens
        SET chain_specific_data = COALESCE(chain_specific_data, '{}'::jsonb) || ${JSON.stringify({ poolAddress: updates.poolAddress })}::jsonb
        WHERE token_address = ${tokenAddress}
      `;
    }
  } catch (error) {
    console.error('Error updating token chain info:', error);
    // non-fatal
  }
}

// Fetch tokens with a pending LP request (Polygon by default)
export async function getPendingLpTokens(blockchain: 'polygon' | 'base' | 'bnb' | 'arbitrum' | 'solana' | 'tron' | 'hyperliquid' | 'bitcoin' = 'polygon'): Promise<UserToken[]> {
  try {
    const tokens = await sql`
      SELECT * FROM user_tokens
      WHERE blockchain = ${blockchain}
        AND chain_specific_data ? 'pendingLp'
      ORDER BY created_at DESC
      LIMIT 20
    `;
    return tokens as unknown as UserToken[];
  } catch (error) {
    console.error('Error fetching pending LP tokens:', error);
    return [];
  }
}

// Legacy save function (for backward compatibility)
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
  metadataUri?: string,
  poolTxId?: string
): Promise<void> {
  // Convert to multi-chain format and save as Solana token
  await saveMultiChainToken({
    userAddress,
    tokenAddress,
    tokenName,
    tokenSymbol,
    tokenImage,
    decimals,
    supply,
    retentionPercentage,
    retainedAmount,
    liquidityAmount,
    tokenDescription,
    website,
    twitter,
    telegram,
    discord,
    metadataUri,
    blockchain: 'solana',
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
    tokenStandard: 'SPL',
    poolTxId,
    explorerUrl: `https://solscan.io/token/${tokenAddress}${process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' ? '?cluster=devnet' : ''}`,
  });
}

// Get tokens by user address (with optional blockchain filter)
export async function getTokensByUser(
  userAddress: string, 
  blockchain?: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron'
): Promise<UserToken[]> {
  try {
    const tokens = blockchain 
      ? await sql`
          SELECT * FROM user_tokens 
          WHERE user_address = ${userAddress} AND blockchain = ${blockchain}
          ORDER BY created_at DESC
        `
      : await sql`
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

// Multi-chain version of getTokensByUser (alias for consistency)
export async function getMultiChainTokensByUser(
  userAddress: string, 
  blockchain?: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron'
): Promise<UserToken[]> {
  return getTokensByUser(userAddress, blockchain);
}

// Get recent tokens across all chains (with optional blockchain filter)
export async function getRecentTokens(
  limit: number = 50,
  blockchain?: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron'
): Promise<UserToken[]> {
  try {
    const tokens = blockchain
      ? await sql`
          SELECT * FROM user_tokens 
          WHERE blockchain = ${blockchain}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT * FROM user_tokens 
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;
    return tokens as unknown as UserToken[];
  } catch (error) {
    console.error('Error fetching recent tokens from database:', error);
    return [];
  }
}

// Get tokens by blockchain and sort by market cap or other criteria
export async function getTokensByBlockchain(
  blockchain: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron',
  sortBy: 'created_at' | 'supply' | 'retention_percentage' = 'created_at',
  limit: number = 50
): Promise<UserToken[]> {
  try {
    const tokens = await sql`
      SELECT * FROM user_tokens 
      WHERE blockchain = ${blockchain}
      ORDER BY ${sql(sortBy)} DESC
      LIMIT ${limit}
    `;
    return tokens as unknown as UserToken[];
  } catch (error) {
    console.error('Error fetching tokens by blockchain:', error);
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

// Get blockchain statistics
export async function getBlockchainStats(): Promise<{
  total: number;
  byBlockchain: Record<string, number>;
  recentActivity: { blockchain: string; count: number; latest: Date }[];
}> {
  try {
    const totalResult = await sql`SELECT COUNT(*) as total FROM user_tokens`;
    const total = Number(totalResult[0]?.total || 0);
    
    const blockchainCounts = await sql`
      SELECT blockchain, COUNT(*) as count 
      FROM user_tokens 
      GROUP BY blockchain
    `;
    
    const recentActivity = await sql`
      SELECT blockchain, COUNT(*) as count, MAX(created_at) as latest
      FROM user_tokens 
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY blockchain
      ORDER BY count DESC
    `;
    
    const byBlockchain = blockchainCounts.reduce((acc: Record<string, number>, row: any) => {
      acc[row.blockchain] = Number(row.count);
      return acc;
    }, {});
    
    return {
      total,
      byBlockchain,
      recentActivity: recentActivity.map((row: any) => ({
        blockchain: row.blockchain,
        count: Number(row.count),
        latest: new Date(row.latest),
      })),
    };
  } catch (error) {
    console.error('Error fetching blockchain stats:', error);
    return { total: 0, byBlockchain: {}, recentActivity: [] };
  }
}

// Database migration function to add multi-chain columns to existing tables
export async function migrateToMultiChain(): Promise<void> {
  try {
    console.log('Starting multi-chain database migration...');
    
    // Add new columns if they don't exist
    await sql`
      ALTER TABLE user_tokens 
      ADD COLUMN IF NOT EXISTS blockchain VARCHAR(20) DEFAULT 'solana',
      ADD COLUMN IF NOT EXISTS network VARCHAR(20),
      ADD COLUMN IF NOT EXISTS chain_specific_data JSONB,
      ADD COLUMN IF NOT EXISTS token_standard VARCHAR(20),
      ADD COLUMN IF NOT EXISTS pool_tx_id TEXT,
      ADD COLUMN IF NOT EXISTS explorer_url TEXT,
      ADD COLUMN IF NOT EXISTS token_description TEXT,
      ADD COLUMN IF NOT EXISTS website TEXT,
      ADD COLUMN IF NOT EXISTS twitter TEXT,
      ADD COLUMN IF NOT EXISTS telegram TEXT,
      ADD COLUMN IF NOT EXISTS discord TEXT,
      ADD COLUMN IF NOT EXISTS metadata_uri TEXT
    `;
    
    // Update existing Solana tokens with proper metadata
    await sql`
      UPDATE user_tokens 
      SET 
        blockchain = 'solana',
        network = 'mainnet',
        token_standard = 'SPL',
        explorer_url = CONCAT('https://solscan.io/token/', token_address)
      WHERE blockchain IS NULL OR blockchain = ''
    `;
    
    console.log('Multi-chain database migration completed successfully');
  } catch (error) {
    console.error('Error during multi-chain migration:', error);
    throw error;
  }
} 