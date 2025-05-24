import { NextRequest } from 'next/server';
import { GET as getShortcuts } from '../api/shortcuts/route';

/**
 * shortcuts.json endpoint for Phantom wallet integration
 * This is the standard endpoint that Phantom requests: external_url + /shortcuts.json
 * Redirects to our main shortcuts API
 */
export async function GET(request: NextRequest) {
  // Forward the request to our main shortcuts API
  return getShortcuts(request);
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const { OPTIONS } = await import('../api/shortcuts/route');
  return OPTIONS();
} 