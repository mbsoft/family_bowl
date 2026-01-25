'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generatePasswordResetToken } from '../../lib/storage';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      const result = await generatePasswordResetToken(username.trim());
      
      if (result.success) {
        if (result.token) {
          // Generate the reset link
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          const link = `${baseUrl}/reset-password/${result.token}`;
          setResetLink(link);
          setSuccess(true);
        } else {
          // User doesn't exist, but we don't reveal this for security
          setSuccess(true);
        }
      } else {
        setError(result.error || 'Failed to generate reset token');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (resetLink) {
      navigator.clipboard.writeText(resetLink);
      alert('Reset link copied to clipboard!');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] dark:bg-[#1A1A1A] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.webp" 
              alt="Family Bowl Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Forgot Password
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Enter your username to receive a password reset link
          </p>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
                {resetLink ? (
                  <div>
                    <p className="mb-2 font-medium">Password reset link generated!</p>
                    <p className="text-sm mb-3">Copy the link below and use it to reset your password. The link will expire in 24 hours.</p>
                    <div className="bg-white dark:bg-gray-700 p-3 rounded border border-green-300 dark:border-green-700 break-all text-xs font-mono">
                      {resetLink}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="mt-2 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                    >
                      Copy Link
                    </button>
                  </div>
                ) : (
                  <p>If an account exists with that username, a reset link would have been generated. Please check with an administrator if you need assistance.</p>
                )}
              </div>
              <Link
                href="/login"
                className="block w-full text-center px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                  placeholder="Enter your username"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white font-black py-4 px-6 rounded-xl uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Generating Reset Link...' : 'Generate Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

