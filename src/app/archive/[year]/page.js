'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, isAdmin } from '../../../lib/auth';
import { getArchiveData } from '../../../lib/storage';
import { getBetTypes } from '../../../lib/storage';
import { getBetOptionLabel } from '../../../utils/constants';
import SuperBowlLogo from '../../../components/SuperBowlLogo';

export default function ArchivePage() {
  const router = useRouter();
  const params = useParams();
  const year = params?.year ? parseInt(params.year, 10) : null;
  const [archiveData, setArchiveData] = useState(null);
  const [betTypes, setBetTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (!year || isNaN(year)) {
      router.push('/bets');
      return;
    }

    loadArchiveData();
  }, [year, router]);

  const loadArchiveData = async () => {
    try {
      const [data, types] = await Promise.all([
        getArchiveData(year),
        getBetTypes()
      ]);

      if (!data) {
        // Archive doesn't exist, redirect
        router.push('/bets');
        return;
      }

      setArchiveData(data);
      setBetTypes(types || []);
    } catch (error) {
      console.error('Error loading archive data:', error);
      router.push('/bets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!archiveData) {
    return null;
  }

  const { bets, submissions, results } = archiveData;

  // Calculate points for each user first (needed for sorting)
  const calculatePointsForSorting = (username) => {
    let points = 0;
    bets.forEach((bet) => {
      const result = results[bet.id];
      if (result) {
        const submission = submissions.find(s => s.username === username);
        if (submission && submission.selections[bet.id]) {
          const userSelection = submission.selections[bet.id];
          if (String(userSelection).trim() === String(result).trim()) {
            points += 1;
          }
        }
      }
    });
    return points;
  };

  // Determine winner first
  const determineWinnerForSorting = () => {
    // Calculate points even if not all bets have results
    const userPoints = submissions.map(submission => ({
      username: submission.username,
      points: calculatePointsForSorting(submission.username)
    }));

    // If no one has any points, return null
    const maxPoints = Math.max(...userPoints.map(u => u.points), 0);
    if (maxPoints === 0) return null;

    const topUsers = userPoints.filter(u => u.points === maxPoints);

    if (topUsers.length === 1) {
      return topUsers[0].username;
    }

    // Tie-breaker logic
    if (topUsers.length > 1) {
      const tieBreakerBet = bets.find(bet => 
        bet.question.toLowerCase().startsWith('tie breaker')
      );

      if (!tieBreakerBet || !results[tieBreakerBet.id]) {
        // No tie-breaker, return first user alphabetically from tied users
        return topUsers.sort((a, b) => a.username.localeCompare(b.username))[0].username;
      }

      const tieBreakerResult = parseInt(results[tieBreakerBet.id], 10);
      if (isNaN(tieBreakerResult)) {
        return topUsers.sort((a, b) => a.username.localeCompare(b.username))[0].username;
      }

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

  const winnerForSorting = determineWinnerForSorting();

  // Sort submissions: winner first, then by descending point totals
  const sortedSubmissions = Array.isArray(submissions)
    ? [...submissions].sort((a, b) => {
        // Winner always comes first
        if (winnerForSorting) {
          if (a.username === winnerForSorting) return -1;
          if (b.username === winnerForSorting) return 1;
        }
        // Then sort by descending point totals
        const pointsA = calculatePointsForSorting(a.username);
        const pointsB = calculatePointsForSorting(b.username);
        if (pointsB !== pointsA) {
          return pointsB - pointsA; // Descending order
        }
        // If points are equal, sort alphabetically as tiebreaker
        return a.username.localeCompare(b.username);
      })
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
    if (!result) return null;
    const submission = submissions.find(s => s.username === username);
    if (!submission || !submission.selections[betId]) return null;
    const userSelection = submission.selections[betId];
    return String(userSelection).trim() === String(result).trim();
  };

  // Use the winner determined for sorting
  const winner = winnerForSorting;

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#1A1A1A] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <SuperBowlLogo year={year} size={60} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                  {year} Archive
                </h1>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-semibold">
                  Historical Super Bowl prop bet results
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href={isAdmin() ? "/admin/archive" : "/archive"}
                className="px-5 py-3 text-gray-700 dark:text-gray-300 hover:text-[#0D4F3C] dark:hover:text-green-400 rounded-xl text-sm font-black uppercase tracking-wider border-4 border-gray-400 dark:border-gray-600 hover:border-[#0D4F3C] dark:hover:border-green-500 transition-all text-center"
              >
                All Archives
              </Link>
              <button
                onClick={() => router.push(isAdmin() ? '/admin' : '/bets')}
                className="px-5 py-3 text-gray-700 dark:text-gray-300 hover:text-[#0D4F3C] dark:hover:text-green-400 rounded-xl text-sm font-black uppercase tracking-wider border-4 border-gray-400 dark:border-gray-600 hover:border-[#0D4F3C] dark:hover:border-green-500 transition-all"
              >
                {isAdmin() ? 'Back to Admin' : 'Back to My Picks'}
              </button>
            </div>
          </div>
        </div>

        {sortedSubmissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-8 text-center text-gray-700 dark:text-gray-300 font-bold">
            <p>No submissions found for this archive.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-250px)]">
              <table className="w-full min-w-full">
                <thead className="bg-[#0D4F3C] dark:bg-green-700 sticky top-0 z-20">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-black text-white uppercase tracking-wider sticky left-0 bg-[#0D4F3C] dark:bg-green-700 z-30 border-r-4 border-green-600 dark:border-green-500 shadow-[2px_0_4px_rgba(0,0,0,0.1)] min-w-[150px] sm:min-w-[200px]">
                      Bet Question
                    </th>
                    {sortedSubmissions.map((submission) => {
                      const isWinner = winner === submission.username;
                      return (
                        <th
                          key={submission.username}
                          className={`px-2 sm:px-4 py-3 text-center text-xs font-black uppercase tracking-wider min-w-[100px] sm:min-w-[120px] ${
                            isWinner
                              ? 'bg-[#FFD700] dark:bg-yellow-600 text-gray-900 dark:text-white'
                              : 'text-white dark:text-gray-200'
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
                  <tr className="bg-[#0D4F3C]/20 dark:bg-green-700/30 font-black">
                    <td className="px-4 py-3 text-sm font-black text-gray-900 dark:text-white sticky left-0 bg-[#0D4F3C]/20 dark:bg-green-700/30 z-10 border-r-4 border-gray-300 dark:border-gray-600 shadow-[2px_0_4px_rgba(0,0,0,0.1)] uppercase">
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
              Showing {sortedSubmissions.length} {sortedSubmissions.length === 1 ? 'user' : 'users'} and {bets.length} {bets.length === 1 ? 'bet' : 'bets'} from {year}
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
