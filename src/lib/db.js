import { createClient } from '@libsql/client';

let client = null;

/**
 * Get or create Turso database client
 */
export function getDbClient() {
  if (client) {
    return client;
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Turso environment variables:', {
      hasUrl: !!url,
      hasToken: !!authToken,
      urlLength: url?.length,
      tokenLength: authToken?.length
    });
    throw new Error('Turso database credentials not configured. Please check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
  }

  try {
    client = createClient({
      url,
      authToken,
    });
    return client;
  } catch (error) {
    console.error('Failed to create Turso client:', error);
    throw new Error(`Failed to create database client: ${error.message}`);
  }
}

/**
 * Initialize database schema
 */
export async function initDatabase() {
  const db = getDbClient();

  // Create tables if they don't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bets (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      type TEXT NOT NULL,
      team_names TEXT,
      display_order INTEGER DEFAULT 0,
      created_at INTEGER
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS bet_types (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      options TEXT NOT NULL,
      option_labels TEXT,
      requires_team_names INTEGER DEFAULT 0,
      is_integer_range INTEGER DEFAULT 0,
      min_value INTEGER,
      max_value INTEGER,
      created_at INTEGER
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS submissions (
      username TEXT PRIMARY KEY,
      selections TEXT NOT NULL,
      timestamp INTEGER
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS invites (
      token TEXT PRIMARY KEY,
      default_username TEXT,
      created_at INTEGER,
      used INTEGER DEFAULT 0,
      used_by TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      created_at INTEGER,
      created_via TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at INTEGER,
      expires_at INTEGER,
      used INTEGER DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS bet_results (
      bet_id TEXT PRIMARY KEY,
      result TEXT NOT NULL,
      created_at INTEGER
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER
    )
  `);

  // Archive tables for historical data
  await db.execute(`
    CREATE TABLE IF NOT EXISTS archive_years (
      year INTEGER PRIMARY KEY,
      created_at INTEGER
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS archive_bets (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      question TEXT NOT NULL,
      type TEXT NOT NULL,
      team_names TEXT,
      display_order INTEGER DEFAULT 0,
      FOREIGN KEY (year) REFERENCES archive_years(year) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS archive_submissions (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      username TEXT NOT NULL,
      selections TEXT NOT NULL,
      timestamp INTEGER,
      FOREIGN KEY (year) REFERENCES archive_years(year) ON DELETE CASCADE,
      UNIQUE(year, username)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS archive_results (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      bet_id TEXT NOT NULL,
      result TEXT NOT NULL,
      FOREIGN KEY (year) REFERENCES archive_years(year) ON DELETE CASCADE,
      FOREIGN KEY (bet_id) REFERENCES archive_bets(id) ON DELETE CASCADE,
      UNIQUE(year, bet_id)
    )
  `);
}

