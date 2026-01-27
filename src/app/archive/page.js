'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, isAdmin } from '../../lib/auth';
import { getArchiveYears, getArchiveData } from '../../lib/storage';
import SuperBowlLogo from '../../components/SuperBowlLogo';
import { getSuperBowlNumber, toRomanNumeral } from '../../utils/superbowlLogos';

export default function ArchiveIndexPage() {
  const router = useRouter();
  const [archiveYears, setArchiveYears] = useState([]);
  const [winners, setWinners] = useState({}); // Map of year -> winner username
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

    // Redirect admins to Archive Management
    if (isAdmin()) {
      router.push('/admin/archive');
      return;
    }

    loadArchiveYears();
  }, [router]);

  const loadArchiveYears = async () => {
    try {
      const years = await getArchiveYears();
      setArchiveYears(years || []);
      
      // Load winners for each year
      const winnersMap = {};
      for (const yearData of (years || [])) {
        try {
          const archiveData = await getArchiveData(yearData.year);
          if (archiveData) {
            const winner = determineWinner(archiveData);
            if (winner) {
              winnersMap[yearData.year] = winner;
            }
          }
        } catch (error) {
          console.error(`Error loading winner for year ${yearData.year}:`, error);
        }
      }
      setWinners(winnersMap);
    } catch (error) {
      console.error('Error loading archive years:', error);
      setArchiveYears([]);
    } finally {
      setLoading(false);
    }
  };

  // Determine winner from archive data (similar logic to archive detail page)
  const determineWinner = (archiveData) => {
    const { bets, submissions, results } = archiveData;
    
    if (!bets || !submissions || !results) {
      return null;
    }

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

    const userPoints = submissions.map(submission => ({
      username: submission.username,
      points: calculatePoints(submission.username)
    }));

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#1A1A1A] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                  Archive
                </h1>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-semibold">
                  View historical Super Bowl prop bet results
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => router.push('/bets')}
                className="px-5 py-3 text-gray-700 dark:text-gray-300 hover:text-[#0D4F3C] dark:hover:text-green-400 rounded-xl text-sm font-black uppercase tracking-wider border-4 border-gray-400 dark:border-gray-600 hover:border-[#0D4F3C] dark:hover:border-green-500 transition-all"
              >
                Back to My Picks
              </button>
            </div>
          </div>
        </div>

        {archiveYears.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4 font-semibold">
              No archived years yet.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Historical results will appear here once they are archived.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">
                Archived Years
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archiveYears.map((yearData) => {
                  const winner = winners[yearData.year];
                  return (
                    <Link
                      key={yearData.year}
                      href={`/archive/${yearData.year}`}
                      className="block p-6 bg-gradient-to-br from-[#0D4F3C] to-green-700 dark:from-green-600 dark:to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 dark:hover:from-green-700 dark:hover:to-green-800 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <div className="text-center">
                        <div className="flex justify-center mb-3">
                          <SuperBowlLogo year={yearData.year} size={80} />
                        </div>
                        <div className="text-2xl font-black text-white mb-1">
                          {yearData.year}
                        </div>
                        <div className="text-sm text-green-100 dark:text-green-200 font-semibold">
                          Super Bowl {getSuperBowlNumber(yearData.year)}
                        </div>
                        {winner && (
                          <div className="mt-4 mb-2">
                            <div className="text-3xl mb-2">🏆</div>
                            <div className="text-xl text-[#FFD700] dark:text-yellow-300 font-black uppercase tracking-wide">
                              {winner}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-green-200 dark:text-green-300 mt-2">
                          Archived {new Date(yearData.created_at * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
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

