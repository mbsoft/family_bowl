'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, isAdmin } from '../lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Redirect based on role
    if (isAdmin()) {
      router.push('/admin');
    } else {
      router.push('/bets');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
    </div>
  );
}
