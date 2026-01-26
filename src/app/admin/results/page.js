'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getBets, arePicksLocked } from '../../../lib/storage';
import { getBetResults, saveBetResult, deleteBetResult } from '../../../lib/storage';
import { getBetTypes } from '../../../lib/storage';
import { getBetOptions, getBetOptionLabel } from '../../../utils/constants';
import AlertDialog from '../../../components/AlertDialog';
import Alert from '../../../components/Alert';
import { useDialog, useAlert } from '../../../hooks/useDialog';

export default function AdminResultsPage() {
  const router = useRouter();
  const [bets, setBets] = useState([]);
  const [betTypes, setBetTypes] = useState([]);
  const [results, setResults] = useState({});
  const [editingBetId, setEditingBetId] = useState(null);
  const [resultValue, setResultValue] = useState('');
  const [picksLocked, setPicksLocked] = useState(false);
  const { dialogState, showDialog, hideDialog } = useDialog();
  const { alertState, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const loadData = async () => {
      const [betsData, betTypesData, resultsData, locked] = await Promise.all([
        getBets(),
        getBetTypes(),
        getBetResults(),
        arePicksLocked()
      ]);
      setBets(betsData);
      setBetTypes(betTypesData);
      setResults(resultsData);
      setPicksLocked(locked);
    };
    loadData();
  }, []);

  const handleSetResult = (bet) => {
    const existingResult = results[bet.id];
    setResultValue(existingResult || '');
    setEditingBetId(bet.id);
  };

  const handleSaveResult = async (betId) => {
    if (!resultValue.trim()) {
      showAlert('Please enter a result value', 'error');
      return;
    }
    
    const success = await saveBetResult(betId, resultValue.trim());
    if (success) {
      const updatedResults = { ...results, [betId]: resultValue.trim() };
      setResults(updatedResults);
      setEditingBetId(null);
      setResultValue('');
      showAlert('Result saved successfully.', 'success');
    } else {
      showAlert('Failed to save result', 'error');
    }
  };

  const handleDeleteResult = (betId) => {
    showDialog({
      title: 'Delete Result',
      message: 'Are you sure you want to delete this result?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const success = await deleteBetResult(betId);
        if (success) {
          const updatedResults = { ...results };
          delete updatedResults[betId];
          setResults(updatedResults);
          showAlert('Result deleted successfully.', 'success');
        } else {
          showAlert('Failed to delete result', 'error');
        }
      }
    });
  };

  const handleCancel = () => {
    setEditingBetId(null);
    setResultValue('');
  };

  if (!picksLocked) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#1A1A1A] py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#FFD700]/20 dark:bg-yellow-600/20 border-4 border-[#FFD700] dark:border-yellow-600 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                Picks Must Be Locked
              </h2>
              <p className="text-gray-900 dark:text-white font-bold">
                You can only set bet results after picks have been locked. Please lock all picks first from the admin dashboard.
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
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
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#1A1A1A] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.webp" 
                alt="Family Bowl Logo" 
                className="h-12 w-auto drop-shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                  Set Bet Results
                </h1>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  Enter the correct result for each bet. Results will be displayed in the view all picks table.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-5 py-3 text-gray-700 dark:text-gray-300 hover:text-[#0D4F3C] dark:hover:text-green-400 rounded-xl text-sm font-black uppercase tracking-wider border-4 border-gray-400 dark:border-gray-600 hover:border-[#0D4F3C] dark:hover:border-green-500 transition-all"
            >
              Back to Dashboard
            </button>
          </div>

          {bets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-8 text-center text-gray-700 dark:text-gray-300 font-bold">
              <p>No bets have been created yet.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 overflow-hidden">
              <div className="divide-y-4 divide-gray-300 dark:divide-gray-700">
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
                          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase">
                            {bet.question}
                          </h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 font-semibold">
                            Type: {betType ? betType.label : bet.type}
                          </p>
                          
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
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
                                    className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                                  />
                                ) : options.length > 0 ? (
                                  <select
                                    value={resultValue}
                                    onChange={(e) => setResultValue(e.target.value)}
                                    className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
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
                                    className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                                  />
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveResult(bet.id)}
                                  className="px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="px-5 py-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-xl font-black uppercase tracking-wider border-4 border-gray-400 dark:border-gray-600"
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
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">Result:</span>
                                    <span className="px-4 py-2 bg-[#10B981]/20 dark:bg-[#10B981]/20 border-4 border-[#10B981] dark:border-[#10B981] text-[#10B981] dark:text-[#10B981] rounded-xl font-bold">
                                      {getBetOptionLabel(bet.type, currentResult, bet.teamNames, betTypes)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleSetResult(bet)}
                                    className="px-4 py-2 text-sm bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResult(bet.id)}
                                    className="px-4 py-2 text-sm bg-gradient-to-r from-[#EF4444] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleSetResult(bet)}
                                  className="px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
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

          <div className="mt-6 p-4 bg-[#0D4F3C]/20 dark:bg-green-700/20 border-4 border-[#0D4F3C] dark:border-green-600 rounded-xl">
            <p className="text-sm text-gray-900 dark:text-white font-bold">
              <strong className="uppercase">Note:</strong> Once you set a result for a bet, it will appear in the "View All Picks" table. 
              Correct picks will be highlighted in green, and incorrect picks will be highlighted in red. 
              Users will see their point totals in the summary row.
            </p>
          </div>
        </div>
      </div>
      
      {/* Custom Dialogs */}
      <AlertDialog
        isOpen={dialogState.isOpen}
        onClose={hideDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        type={dialogState.type}
      />
      <Alert
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        message={alertState.message}
        type={alertState.type}
        duration={alertState.duration}
      />
    </ProtectedRoute>
  );
}

