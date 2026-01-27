import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as storage from '../storage';

// Mock fetch globally
global.fetch = vi.fn();

describe('storage.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getBets', () => {
    it('should return bets array on success', async () => {
      const mockBets = [{ id: 'bet-1', question: 'Test?' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBets,
      });

      const result = await storage.getBets();

      expect(result).toEqual(mockBets);
      expect(global.fetch).toHaveBeenCalledWith('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getBets' }),
      });
    });

    it('should return empty array on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await storage.getBets();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('saveBets', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.saveBets([{ id: 'bet-1' }]);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveBets', bets: [{ id: 'bet-1' }] }),
      });
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Save failed'));

      const result = await storage.saveBets([]);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getSubmission', () => {
    it('should return submission on success', async () => {
      const mockSubmission = { username: 'user1', selections: {} };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubmission,
      });

      const result = await storage.getSubmission('user1');

      expect(result).toEqual(mockSubmission);
      expect(global.fetch).toHaveBeenCalledWith('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSubmission', username: 'user1' }),
      });
    });

    it('should return null when username is missing', async () => {
      const result = await storage.getSubmission(null);

      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Not found'));

      const result = await storage.getSubmission('user1');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('saveSubmission', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.saveSubmission({
        username: 'user1',
        selections: {},
      });

      expect(result).toBe(true);
    });

    it('should return false when submission is missing', async () => {
      const result = await storage.saveSubmission(null);

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return false when username is missing', async () => {
      const result = await storage.saveSubmission({ selections: {} });

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Save failed'));

      const result = await storage.saveSubmission({
        username: 'user1',
        selections: {},
      });

      expect(result).toBe(false);
    });
  });

  describe('getAllSubmissions', () => {
    it('should return submissions array on success', async () => {
      const mockSubmissions = [{ username: 'user1' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubmissions,
      });

      const result = await storage.getAllSubmissions();

      expect(result).toEqual(mockSubmissions);
    });

    it('should return empty array on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.getAllSubmissions();

      expect(result).toEqual([]);
    });
  });

  describe('deleteSubmission', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.deleteSubmission('user1');

      expect(result).toBe(true);
    });

    it('should return false when username is missing', async () => {
      const result = await storage.deleteSubmission(null);

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Delete failed'));

      const result = await storage.deleteSubmission('user1');

      expect(result).toBe(false);
    });
  });

  describe('getBetTypes', () => {
    it('should return bet types array on success', async () => {
      const mockTypes = [{ id: 'Y/N', label: 'Yes/No' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTypes,
      });

      const result = await storage.getBetTypes();

      expect(result).toEqual(mockTypes);
    });

    it('should return empty array on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.getBetTypes();

      expect(result).toEqual([]);
    });
  });

  describe('saveBetTypes', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.saveBetTypes([]);

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Save failed'));

      const result = await storage.saveBetTypes([]);

      expect(result).toBe(false);
    });
  });

  describe('arePicksLocked', () => {
    it('should return locked status object', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ locked: true }),
      });

      const result = await storage.arePicksLocked();

      expect(result).toEqual({ locked: true });
    });

    it('should return false when not locked', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ locked: false }),
      });

      const result = await storage.arePicksLocked();

      expect(result).toEqual({ locked: false });
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.arePicksLocked();

      expect(result).toBe(false);
    });
  });

  describe('setPicksLocked', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.setPicksLocked(true);

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.setPicksLocked(true);

      expect(result).toBe(false);
    });
  });

  describe('generateInvite', () => {
    it('should return invite token on success', async () => {
      const mockInvite = { token: 'abc123' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvite,
      });

      const result = await storage.generateInvite('user1');

      expect(result).toEqual(mockInvite);
    });

    it('should return null on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.generateInvite();

      expect(result).toBeNull();
    });
  });

  describe('getInvites', () => {
    it('should return invites array on success', async () => {
      const mockInvites = [{ token: 'abc123' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvites,
      });

      const result = await storage.getInvites();

      expect(result).toEqual(mockInvites);
    });

    it('should return empty array on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.getInvites();

      expect(result).toEqual([]);
    });
  });

  describe('getInviteByToken', () => {
    it('should return invite on success', async () => {
      const mockInvite = { token: 'abc123' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvite,
      });

      const result = await storage.getInviteByToken('abc123');

      expect(result).toEqual(mockInvite);
    });

    it('should return null when token is missing', async () => {
      const result = await storage.getInviteByToken(null);

      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Not found'));

      const result = await storage.getInviteByToken('abc123');

      expect(result).toBeNull();
    });
  });

  describe('markInviteUsed', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.markInviteUsed('abc123', 'user1');

      expect(result).toBe(true);
    });

    it('should return false when token is missing', async () => {
      const result = await storage.markInviteUsed(null, 'user1');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.markInviteUsed('abc123', 'user1');

      expect(result).toBe(false);
    });
  });

  describe('deleteInvite', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.deleteInvite('abc123');

      expect(result).toBe(true);
    });

    it('should return false when token is missing', async () => {
      const result = await storage.deleteInvite(null);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.deleteInvite('abc123');

      expect(result).toBe(false);
    });
  });

  describe('getUserCredentials', () => {
    it('should return credentials object on success', async () => {
      const mockCreds = { user1: { username: 'user1' } };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreds,
      });

      const result = await storage.getUserCredentials();

      expect(result).toEqual(mockCreds);
    });

    it('should return empty object on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.getUserCredentials();

      expect(result).toEqual({});
    });
  });

  describe('saveUserCredentials', () => {
    it('should return success object on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.saveUserCredentials('user1', 'pass123', 'token');

      expect(result).toEqual({ success: true });
    });

    it('should return error object when username is missing', async () => {
      const result = await storage.saveUserCredentials(null, 'pass123');

      expect(result).toEqual({ success: false, error: 'Username and password are required' });
    });

    it('should return error object when password is missing', async () => {
      const result = await storage.saveUserCredentials('user1', null);

      expect(result).toEqual({ success: false, error: 'Username and password are required' });
    });

    it('should return error object on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.saveUserCredentials('user1', 'pass123');

      expect(result).toEqual({ success: false, error: 'Failed to save credentials' });
    });
  });

  describe('validateUserCredentials', () => {
    it('should return validation result object', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      });

      const result = await storage.validateUserCredentials('user1', 'pass123');

      expect(result).toEqual({ valid: true });
    });

    it('should return false when credentials are invalid', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false }),
      });

      const result = await storage.validateUserCredentials('user1', 'wrong');

      expect(result).toEqual({ valid: false });
    });

    it('should return false when username is missing', async () => {
      const result = await storage.validateUserCredentials(null, 'pass123');

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.validateUserCredentials('user1', 'pass123');

      expect(result).toBe(false);
    });
  });

  describe('deleteUser', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.deleteUser('user1');

      expect(result).toBe(true);
    });

    it('should return false when username is missing', async () => {
      const result = await storage.deleteUser(null);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.deleteUser('user1');

      expect(result).toBe(false);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should return token object on success', async () => {
      const mockToken = { token: 'reset123', success: true };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      });

      const result = await storage.generatePasswordResetToken('user1');

      expect(result).toEqual(mockToken);
    });

    it('should return error object when username is missing', async () => {
      const result = await storage.generatePasswordResetToken(null);

      expect(result).toEqual({ success: false, error: 'Username is required' });
    });

    it('should return error object on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.generatePasswordResetToken('user1');

      expect(result).toEqual({ success: false, error: 'Failed to generate reset token' });
    });
  });

  describe('getPasswordResetToken', () => {
    it('should return token data on success', async () => {
      const mockToken = { token: 'reset123', username: 'user1' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      });

      const result = await storage.getPasswordResetToken('reset123');

      expect(result).toEqual(mockToken);
    });

    it('should return null when token is missing', async () => {
      const result = await storage.getPasswordResetToken(null);

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Not found'));

      const result = await storage.getPasswordResetToken('reset123');

      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should return success object on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.resetPassword('token', 'newpass');

      expect(result).toEqual({ success: true });
    });

    it('should return error object when token is missing', async () => {
      const result = await storage.resetPassword(null, 'newpass');

      expect(result).toEqual({ success: false, error: 'Token and new password are required' });
    });

    it('should return error object when password is missing', async () => {
      const result = await storage.resetPassword('token', null);

      expect(result).toEqual({ success: false, error: 'Token and new password are required' });
    });

    it('should return error object on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.resetPassword('token', 'newpass');

      expect(result).toEqual({ success: false, error: 'Failed to reset password' });
    });
  });

  describe('getBetResults', () => {
    it('should return results object on success', async () => {
      const mockResults = { 'bet-1': 'Y' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      });

      const result = await storage.getBetResults();

      expect(result).toEqual(mockResults);
    });

    it('should return empty object on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.getBetResults();

      expect(result).toEqual({});
    });
  });

  describe('getBetResult', () => {
    it('should return result on success', async () => {
      const mockResult = { betId: 'bet-1', result: 'Y' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await storage.getBetResult('bet-1');

      expect(result).toEqual(mockResult);
    });

    it('should return null when betId is missing', async () => {
      const result = await storage.getBetResult(null);

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Not found'));

      const result = await storage.getBetResult('bet-1');

      expect(result).toBeNull();
    });
  });

  describe('saveBetResult', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.saveBetResult('bet-1', 'Y');

      expect(result).toBe(true);
    });

    it('should return false when betId is missing', async () => {
      const result = await storage.saveBetResult(null, 'Y');

      expect(result).toBe(false);
    });

    it('should return false when result is missing', async () => {
      const result = await storage.saveBetResult('bet-1', null);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.saveBetResult('bet-1', 'Y');

      expect(result).toBe(false);
    });
  });

  describe('deleteBetResult', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.deleteBetResult('bet-1');

      expect(result).toBe(true);
    });

    it('should return false when betId is missing', async () => {
      const result = await storage.deleteBetResult(null);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.deleteBetResult('bet-1');

      expect(result).toBe(false);
    });
  });

  describe('getArchiveYears', () => {
    it('should return years array on success', async () => {
      const mockYears = [{ year: 2025 }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockYears,
      });

      const result = await storage.getArchiveYears();

      expect(result).toEqual(mockYears);
    });

    it('should return empty array on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.getArchiveYears();

      expect(result).toEqual([]);
    });
  });

  describe('getArchiveData', () => {
    it('should return archive data on success', async () => {
      const mockData = { bets: [], submissions: [] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await storage.getArchiveData(2025);

      expect(result).toEqual(mockData);
    });

    it('should return null when year is missing', async () => {
      const result = await storage.getArchiveData(null);

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Not found'));

      const result = await storage.getArchiveData(2025);

      expect(result).toBeNull();
    });
  });

  describe('saveArchiveData', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.saveArchiveData(2025, [], [], {});

      expect(result).toBe(true);
    });

    it('should return false when year is missing', async () => {
      const result = await storage.saveArchiveData(null, [], [], {});

      expect(result).toBe(false);
    });

    it('should return false when bets is missing', async () => {
      const result = await storage.saveArchiveData(2025, null, [], {});

      expect(result).toBe(false);
    });

    it('should return false when submissions is missing', async () => {
      const result = await storage.saveArchiveData(2025, [], null, {});

      expect(result).toBe(false);
    });

    it('should return false when results is missing', async () => {
      const result = await storage.saveArchiveData(2025, [], [], null);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.saveArchiveData(2025, [], [], {});

      expect(result).toBe(false);
    });
  });

  describe('deleteArchiveYear', () => {
    it('should return true on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.deleteArchiveYear(2025);

      expect(result).toBe(true);
    });

    it('should return false when year is missing', async () => {
      const result = await storage.deleteArchiveYear(null);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await storage.deleteArchiveYear(2025);

      expect(result).toBe(false);
    });
  });

  describe('dbCall error handling', () => {
    it('should handle HTTP error responses with JSON error data', async () => {
      // Use a function that doesn't catch errors - saveBets throws
      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid data', details: 'Missing field' }),
      });

      // saveBets catches errors and returns false, so we need to test the error path differently
      // Let's test that the error is logged
      const result = await storage.saveBets([]);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle HTTP error responses without JSON', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
      });

      // Functions catch errors, so test that error handling works
      const result = await storage.saveBets([]);
      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Functions catch errors, so test that error handling works
      const result = await storage.saveBets([]);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
