import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Force dynamic behavior for health check API
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const healthStatus = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: 'unknown',
    solanaRPC: 'unknown',
    storagePinata: 'unknown',
  };

  try {
    // Check database connection
    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`SELECT 1 as check`;
        healthStatus.database = result?.[0]?.check === 1 ? 'connected' : 'error';
      } catch (error) {
        console.error('Database health check error:', error);
        healthStatus.database = 'error';
      }
    } else {
      healthStatus.database = 'not_configured';
    }

    // Check Solana RPC URL
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_SOLANA_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getHealth',
          }),
        });
        const data = await response.json();
        healthStatus.solanaRPC = data.result === 'ok' ? 'connected' : 'error';
      } catch (error) {
        console.error('Solana RPC health check error:', error);
        healthStatus.solanaRPC = 'error';
      }
    } else {
      healthStatus.solanaRPC = 'not_configured';
    }

    // Check Pinata connection
    if (process.env.PINATA_JWT) {
      try {
        const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${process.env.PINATA_JWT}` 
          },
        });
        
        healthStatus.storagePinata = response.ok ? 'connected' : 'error';
      } catch (error) {
        console.error('Pinata health check error:', error);
        healthStatus.storagePinata = 'error';
      }
    } else {
      healthStatus.storagePinata = 'not_configured';
    }

    return NextResponse.json({
      status: 'ok',
      duration: `${Date.now() - startTime}ms`,
      ...healthStatus
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        ...healthStatus
      },
      { status: 500 }
    );
  }
} 