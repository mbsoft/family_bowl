'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getInviteByToken, markInviteUsed, saveUserCredentials } from '../../../lib/storage';
import { getUserCredentials } from '../../../lib/storage';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  // Decode the token from URL to handle URL encoding issues on mobile browsers
  const rawToken = params?.token;
  const token = rawToken ? decodeURIComponent(String(rawToken)) : null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validToken, setValidToken] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Function to clean and normalize token (handles URL encoding, query params, etc.)
    const cleanToken = (rawToken) => {
      if (!rawToken) return null;
      
      // Remove any query parameters or fragments
      let cleaned = String(rawToken).split('?')[0].split('#')[0];
      
      // Try to decode URL encoding
      try {
        cleaned = decodeURIComponent(cleaned);
      } catch (e) {
        // If decoding fails, try without the problematic characters
        try {
          cleaned = decodeURI(cleaned);
        } catch (e2) {
          // Use as-is if all decoding fails
        }
      }
      
      return cleaned.trim();
    };

    // Function to validate and process invite token
    const validateInvite = async (inviteToken) => {
      if (!inviteToken) {
        return null;
      }
      
      const cleanedToken = cleanToken(inviteToken);
      if (!cleanedToken) {
        return null;
      }

      // Check if invite is valid
      const invite = await getInviteByToken(cleanedToken);
      return invite ? { invite, token: cleanedToken } : null;
    };

    // Try multiple methods to extract the token
    const loadInvite = async () => {
      let result = null;
      
      // Method 1: Use token from Next.js params
      if (token) {
        result = await validateInvite(token);
      }

      // Method 2: Extract from URL pathname (handles cases where params don't work)
      if (!result && typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/');
        const urlToken = pathParts[pathParts.length - 1];
        if (urlToken && urlToken !== 'invite' && urlToken !== '') {
          result = await validateInvite(urlToken);
        }
      }

      // Method 3: Extract from full URL (handles messaging app URL modifications)
      if (!result && typeof window !== 'undefined') {
        const fullUrl = window.location.href;
        // Try to find the token in the URL
        const inviteMatch = fullUrl.match(/\/invite\/([^/?&#]+)/);
        if (inviteMatch && inviteMatch[1]) {
          result = await validateInvite(inviteMatch[1]);
        }
      }

      // Method 4: Try the hash or query params (some apps add these)
      if (!result && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const hashToken = window.location.hash.replace('#', '');
        if (hashToken) {
          result = await validateInvite(hashToken);
        }
      }

      if (!result || !result.invite) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      const { invite, token: validToken } = result;

      if (invite.used) {
        setError('This invite link has already been used');
        setLoading(false);
        return;
      }

      // Pre-fill username if provided in invite
      if (invite.defaultUsername) {
        setUsername(invite.defaultUsername);
      }

      // Store the valid token for use in submit
      setValidToken(validToken);

      setInviteValid(true);
      setLoading(false);
    };

    loadInvite();
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
    const credentials = await getUserCredentials();
    if (credentials && credentials[username.trim()]) {
      setError('Username already exists. Please choose a different username.');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);

    // Use the stored valid token
    if (!validToken) {
      setError('Invalid invite token. Please refresh the page and try again.');
      setSubmitting(false);
      return;
    }
    
    const tokenToUse = validToken;

    try {
      // Save credentials
      const result = await saveUserCredentials(username.trim(), password, tokenToUse);
      
      if (!result || !result.success) {
        setError(result?.error || 'Failed to create account');
        setSubmitting(false);
        return;
      }

      // Mark invite as used
      await markInviteUsed(tokenToUse, username.trim());

      // Redirect to login
      router.push('/login?registered=true');
    } catch (error) {
      console.error('Error creating account:', error);
      setError('Failed to create account. Please try again.');
      setSubmitting(false);
    }
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
            <div className="flex justify-center mb-4">
              <img 
                src="/logo.webp" 
                alt="Family Bowl Logo" 
                className="h-16 w-auto"
              />
            </div>
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
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.webp" 
              alt="Family Bowl Logo" 
              className="h-16 w-auto"
            />
          </div>
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

