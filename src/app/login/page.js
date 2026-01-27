'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, isAuthenticated } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    // Check if user just registered or reset password
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
        setTimeout(() => setRegistered(true), 0);
      }
      if (params.get('reset') === 'success') {
        setTimeout(() => setRegistered(true), 0); // Reuse the registered state to show success
      }
    }

    // Redirect if already authenticated
    if (isAuthenticated()) {
      const user = JSON.parse(localStorage.getItem('auth_user'));
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/bets');
      }
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);

    if (result.success) {
      // Redirect based on role
      if (result.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/bets');
      }
    } else {
      setError(result.error || 'Invalid credentials');
      setLoading(false);
    }
    } catch (error) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] dark:bg-[#1A1A1A] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.webp" 
              alt="Family Bowl Logo" 
              className="h-20 w-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-black text-center mb-2 text-gray-900 dark:text-white uppercase tracking-tight">
            {process.env.NEXT_PUBLIC_APP_TITLE || 'Super Bowl Prop Bet Tracker'}
          </h1>
          <p className="text-center text-gray-700 dark:text-gray-300 mb-8 font-semibold">
            Please log in to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {registered && (
              <div className="bg-[#10B981]/20 dark:bg-[#10B981]/20 border-3 border-[#10B981] dark:border-[#10B981] text-[#10B981] dark:text-[#10B981] px-4 py-3 rounded-xl font-bold">
                {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reset') === 'success'
                  ? 'Password reset successfully! Please log in with your new password.'
                  : 'Account created successfully! Please log in with your credentials.'}
              </div>
            )}
            {error && (
              <div className="bg-[#EF4444]/20 dark:bg-[#EF4444]/20 border-3 border-[#EF4444] dark:border-[#EF4444] text-[#EF4444] dark:text-[#EF4444] px-4 py-3 rounded-xl font-bold">
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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white font-black py-4 px-6 rounded-xl uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400 font-semibold">
            <p>Log in with your username and password</p>
            <p className="mt-2 text-xs">
              Need an account? Contact &apos;Uncle Jim&apos; for an invite link.
            </p>
            <Link
              href="/forgot-password"
              className="mt-4 block text-sm text-[#0D4F3C] dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-bold"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

