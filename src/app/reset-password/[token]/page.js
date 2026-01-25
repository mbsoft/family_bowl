'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPasswordResetToken, resetPassword } from '../../../lib/storage';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const rawToken = params?.token;
  const token = rawToken ? decodeURIComponent(String(rawToken)) : null;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [validToken, setValidToken] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Function to clean and normalize token
    const cleanToken = (rawToken) => {
      if (!rawToken) return null;
      let cleaned = String(rawToken).split('?')[0].split('#')[0];
      try {
        cleaned = decodeURIComponent(cleaned);
      } catch (e) {
        try {
          cleaned = decodeURI(cleaned);
        } catch (e2) {
          // Use as-is if all decoding fails
        }
      }
      return cleaned.trim();
    };

    // Function to validate reset token
    const validateToken = async (resetToken) => {
      if (!resetToken) {
        return null;
      }
      const cleanedToken = cleanToken(resetToken);
      if (!cleanedToken) {
        return null;
      }
      const tokenData = await getPasswordResetToken(cleanedToken);
      return tokenData ? { tokenData, token: cleanedToken } : null;
    };

    // Try multiple methods to extract the token
    const loadToken = async () => {
      let result = null;
      
      // Method 1: Use token from Next.js params
      if (token) {
        result = await validateToken(token);
      }

      // Method 2: Extract from URL pathname
      if (!result && typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/');
        const urlToken = pathParts[pathParts.length - 1];
        if (urlToken && urlToken !== 'reset-password' && urlToken !== '') {
          result = await validateToken(urlToken);
        }
      }

      // Method 3: Extract from full URL
      if (!result && typeof window !== 'undefined') {
        const fullUrl = window.location.href;
        const resetMatch = fullUrl.match(/\/reset-password\/([^/?&#]+)/);
        if (resetMatch && resetMatch[1]) {
          result = await validateToken(resetMatch[1]);
        }
      }

      if (!result || !result.tokenData) {
        setError('Invalid or expired reset link');
        setLoading(false);
        return;
      }

      const { tokenData, token: validToken } = result;
      setValidToken(validToken);
      setUsername(tokenData.username);
      setTokenValid(true);
      setLoading(false);
    };

    loadToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
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

    if (!validToken) {
      setError('Invalid reset token. Please refresh the page and try again.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await resetPassword(validToken, password);
      
      if (result && result.success) {
        // Redirect to login with success message
        router.push('/login?reset=success');
      } else {
        setError(result?.error || 'Failed to reset password');
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] dark:bg-[#1A1A1A]">
        <div className="text-lg font-bold text-gray-700 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/logo.webp" 
                alt="Family Bowl Logo" 
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Invalid Reset Link
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              {error || 'This reset link is invalid or has expired. Reset links expire after 24 hours.'}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white font-black py-3 px-6 rounded-xl uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
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
            Reset Password
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-2">
            Reset password for: <span className="font-semibold">{username}</span>
          </p>
          <p className="text-center text-sm text-gray-500 dark:text-gray-500 mb-8">
            Enter your new password below
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
                className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                placeholder="Enter new password (min 4 characters)"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={4}
                className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                placeholder="Confirm your new password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

