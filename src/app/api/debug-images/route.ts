import { NextResponse } from 'next/server';
import { sql } from '@/utils/database';

export async function GET() {
  try {
    // Fetch recent tokens with their image URLs
    const tokens = await sql`
      SELECT 
        token_name,
        token_symbol,
        token_address,
        token_image,
        created_at
      FROM user_tokens 
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    // Analyze image URLs
    const imageAnalysis = tokens.map((token: any) => {
      const imageUrl = token.token_image;
      let urlType = 'unknown';
      let isValid = false;
      let potentialIssues = [];
      
      if (!imageUrl) {
        urlType = 'null';
        potentialIssues.push('No image URL');
      } else if (imageUrl.startsWith('data:image/')) {
        urlType = 'base64';
        isValid = true;
        potentialIssues.push('Base64 images should be uploaded to IPFS');
      } else if (imageUrl.startsWith('blob:')) {
        urlType = 'blob';
        potentialIssues.push('Blob URLs are temporary and will break');
      } else if (imageUrl.includes('gateway.pinata.cloud/ipfs/')) {
        urlType = 'pinata-ipfs';
        isValid = true;
        // Extract IPFS hash
        const hashMatch = imageUrl.match(/\/ipfs\/([A-Za-z0-9]+)/);
        if (hashMatch) {
          const hash = hashMatch[1];
          if (hash.length < 40) {
            potentialIssues.push('IPFS hash seems too short');
          }
        } else {
          potentialIssues.push('Could not extract IPFS hash');
        }
      } else if (imageUrl.includes('ipfs://')) {
        urlType = 'ipfs-protocol';
        potentialIssues.push('IPFS protocol URLs need gateway conversion');
      } else if (imageUrl.startsWith('http')) {
        urlType = 'http';
        isValid = true;
      } else if (imageUrl.startsWith('/')) {
        urlType = 'relative';
        isValid = true;
      }
      
      return {
        token_name: token.token_name,
        token_symbol: token.token_symbol,
        token_address: token.token_address,
        image_url: imageUrl,
        url_type: urlType,
        is_valid: isValid,
        potential_issues: potentialIssues,
        created_at: token.created_at
      };
    });
    
    // Summary statistics
    const summary = {
      total_tokens: tokens.length,
      url_types: imageAnalysis.reduce((acc: any, token: any) => {
        acc[token.url_type] = (acc[token.url_type] || 0) + 1;
        return acc;
      }, {}),
      valid_images: imageAnalysis.filter(t => t.is_valid).length,
      problematic_images: imageAnalysis.filter(t => t.potential_issues.length > 0).length
    };
    
    return NextResponse.json({
      success: true,
      summary,
      tokens: imageAnalysis,
      recommendations: [
        'Ensure all blob URLs are converted to IPFS before database storage',
        'Base64 images should be uploaded to IPFS for better performance',
        'Verify IPFS hashes are valid and accessible',
        'Check Next.js image configuration for domain allowlists'
      ]
    });
  } catch (error) {
    console.error('Error analyzing images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze images', details: (error as Error).message },
      { status: 500 }
    );
  }
} 