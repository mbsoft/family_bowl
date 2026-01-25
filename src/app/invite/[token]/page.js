'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getInviteByToken, markInviteUsed, saveUserCredentials } from '../../../lib/storage';
import { getUserCredentials } from '../../../lib/storage';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !token) {
      setLoading(false);
      return;
    }

    // Check if invite is valid
    const invite = getInviteByToken(token);
    if (!invite) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    if (invite.used) {
      setError('This invite link has already been used');
      setLoading(false);
      return;
    }

    // Pre-fill username if provided in invite
    if (invite.defaultUsername) {
      setUsername(invite.defaultUsername);
    }

    setInviteValid(true);
    setLoading(false);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check if username already exists
    const credentials = getUserCredentials();
    if (credentials[username.trim()]) {
      setError('Username already exists. Please choose a different username.');
      return;
    }

    setSubmitting(true);

    // Save credentials
    const result = saveUserCredentials(username.trim(), password, token);
    
    if (!result.success) {
      setError(result.error || 'Failed to create account');
      setSubmitting(false);
      return;
    }

    // Mark invite as used
    markInviteUsed(token, username.trim());

    // Redirect to login
    router.push('/login?registered=true');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!inviteValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Invalid Invite Link
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              {error || 'This invite link is invalid or has expired.'}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Create Your Account
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Set up your username and password to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Choose a username (min 3 characters)"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Choose a password (min 4 characters)"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

