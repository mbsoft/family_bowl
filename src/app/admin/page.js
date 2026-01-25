'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getBets } from '../../lib/storage';
import { getAllSubmissions } from '../../lib/storage';
import { arePicksLocked, setPicksLocked } from '../../lib/storage';
import { getCurrentUsername } from '../../lib/auth';

export default function AdminDashboard() {
  const [bets, setBets] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [username, setUsername] = useState(null);
  const [picksLocked, setPicksLockedState] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const loadData = async () => {
      setUsername(getCurrentUsername());
      const [betsData, submissionsData, locked] = await Promise.all([
        getBets(),
        getAllSubmissions(),
        arePicksLocked()
      ]);
      setBets(betsData || []);
      setSubmissions(submissionsData || []);
      setPicksLockedState(locked || false);
    };
    loadData();
  }, []);

  const handleToggleLock = async () => {
    const newLockStatus = !picksLocked;
    if (confirm(
      newLockStatus
        ? 'Are you sure you want to LOCK all picks? Users will not be able to modify their submissions.'
        : 'Are you sure you want to UNLOCK all picks? Users will be able to modify their submissions again.'
    )) {
      const success = await setPicksLocked(newLockStatus);
      if (success) {
        setPicksLockedState(newLockStatus);
      } else {
        alert('Failed to update lock status. Please try again.');
      }
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src="/logo.webp" 
                alt="Family Bowl Logo" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome, {username}! Manage bets and view submissions.
                </p>
              </div>
            </div>
          </div>

          {/* Lock Status Banner */}
          <div className={`mb-6 rounded-lg shadow p-4 ${
            picksLocked
              ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold mb-1 ${
                  picksLocked
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-green-700 dark:text-green-400'
                }`}>
                  Picks Status: {picksLocked ? 'LOCKED' : 'UNLOCKED'}
                </h3>
                <p className={`text-sm ${
                  picksLocked
                    ? 'text-red-600 dark:text-red-300'
                    : 'text-green-600 dark:text-green-300'
                }`}>
                  {picksLocked
                    ? 'Users cannot modify their picks. All submissions are locked.'
                    : 'Users can modify their picks. Submissions are open for editing.'}
                </p>
              </div>
              <button
                onClick={handleToggleLock}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  picksLocked
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {picksLocked ? 'Unlock Picks' : 'Lock All Picks'}
              </button>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statistics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Bets
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {bets.length}
                </p>
              </div>
              <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-700 pt-4 sm:pt-0 sm:pl-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Submissions
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {submissions.length}
                </p>
              </div>
              <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-700 pt-4 sm:pt-0 sm:pl-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Completion Rate
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {bets.length > 0 && submissions.length > 0
                    ? `${Math.round((submissions.length / bets.length) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/admin/invites"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Manage Invites
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Generate and manage invite links for new users.
              </p>
            </Link>

            <Link
              href="/admin/users"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Manage Users
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                View and delete registered users.
              </p>
            </Link>

            <Link
              href="/admin/bet-types"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Manage Bet Types
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Define and configure bet type options and labels.
              </p>
            </Link>

            <Link
              href="/admin/bets"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Manage Bets
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add, edit, or delete prop bet questions.
              </p>
            </Link>

            <Link
              href="/admin/submissions"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                View Submissions
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Review and edit all user submissions.
              </p>
            </Link>

            <Link
              href="/admin/export"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Export Data
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Download all submissions as an Excel spreadsheet.
              </p>
            </Link>

            <Link
              href="/admin/results"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Set Bet Results
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enter correct results for each bet (requires picks to be locked).
              </p>
            </Link>

            <Link
              href="/view-picks"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                View All Picks
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                View everyone's picks in a table format with scoring.
              </p>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('auth_user');
                  window.location.href = '/login';
                }
              }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

