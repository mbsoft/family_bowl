import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @libsql/client - must define mocks inside factory
let mockExecute;
let mockClient;
let mockCreateClient;

vi.mock('@libsql/client', () => {
  const mockExec = vi.fn().mockResolvedValue({});
  const mockCli = {
    execute: mockExec,
  };
  const mockCreate = vi.fn().mockReturnValue(mockCli);
  
  // Store references for test access
  if (typeof globalThis !== 'undefined') {
    globalThis.__dbTestMocks = {
      mockExecute: mockExec,
      mockClient: mockCli,
      mockCreateClient: mockCreate,
    };
  }
  
  return {
    createClient: mockCreate,
  };
});

// Import after mock is set up
import { getDbClient, initDatabase } from '../db';

describe('db.js', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Get mock references
    mockExecute = globalThis.__dbTestMocks?.mockExecute;
    mockClient = globalThis.__dbTestMocks?.mockClient;
    mockCreateClient = globalThis.__dbTestMocks?.mockCreateClient;
    
    vi.clearAllMocks();
    if (mockExecute) mockExecute.mockResolvedValue({});
    if (mockCreateClient) mockCreateClient.mockReturnValue(mockClient);
    
    // Save original env
    process.env = { ...originalEnv };
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Clear the module-level client by resetting modules
    // This requires re-importing, but we need to preserve mocks
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('getDbClient', () => {
    it('should create and return a new client when client is null', async () => {
      // Re-import after module reset
      const { getDbClient } = await import('../db');
      // Re-get mocks after reset
      mockExecute = globalThis.__dbTestMocks?.mockExecute;
      mockClient = globalThis.__dbTestMocks?.mockClient;
      mockCreateClient = globalThis.__dbTestMocks?.mockCreateClient;
      
      process.env.TURSO_DATABASE_URL = 'https://test-db.turso.io';
      process.env.TURSO_AUTH_TOKEN = 'test-token';

      const client = getDbClient();

      expect(mockCreateClient).toHaveBeenCalledWith({
        url: 'https://test-db.turso.io',
        authToken: 'test-token',
      });
      expect(client).toBe(mockClient);
    });

    it('should return existing client if already created', async () => {
      const { getDbClient } = await import('../db');
      mockExecute = globalThis.__dbTestMocks?.mockExecute;
      mockClient = globalThis.__dbTestMocks?.mockClient;
      mockCreateClient = globalThis.__dbTestMocks?.mockCreateClient;
      
      process.env.TURSO_DATABASE_URL = 'https://test-db.turso.io';
      process.env.TURSO_AUTH_TOKEN = 'test-token';

      const client1 = getDbClient();
      const client2 = getDbClient();

      // Should only create client once
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      expect(client1).toBe(client2);
      expect(client1).toBe(mockClient);
    });

    it('should throw error when TURSO_DATABASE_URL is missing', async () => {
      const { getDbClient } = await import('../db');
      mockCreateClient = globalThis.__dbTestMocks?.mockCreateClient;
      
      delete process.env.TURSO_DATABASE_URL;
      process.env.TURSO_AUTH_TOKEN = 'test-token';

      expect(() => getDbClient()).toThrow('Turso database credentials not configured');
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('should throw error when TURSO_AUTH_TOKEN is missing', async () => {
      const { getDbClient } = await import('../db');
      mockCreateClient = globalThis.__dbTestMocks?.mockCreateClient;
      
      process.env.TURSO_DATABASE_URL = 'https://test-db.turso.io';
      delete process.env.TURSO_AUTH_TOKEN;

      expect(() => getDbClient()).toThrow('Turso database credentials not configured');
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('should throw error when both env vars are missing', async () => {
      const { getDbClient } = await import('../db');
      mockCreateClient = globalThis.__dbTestMocks?.mockCreateClient;
      
      delete process.env.TURSO_DATABASE_URL;
      delete process.env.TURSO_AUTH_TOKEN;

      expect(() => getDbClient()).toThrow('Turso database credentials not configured');
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('should handle createClient errors gracefully', async () => {
      const { getDbClient } = await import('../db');
      mockCreateClient = globalThis.__dbTestMocks?.mockCreateClient;
      
      process.env.TURSO_DATABASE_URL = 'https://test-db.turso.io';
      process.env.TURSO_AUTH_TOKEN = 'test-token';
      
      const createError = new Error('Connection failed');
      mockCreateClient.mockImplementationOnce(() => {
        throw createError;
      });

      expect(() => getDbClient()).toThrow('Failed to create database client: Connection failed');
      expect(console.error).toHaveBeenCalledWith('Failed to create Turso client:', createError);
    });

    it('should log error details when env vars are missing', async () => {
      const { getDbClient } = await import('../db');
      mockCreateClient = globalThis.__dbTestMocks?.mockCreateClient;
      
      delete process.env.TURSO_DATABASE_URL;
      delete process.env.TURSO_AUTH_TOKEN;

      expect(() => getDbClient()).toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Turso environment variables:',
        expect.objectContaining({
          hasUrl: false,
          hasToken: false,
        })
      );
    });
  });

  describe('initDatabase', () => {
    it('should call getDbClient to get database client', async () => {
      const { initDatabase } = await import('../db');
      mockCreateClient = globalThis.__dbTestMocks?.mockCreateClient;
      
      process.env.TURSO_DATABASE_URL = 'https://test-db.turso.io';
      process.env.TURSO_AUTH_TOKEN = 'test-token';

      await initDatabase();

      expect(mockCreateClient).toHaveBeenCalled();
    });

    it('should execute CREATE TABLE statements for all tables', async () => {
      const { initDatabase } = await import('../db');
      mockExecute = globalThis.__dbTestMocks?.mockExecute;
      
      process.env.TURSO_DATABASE_URL = 'https://test-db.turso.io';
      process.env.TURSO_AUTH_TOKEN = 'test-token';

      await initDatabase();

      // Should execute 12 CREATE TABLE statements
      expect(mockExecute).toHaveBeenCalledTimes(12);
      
      // Check that all table creation statements are called
      const calls = mockExecute.mock.calls.map(call => call[0]);
      
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS bets'))).toBe(true);
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS bet_types'))).toBe(true);
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS submissions'))).toBe(true);
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS invites'))).toBe(true);
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS user_credentials'))).toBe(true);
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS password_reset_tokens'))).toBe(true);
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS bet_results'))).toBe(true);
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS app_settings'))).toBe(true);
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS archive_years'))).toBe(true);
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS archive_bets'))).toBe(true);
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS archive_submissions'))).toBe(true);
      expect(calls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS archive_results'))).toBe(true);
    });

    it('should create bets table with correct schema', async () => {
      const { initDatabase } = await import('../db');
      mockExecute = globalThis.__dbTestMocks?.mockExecute;
      
      process.env.TURSO_DATABASE_URL = 'https://test-db.turso.io';
      process.env.TURSO_AUTH_TOKEN = 'test-token';

      await initDatabase();

      const betsTableCall = mockExecute.mock.calls.find(call => 
        call[0].includes('CREATE TABLE IF NOT EXISTS bets')
      );
      
      expect(betsTableCall).toBeTruthy();
      expect(betsTableCall[0]).toContain('id TEXT PRIMARY KEY');
      expect(betsTableCall[0]).toContain('question TEXT NOT NULL');
      expect(betsTableCall[0]).toContain('type TEXT NOT NULL');
      expect(betsTableCall[0]).toContain('team_names TEXT');
      expect(betsTableCall[0]).toContain('display_order INTEGER DEFAULT 0');
      expect(betsTableCall[0]).toContain('created_at INTEGER');
    });

    it('should create archive tables with foreign keys', async () => {
      const { initDatabase } = await import('../db');
      mockExecute = globalThis.__dbTestMocks?.mockExecute;
      
      process.env.TURSO_DATABASE_URL = 'https://test-db.turso.io';
      process.env.TURSO_AUTH_TOKEN = 'test-token';

      await initDatabase();

      const archiveBetsCall = mockExecute.mock.calls.find(call => 
        call[0].includes('CREATE TABLE IF NOT EXISTS archive_bets')
      );
      
      expect(archiveBetsCall).toBeTruthy();
      expect(archiveBetsCall[0]).toContain('FOREIGN KEY (year) REFERENCES archive_years(year)');
      expect(archiveBetsCall[0]).toContain('ON DELETE CASCADE');
    });

    it('should handle database execution errors', async () => {
      const { initDatabase } = await import('../db');
      mockExecute = globalThis.__dbTestMocks?.mockExecute;
      
      process.env.TURSO_DATABASE_URL = 'https://test-db.turso.io';
      process.env.TURSO_AUTH_TOKEN = 'test-token';

      const dbError = new Error('Database connection failed');
      mockExecute.mockRejectedValueOnce(dbError);

      await expect(initDatabase()).rejects.toThrow('Database connection failed');
    });

    it('should create all required tables in correct order', async () => {
      const { initDatabase } = await import('../db');
      mockExecute = globalThis.__dbTestMocks?.mockExecute;
      
      process.env.TURSO_DATABASE_URL = 'https://test-db.turso.io';
      process.env.TURSO_AUTH_TOKEN = 'test-token';

      await initDatabase();

      // Archive tables should be created after main tables
      const calls = mockExecute.mock.calls.map(call => call[0]);
      const betsIndex = calls.findIndex(c => c.includes('CREATE TABLE IF NOT EXISTS bets'));
      const archiveYearsIndex = calls.findIndex(c => c.includes('CREATE TABLE IF NOT EXISTS archive_years'));
      
      expect(betsIndex).toBeGreaterThanOrEqual(0);
      expect(archiveYearsIndex).toBeGreaterThan(betsIndex);
    });
  });
});
