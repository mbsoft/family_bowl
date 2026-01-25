'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getBets, arePicksLocked } from '../../../lib/storage';
import { getBetResults, saveBetResult, deleteBetResult } from '../../../lib/storage';
import { getBetTypes } from '../../../lib/storage';
import { getBetOptions, getBetOptionLabel } from '../../../utils/constants';

export default function AdminResultsPage() {
  const router = useRouter();
  const [bets, setBets] = useState([]);
  const [betTypes, setBetTypes] = useState([]);
  const [results, setResults] = useState({});
  const [editingBetId, setEditingBetId] = useState(null);
  const [resultValue, setResultValue] = useState('');
  const [picksLocked, setPicksLocked] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setBets(getBets());
    setBetTypes(getBetTypes());
    setResults(getBetResults());
    setPicksLocked(arePicksLocked());
  }, []);

  const handleSetResult = (bet) => {
    const existingResult = results[bet.id];
    setResultValue(existingResult || '');
    setEditingBetId(bet.id);
  };

  const handleSaveResult = (betId) => {
    if (!resultValue.trim()) {
      alert('Please enter a result value');
      return;
    }
    
    if (saveBetResult(betId, resultValue.trim())) {
      const updatedResults = { ...results, [betId]: resultValue.trim() };
      setResults(updatedResults);
      setEditingBetId(null);
      setResultValue('');
    } else {
      alert('Failed to save result');
    }
  };

  const handleDeleteResult = (betId) => {
    if (confirm('Are you sure you want to delete this result?')) {
      if (deleteBetResult(betId)) {
        const updatedResults = { ...results };
        delete updatedResults[betId];
        setResults(updatedResults);
      } else {
        alert('Failed to delete result');
      }
    }
  };

  const handleCancel = () => {
    setEditingBetId(null);
    setResultValue('');
  };

  if (!picksLocked) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                Picks Must Be Locked
              </h2>
              <p className="text-yellow-700 dark:text-yellow-400">
                You can only set bet results after picks have been locked. Please lock all picks first from the admin dashboard.
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Set Bet Results
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Enter the correct result for each bet. Results will be displayed in the view all picks table.
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Back to Dashboard
            </button>
          </div>

          {bets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center text-gray-600 dark:text-gray-400">
              <p>No bets have been created yet.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {bets.map((bet) => {
                  const betType = betTypes.find(bt => bt.id === bet.type);
                  const options = betType ? getBetOptions(bet.type, bet.teamNames, betTypes) : [];
                  const currentResult = results[bet.id];
                  const isEditing = editingBetId === bet.id;

                  return (
                    <div
                      key={bet.id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {bet.question}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Type: {betType ? betType.label : bet.type}
                          </p>
                          
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Result:
                                </label>
                                {betType?.isIntegerRange ? (
                                  <input
                                    type="number"
                                    value={resultValue}
                                    onChange={(e) => setResultValue(e.target.value)}
                                    min={betType.minValue}
                                    max={betType.maxValue}
                                    placeholder={`Enter integer between ${betType.minValue} and ${betType.maxValue}`}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  />
                                ) : options.length > 0 ? (
                                  <select
                                    value={resultValue}
                                    onChange={(e) => setResultValue(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  >
                                    <option value="">Select result...</option>
                                    {options.map((option) => (
                                      <option key={option} value={option}>
                                        {getBetOptionLabel(bet.type, option, bet.teamNames, betTypes)}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={resultValue}
                                    onChange={(e) => setResultValue(e.target.value)}
                                    placeholder="Enter result..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  />
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveResult(bet.id)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              {currentResult ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Result:</span>
                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-lg font-medium">
                                      {getBetOptionLabel(bet.type, currentResult, bet.teamNames, betTypes)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleSetResult(bet)}
                                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResult(bet.id)}
                                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleSetResult(bet)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                >
                                  Set Result
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Once you set a result for a bet, it will appear in the "View All Picks" table. 
              Correct picks will be highlighted in green, and incorrect picks will be highlighted in red. 
              Users will see their point totals in the summary row.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

