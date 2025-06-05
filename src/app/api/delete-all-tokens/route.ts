import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Force dynamic behavior
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    // Simple authentication - check for a secret key in the request
    const authHeader = request.headers.get('authorization');
    const secretKey = 'delete-tokens-2024'; // You can change this
    
    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'Database URL not configured' },
        { status: 500 }
      );
    }
    
    // Create database client
    const sql = neon(databaseUrl);
    
    console.log('Deleting all tokens from database...');
    
    // Delete all tokens from the database
    const result = await sql`
      DELETE FROM user_tokens
      RETURNING token_address, token_name, token_symbol
    `;
    
    console.log(`Deleted ${result.length} tokens`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.length} tokens`,
      deletedCount: result.length,
      deletedTokens: result.map(token => ({
        address: token.token_address,
        name: token.token_name,
        symbol: token.token_symbol
      }))
    });
    
  } catch (error) {
    console.error('Error deleting tokens:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete tokens', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 