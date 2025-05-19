import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Force dynamic behavior for database initialization API
export const dynamic = 'force-dynamic';

// Initialize database by creating required tables if they don't exist
export async function GET() {
  try {
    // Get database URL from environment variables
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'DATABASE_URL environment variable is not set' },
        { status: 500 }
      );
    }
    
    // Create database client
    const sql = neon(databaseUrl);
    
    // SQL to create tables if they don't exist
    const createTableSQL = `
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
      );
    `;
    
    // Execute the SQL
    await sql(createTableSQL);
    
    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 