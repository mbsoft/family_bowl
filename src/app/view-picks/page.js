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

  const loadData = async () => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const [submissionsData, betsData, betTypesData, resultsData] = await Promise.all([
        getAllSubmissions(),
        getBets(),
        getBetTypes(),
        getBetResults()
      ]);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      setBets(Array.isArray(betsData) ? betsData : []);
      setBetTypes(Array.isArray(betTypesData) ? betTypesData : []);
      setResults(resultsData || {});
    } catch (error) {
      console.error('Error loading data:', error);
      setSubmissions([]);
      setBets([]);
      setBetTypes([]);
      setResults({});
    }
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

    // Load data and check lock status
    const initializeData = async () => {
      try {
        // Check if picks are locked
        const locked = await arePicksLocked();
        setPicksLocked(locked);

        // If not locked and user is not admin, redirect to bets page
        // Admins can always view the table
        if (!locked && !isAdmin()) {
          router.push('/bets');
          return;
        }

        // Load data
        await loadData();
        setLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false);
      }
    };

    initializeData();

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
  const sortedSubmissions = Array.isArray(submissions)
    ? [...submissions].sort((a, b) =>
        a.username.localeCompare(b.username)
      )
    : [];

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

  // Determine the winner
  const determineWinner = () => {
    // Only determine winner if bets are locked and all results are defined
    if (!picksLocked) return null;
    
    // Check if all bets have results
    const allBetsHaveResults = bets.length > 0 && bets.every(bet => results[bet.id]);
    if (!allBetsHaveResults) return null;

    // Calculate points for each user
    const userPoints = sortedSubmissions.map(submission => ({
      username: submission.username,
      points: calculatePoints(submission.username)
    }));

    // Find the maximum points
    const maxPoints = Math.max(...userPoints.map(u => u.points));
    
    // Find all users with max points
    const topUsers = userPoints.filter(u => u.points === maxPoints);

    // If only one winner, return it
    if (topUsers.length === 1) {
      return topUsers[0].username;
    }

    // Tie-breaker logic
    if (topUsers.length > 1) {
      // Find the tie breaker bet (question starts with "Tie Breaker")
      const tieBreakerBet = bets.find(bet => 
        bet.question.toLowerCase().startsWith('tie breaker')
      );

      if (!tieBreakerBet || !results[tieBreakerBet.id]) {
        // No tie breaker or no result, return first user (alphabetical)
        return topUsers[0].username;
      }

      const tieBreakerResult = parseInt(results[tieBreakerBet.id], 10);
      if (isNaN(tieBreakerResult)) {
        // Tie breaker result is not a number, return first user
        return topUsers[0].username;
      }

      // Find the user with the closest answer to the tie breaker result
      let winner = topUsers[0].username;
      let closestDiff = Infinity;

      topUsers.forEach(user => {
        const submission = submissions.find(s => s.username === user.username);
        if (submission && submission.selections[tieBreakerBet.id]) {
          const userAnswer = parseInt(submission.selections[tieBreakerBet.id], 10);
          if (!isNaN(userAnswer)) {
            const diff = Math.abs(userAnswer - tieBreakerResult);
            if (diff < closestDiff) {
              closestDiff = diff;
              winner = user.username;
            }
          }
        }
      });

      return winner;
    }

    return null;
  };

  const winner = determineWinner();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  All Picks
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {picksLocked 
                    ? "View everyone's selections (picks are locked)"
                    : "View everyone's selections"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => loadData()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  Refresh
                </button>
                <button
                  onClick={() => router.push(isAdmin() ? '/admin' : '/bets')}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600"
                >
                  {isAdmin() ? 'Back to Admin' : 'Back to My Picks'}
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
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-30 border-r border-gray-200 dark:border-gray-600 shadow-[2px_0_4px_rgba(0,0,0,0.1)] min-w-[150px] sm:min-w-[200px]">
                      Bet Question
                    </th>
                    {sortedSubmissions.map((submission) => {
                      const isWinner = winner === submission.username;
                      return (
                        <th
                          key={submission.username}
                          className={`px-2 sm:px-4 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[100px] sm:min-w-[120px] ${
                            isWinner
                              ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 font-bold'
                              : 'text-gray-500 dark:text-gray-300'
                          }`}
                        >
                          {submission.username}
                          {isWinner && (
                            <span className="ml-1" title="Winner! 🏆" aria-label="Winner">
                              🏆
                            </span>
                          )}
                        </th>
                      );
                    })}
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
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-600 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="break-words">{bet.question}</span>
                            {hasResult && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
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
                              className={`px-2 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap text-center ${bgColor} ${textColor}`}
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

