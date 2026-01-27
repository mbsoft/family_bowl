'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, isAdmin } from '../lib/auth';

/**
 * ProtectedRoute component - protects routes that require authentication
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if authenticated
 * @param {boolean} props.requireAdmin - Whether admin role is required
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (requireAdmin && !isAdmin()) {
      router.push('/bets');
      return;
    }
  }, [router]);

  // Don't render children until we've verified auth (client-side only)
  if (typeof window === 'undefined') {
    return null;
  }

  if (!isAuthenticated()) {
    return null;
  }

  if (requireAdmin && !isAdmin()) {
    return null;
  }

  return <>{children}</>;
}

