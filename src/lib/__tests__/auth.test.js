import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateCredentials,
  login,
  logout,
  isAuthenticated,
  isAdmin,
  getCurrentUser,
  getCurrentUsername,
} from '../auth';

// Mock storage module
vi.mock('../storage', () => ({
  validateUserCredentials: vi.fn(),
}));

import { validateUserCredentials } from '../storage';

describe('auth utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('validateCredentials', () => {
    it('should return invalid for empty username', async () => {
      const result = await validateCredentials('', 'password');
      expect(result.valid).toBe(false);
      expect(result.role).toBeNull();
    });

    it('should return invalid for empty password', async () => {
      const result = await validateCredentials('username', '');
      expect(result.valid).toBe(false);
      expect(result.role).toBeNull();
    });

    it('should return invalid for null inputs', async () => {
      const result = await validateCredentials(null, null);
      expect(result.valid).toBe(false);
      expect(result.role).toBeNull();
    });

    it('should return admin role for admin credentials', async () => {
      // Mock environment variable
      const originalEnv = process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD;
      process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD = 'bosslevel';

      const result = await validateCredentials('admin', 'bosslevel');
      expect(result.valid).toBe(true);
      expect(result.role).toBe('admin');

      // Restore
      process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD = originalEnv;
    });

    it('should return invalid for wrong admin password', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD;
      process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD = 'bosslevel';

      const result = await validateCredentials('admin', 'wrongpassword');
      expect(result.valid).toBe(false);
      expect(result.role).toBeNull();

      process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD = originalEnv;
    });

    it('should return invalid for admin username with wrong case', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD;
      process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD = 'bosslevel';

      const result = await validateCredentials('Admin', 'bosslevel');
      expect(result.valid).toBe(true); // Should still work (toLowerCase)
      expect(result.role).toBe('admin');

      process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD = originalEnv;
    });

    it('should validate user credentials when validateUserCredentials returns true', async () => {
      validateUserCredentials.mockResolvedValue(true);

      const result = await validateCredentials('user1', 'password123');
      expect(result.valid).toBe(true);
      expect(result.role).toBe('user');
      expect(result.username).toBe('user1');
      expect(validateUserCredentials).toHaveBeenCalledWith('user1', 'password123');
    });

    it('should return invalid when validateUserCredentials returns false', async () => {
      validateUserCredentials.mockResolvedValue(false);

      const result = await validateCredentials('user1', 'wrongpassword');
      expect(result.valid).toBe(false);
      expect(result.role).toBeNull();
    });
  });

  describe('login', () => {
    it('should store auth data in localStorage on successful login', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD;
      process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD = 'bosslevel';

      const result = await login('admin', 'bosslevel');
      expect(result.success).toBe(true);
      expect(result.role).toBe('admin');

      const stored = JSON.parse(localStorage.getItem('auth_user'));
      expect(stored.username).toBe('admin');
      expect(stored.role).toBe('admin');

      process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD = originalEnv;
    });

    it('should not store auth data on failed login', async () => {
      validateUserCredentials.mockResolvedValue(false);

      const result = await login('user1', 'wrongpassword');
      expect(result.success).toBe(false);

      expect(localStorage.getItem('auth_user')).toBeNull();
    });
  });

  describe('logout', () => {
    it('should remove auth data from localStorage', () => {
      localStorage.setItem('auth_user', JSON.stringify({ username: 'user1', role: 'user' }));
      
      logout();
      
      expect(localStorage.getItem('auth_user')).toBeNull();
    });

    it('should not error if no auth data exists', () => {
      expect(() => logout()).not.toThrow();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when auth_user exists in localStorage', () => {
      localStorage.setItem('auth_user', JSON.stringify({ username: 'user1', role: 'user' }));
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when auth_user does not exist', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return false when auth_user is invalid JSON', () => {
      localStorage.setItem('auth_user', 'invalid json');
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true when user role is admin', () => {
      localStorage.setItem('auth_user', JSON.stringify({ username: 'admin', role: 'admin' }));
      expect(isAdmin()).toBe(true);
    });

    it('should return false when user role is user', () => {
      localStorage.setItem('auth_user', JSON.stringify({ username: 'user1', role: 'user' }));
      expect(isAdmin()).toBe(false);
    });

    it('should return false when no auth_user exists', () => {
      expect(isAdmin()).toBe(false);
    });

    it('should return false when auth_user has no role', () => {
      localStorage.setItem('auth_user', JSON.stringify({ username: 'user1' }));
      expect(isAdmin()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no auth data exists', () => {
      expect(getCurrentUser()).toBeNull();
    });

    it('should return user data when auth_user exists', () => {
      const userData = { username: 'user1', role: 'user', timestamp: Date.now() };
      localStorage.setItem('auth_user', JSON.stringify(userData));
      expect(getCurrentUser()).toEqual(userData);
    });

    it('should return null for invalid JSON in localStorage', () => {
      localStorage.setItem('auth_user', 'invalid json');
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('getCurrentUsername', () => {
    it('should return username when user is logged in', () => {
      localStorage.setItem('auth_user', JSON.stringify({ username: 'user1', role: 'user' }));
      expect(getCurrentUsername()).toBe('user1');
    });

    it('should return null when no user is logged in', () => {
      expect(getCurrentUsername()).toBeNull();
    });
  });
});
