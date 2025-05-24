import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/utils/database';

/**
 * API endpoint to delete all tokens from the database
 * This is useful for clearing trial/test data
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('Starting to delete all tokens...');
    
    // Get count of tokens before deletion
    const countResult = await sql`
      SELECT COUNT(*) as count FROM user_tokens
    `;
    
    const tokenCount = countResult?.[0]?.count || 0;
    
    if (tokenCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tokens found to delete',
        deleted: 0
      });
    }
    
    console.log(`Found ${tokenCount} tokens to delete`);
    
    // Delete all tokens from the database
    await sql`
      DELETE FROM user_tokens
    `;
    
    // Reset the auto-increment counter (optional)
    await sql`
      ALTER SEQUENCE user_tokens_id_seq RESTART WITH 1
    `;
    
    console.log('All tokens deleted successfully');
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${tokenCount} tokens from database`,
      deleted: tokenCount
    });
    
  } catch (error) {
    console.error('Error deleting tokens:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete tokens', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check how many tokens exist
export async function GET() {
  try {
    const countResult = await sql`
      SELECT COUNT(*) as count FROM user_tokens
    `;
    
    const count = countResult?.[0]?.count || 0;
    
    return NextResponse.json({
      success: true,
      totalTokens: count,
      message: count > 0 
        ? `Found ${count} tokens in database`
        : 'No tokens in database'
    });
    
  } catch (error) {
    console.error('Error checking token count:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check token count', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 