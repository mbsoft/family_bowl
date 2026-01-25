'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, getCurrentUsername } from '../../lib/auth';
import { getBets } from '../../lib/storage';
import { getSubmission, saveSubmission, arePicksLocked } from '../../lib/storage';
import { DEFAULT_BETS } from '../../utils/constants';
import BetInput from '../../components/BetInput';

export default function BetsPage() {
  const router = useRouter();
  const [bets, setBets] = useState([]);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [username, setUsername] = useState(null);
  const [picksLocked, setPicksLocked] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = getCurrentUsername();
    setUsername(currentUser);

    // Check if picks are locked
    setPicksLocked(arePicksLocked());

    // Load bets
    let loadedBets = getBets();
    if (loadedBets.length === 0) {
      // Initialize with default bets if none exist
      loadedBets = DEFAULT_BETS;
      // Note: We don't save defaults automatically - admin should configure
    }
    setBets(loadedBets);

    // Load existing submission if any
    if (currentUser) {
      const existingSubmission = getSubmission(currentUser);
      if (existingSubmission && existingSubmission.selections) {
        setSelections(existingSubmission.selections);
      }
    }

    setLoading(false);
  }, [router]);

  const handleSelectionChange = (betId, value) => {
    if (picksLocked) {
      return; // Don't allow changes if locked
    }
    setSelections((prev) => ({
      ...prev,
      [betId]: value
    }));
    setSubmitted(false);
  };

  const allBetsAnswered = bets.length > 0 && bets.every(bet => selections[bet.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (picksLocked) {
      return; // Don't allow submission if locked
    }
    if (!allBetsAnswered || !username) {
      return;
    }

    setSubmitting(true);

    const submission = {
      username,
      timestamp: Date.now(),
      selections
    };

    const success = saveSubmission(submission);
    setSubmitting(false);

    if (success) {
      setSubmitted(true);
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Super Bowl Prop Bets
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome, {username}! Make your selections below.
            </p>
          </div>

          {picksLocked && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Picks are LOCKED</strong>
                    <p className="text-sm mt-1">All picks have been locked by the administrator. You cannot modify your selections at this time.</p>
                  </div>
                </div>
                <Link
                  href="/view-picks"
                  className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  View All Picks
                </Link>
              </div>
            </div>
          )}

          {submitted && !picksLocked && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
              Your selections have been saved successfully! You can edit them at any time.
            </div>
          )}

          {bets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No bets have been configured yet.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Please contact an administrator to set up the prop bets.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={`space-y-6 ${picksLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                {bets.map((bet) => (
                  <BetInput
                    key={bet.id}
                    bet={bet}
                    value={selections[bet.id] || ''}
                    onChange={handleSelectionChange}
                    disabled={picksLocked}
                  />
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={!allBetsAnswered || submitting || picksLocked}
                  className={`
                    w-full py-3 px-6 rounded-lg font-medium transition-colors
                    ${
                      allBetsAnswered && !submitting && !picksLocked
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {picksLocked
                    ? 'Picks are Locked - Cannot Submit'
                    : submitting
                    ? 'Saving...'
                    : allBetsAnswered
                    ? 'Submit Selections'
                    : `Please answer all ${bets.length} bets to submit`}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('auth_user');
                  router.push('/login');
                }
              }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

