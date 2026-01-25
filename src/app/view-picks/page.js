'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, isAdmin } from '../../lib/auth';
import { getAllSubmissions, getBets, arePicksLocked, getBetResults } from '../../lib/storage';
import { getBetTypes } from '../../lib/storage';
import { getBetOptionLabel } from '../../utils/constants';

export default function ViewPicksPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [bets, setBets] = useState([]);
  const [betTypes, setBetTypes] = useState([]);
  const [picksLocked, setPicksLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({});

  const loadData = () => {
    if (typeof window === 'undefined') {
      return;
    }
    setSubmissions(getAllSubmissions());
    setBets(getBets());
    setBetTypes(getBetTypes());
    setResults(getBetResults());
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Check if picks are locked
    const locked = arePicksLocked();
    setPicksLocked(locked);

    // If not locked and user is not admin, redirect to bets page
    // Admins can always view the table
    if (!locked && !isAdmin()) {
      router.push('/bets');
      return;
    }

    // Load data
    loadData();
    setLoading(false);

    // Refresh data when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    // Refresh data periodically (every 2 seconds) to catch updates
    const refreshInterval = setInterval(() => {
      loadData();
    }, 2000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Sort submissions alphabetically by username
  const sortedSubmissions = [...submissions].sort((a, b) =>
    a.username.localeCompare(b.username)
  );

  // Calculate points for each user
  const calculatePoints = (username) => {
    let points = 0;
    bets.forEach((bet) => {
      const result = results[bet.id];
      if (result) {
        const submission = submissions.find(s => s.username === username);
        if (submission && submission.selections[bet.id]) {
          const userSelection = submission.selections[bet.id];
          // Compare values (trim whitespace and ensure exact match)
          if (String(userSelection).trim() === String(result).trim()) {
            points += 1;
          }
        }
      }
    });
    return points;
  };

  // Check if a user's pick is correct
  const isCorrect = (betId, username) => {
    const result = results[betId];
    if (!result) return null; // No result set yet
    const submission = submissions.find(s => s.username === username);
    if (!submission || !submission.selections[betId]) return null; // No selection
    const userSelection = submission.selections[betId];
    // Compare values (trim whitespace and ensure exact match)
    return String(userSelection).trim() === String(result).trim();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                All Picks
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {picksLocked 
                  ? "View everyone's selections (picks are locked)"
                  : "View everyone's selections"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                Refresh
              </button>
              <button
                onClick={() => router.push(isAdmin() ? '/admin' : '/bets')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {isAdmin() ? 'Back to Admin Dashboard' : 'Back to My Picks'}
              </button>
            </div>
          </div>
        </div>

        {sortedSubmissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center text-gray-600 dark:text-gray-400">
            <p>No submissions yet.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-250px)]">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-30 border-r border-gray-200 dark:border-gray-600 shadow-[2px_0_4px_rgba(0,0,0,0.1)] min-w-[200px]">
                      Bet Question
                    </th>
                    {sortedSubmissions.map((submission) => (
                      <th
                        key={submission.username}
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]"
                      >
                        {submission.username}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Summary Points Row */}
                  <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold">
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white sticky left-0 bg-blue-50 dark:bg-blue-900/20 z-10 border-r border-gray-200 dark:border-gray-600 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                      Points
                    </td>
                    {sortedSubmissions.map((submission) => {
                      const points = calculatePoints(submission.username);
                      return (
                        <td
                          key={`points-${submission.username}`}
                          className="px-4 py-3 text-sm text-center font-bold text-gray-900 dark:text-white"
                        >
                          {points}
                        </td>
                      );
                    })}
                  </tr>
                  {bets.map((bet) => {
                    const hasResult = !!results[bet.id];
                    return (
                      <tr
                        key={bet.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-600 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                          <div className="flex items-center gap-2">
                            {bet.question}
                            {hasResult && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                (Result: {getBetOptionLabel(bet.type, results[bet.id], bet.teamNames, betTypes)})
                              </span>
                            )}
                          </div>
                        </td>
                        {sortedSubmissions.map((submission) => {
                          const selection = submission.selections[bet.id];
                          const label = selection
                            ? getBetOptionLabel(bet.type, selection, bet.teamNames, betTypes)
                            : '-';
                          const correct = isCorrect(bet.id, submission.username);
                          
                          // Determine cell background color
                          let bgColor = '';
                          let textColor = selection
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400 dark:text-gray-500 italic';
                          
                          if (hasResult && correct !== null) {
                            if (correct) {
                              bgColor = 'bg-green-100 dark:bg-green-900/30';
                              textColor = 'text-gray-900 dark:text-white font-semibold';
                            } else {
                              bgColor = 'bg-red-100 dark:bg-red-900/30';
                              textColor = 'text-gray-900 dark:text-white';
                            }
                          }
                          
                          return (
                            <td
                              key={`${bet.id}-${submission.username}`}
                              className={`px-4 py-3 text-sm whitespace-nowrap text-center ${bgColor} ${textColor}`}
                            >
                              {label}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400">
              Showing {sortedSubmissions.length} {sortedSubmissions.length === 1 ? 'user' : 'users'} and {bets.length} {bets.length === 1 ? 'bet' : 'bets'}
            </div>
          </div>
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
  );
}

