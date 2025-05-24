import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/utils/database';

/**
 * API endpoint to clean up blob URLs in the database
 * This will replace any blob URLs with placeholder images
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting blob URL cleanup...');
    
    // Find all tokens with blob URLs
    const tokensWithBlobUrls = await sql`
      SELECT id, token_address, token_name, token_image 
      FROM user_tokens 
      WHERE token_image LIKE 'blob:%'
    `;
    
    if (!tokensWithBlobUrls || tokensWithBlobUrls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tokens with blob URLs found',
        updated: 0
      });
    }
    
    console.log(`Found ${tokensWithBlobUrls.length} tokens with blob URLs`);
    
    // Update all tokens with blob URLs to use placeholder
    await sql`
      UPDATE user_tokens 
      SET token_image = 'https://via.placeholder.com/200?text=Token+Logo' 
      WHERE token_image LIKE 'blob:%'
    `;
    
    console.log('Cleanup completed successfully');
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${tokensWithBlobUrls.length} tokens with blob URLs`,
      updated: tokensWithBlobUrls.length,
      tokens: tokensWithBlobUrls.map((token: any) => ({
        address: token.token_address,
        name: token.token_name
      }))
    });
    
  } catch (error) {
    console.error('Error during blob URL cleanup:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to cleanup blob URLs', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check how many tokens have blob URLs
export async function GET() {
  try {
    const tokensWithBlobUrls = await sql`
      SELECT COUNT(*) as count 
      FROM user_tokens 
      WHERE token_image LIKE 'blob:%'
    `;
    
    const count = tokensWithBlobUrls?.[0]?.count || 0;
    
    return NextResponse.json({
      success: true,
      tokensWithBlobUrls: count,
      message: count > 0 
        ? `Found ${count} tokens with blob URLs that need cleanup`
        : 'No tokens with blob URLs found'
    });
    
  } catch (error) {
    console.error('Error checking blob URLs:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check blob URLs', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 