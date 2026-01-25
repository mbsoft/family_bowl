'use client';

import { validateUserCredentials } from './storage';

/**
 * Authentication utilities for the prop bet tracker
 * Uses localStorage for persistence and validates against environment variables
 */

const AUTH_STORAGE_KEY = 'auth_user';

/**
 * Validate credentials
 * Note: In Next.js, we need to access env vars on the server side
 * For client-side, we'll validate against environment variables
 */
export async function validateCredentials(username, password) {
  if (!username || !password) {
    return { valid: false, role: null };
  }

  // Check admin credentials (always available)
  const adminPassword = process.env.NEXT_PUBLIC_USER_ADMIN_PASSWORD || 'bosslevel';
  if (username.toLowerCase() === 'admin' && password === adminPassword) {
    return { valid: true, role: 'admin' };
  }

  // Check stored user credentials
  if (typeof window !== 'undefined') {
    const isValid = await validateUserCredentials(username, password);
    if (isValid) {
      return { valid: true, role: 'user', username };
    }
  }

  return { valid: false, role: null };
}

/**
 * Login user and store auth state
 */
export async function login(username, password) {
  const validation = await validateCredentials(username, password);
  if (validation.valid) {
    // Use the matched username from validation (preserves correct case)
    const authData = {
      username: validation.username || username,
      role: validation.role,
      timestamp: Date.now()
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    }
    return { success: true, role: validation.role };
  }
  return { success: false, error: 'Invalid credentials' };
}

/**
 * Logout user and clear auth state
 */
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

/**
 * Get current logged in user
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') {
    return null;
  }
  const authData = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!authData) {
    return null;
  }
  try {
    return JSON.parse(authData);
  } catch (e) {
    return null;
  }
}

/**
 * Check if current user is authenticated
 */
export function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Check if current user is admin
 */
export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

/**
 * Get current username
 */
export function getCurrentUsername() {
  const user = getCurrentUser();
  return user ? user.username : null;
}

