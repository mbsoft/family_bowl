import { NextResponse } from 'next/server';
import { getDbClient } from '../../../lib/db';
import bcrypt from 'bcryptjs';

/**
 * Migration endpoint to hash existing plain text passwords
 * WARNING: This should only be run once by an admin
 * Access: POST /api/migrate-passwords
 * 
 * This will:
 * 1. Find all users with plain text passwords (not starting with $2a$, $2b$, or $2y$)
 * 2. Hash them using bcrypt
 * 3. Update the database
 */
export async function POST(request) {
  try {
    // Simple admin check - you may want to add proper authentication
    const { adminPassword } = await request.json();
    
    // Verify admin password (you can make this more secure)
    if (adminPassword !== process.env.USER_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDbClient();
    
    // Get all users
    const result = await db.execute('SELECT username, password FROM user_credentials');
    
    let migrated = 0;
    let skipped = 0;
    const errors = [];

    for (const row of result.rows) {
      const username = row.username;
      const password = row.password;
      
      // Skip admin user (handled separately)
      if (username.toLowerCase() === 'admin') {
        skipped++;
        continue;
      }
      
      // Check if password is already hashed
      const isHashed = password.startsWith('$2a$') || 
                       password.startsWith('$2b$') || 
                       password.startsWith('$2y$');
      
      if (isHashed) {
        skipped++;
        continue;
      }
      
      // Hash the plain text password
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
          'UPDATE user_credentials SET password = ? WHERE username = ?',
          [hashedPassword, username]
        );
        migrated++;
      } catch (error) {
        errors.push({ username, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      migrated,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}

