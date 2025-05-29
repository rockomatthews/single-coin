import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Force dynamic behavior for database migration API
export const dynamic = 'force-dynamic';

// Migrate database by adding missing columns
export async function POST() {
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
    
    console.log('Starting database migration...');
    
    // Add missing columns if they don't exist
    const migrations = [
      'ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS token_description TEXT',
      'ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS website TEXT',
      'ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS twitter TEXT',
      'ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS telegram TEXT',
      'ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS discord TEXT',
      'ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS metadata_uri TEXT'
    ];
    
    for (const migration of migrations) {
      try {
        console.log('Executing:', migration);
        await sql(migration);
        console.log('✅ Success');
      } catch (error) {
        console.log('⚠️ Migration may have already been applied:', (error as Error).message);
      }
    }
    
    console.log('Database migration completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database migration completed successfully',
      migrationsApplied: migrations.length
    });
  } catch (error) {
    console.error('Database migration error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to migrate database', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 