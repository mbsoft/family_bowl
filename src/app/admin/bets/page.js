'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getBets, saveBets } from '../../../lib/storage';
import { getBetTypes, saveBetTypes } from '../../../lib/storage';
import { DEFAULT_BET_TYPES } from '../../../utils/constants';
import AlertDialog from '../../../components/AlertDialog';
import Alert from '../../../components/Alert';
import { useDialog, useAlert } from '../../../hooks/useDialog';

export default function AdminBetsPage() {
  const router = useRouter();
  const [bets, setBets] = useState([]);
  const [betTypes, setBetTypes] = useState([]);
  const [editingBet, setEditingBet] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    type: '',
    teamNames: { option1: '', option2: '' }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const loadData = async () => {
      try {
        const [loadedBets, loadedTypes] = await Promise.all([
          getBets(),
          getBetTypes()
        ]);
        setBets(loadedBets || []);
        
        // Initialize with defaults if none exist
        let types = loadedTypes || [];
        if (types.length === 0) {
          types = DEFAULT_BET_TYPES;
          try {
            await saveBetTypes(types);
          } catch (saveError) {
            console.error('Failed to save default bet types:', saveError);
            // Continue with defaults even if save fails
          }
        }
        setBetTypes(types);
        
        // Set default type if form is empty
        if (types.length > 0 && !formData.type) {
          setFormData(prev => ({ ...prev, type: types[0].id }));
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setBets([]);
        setBetTypes(DEFAULT_BET_TYPES);
      }
    };
    loadData();
  }, []);

  const loadBetTypes = async () => {
    try {
      let types = await getBetTypes();
      // Initialize with defaults if none exist
      if (!types || types.length === 0) {
        types = DEFAULT_BET_TYPES;
        try {
          await saveBetTypes(types);
        } catch (saveError) {
          console.error('Failed to save default bet types:', saveError);
          // Continue with defaults even if save fails
        }
      }
      setBetTypes(types || []);
      // Set default type if form is empty
      if (types && types.length > 0 && !formData.type) {
        setFormData(prev => ({ ...prev, type: types[0].id }));
      }
    } catch (error) {
      console.error('Failed to load bet types:', error);
      // Fallback to defaults on error
      setBetTypes(DEFAULT_BET_TYPES);
    }
  };

  const handleAdd = async () => {
    // Reload bet types to ensure we have the latest
    await loadBetTypes();
    const currentTypes = betTypes.length > 0 ? betTypes : DEFAULT_BET_TYPES;
    
    setFormData({
      question: '',
      type: currentTypes.length > 0 ? currentTypes[0].id : '',
      teamNames: { option1: '', option2: '' }
    });
    setEditingBet(null);
    setShowAddForm(true);
  };

  const handleEdit = (bet) => {
    setFormData({
      question: bet.question,
      type: bet.type,
      teamNames: bet.teamNames || { option1: '', option2: '' }
    });
    setEditingBet(bet);
    setShowAddForm(true);
  };

  const handleDelete = (betId) => {
    showDialog({
      title: 'Delete Bet',
      message: 'Are you sure you want to delete this bet?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const updatedBets = bets.filter(bet => bet.id !== betId);
        setBets(updatedBets);
        await saveBets(updatedBets);
        showAlert('Bet deleted successfully.', 'success');
      }
    });
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return; // Already at the top
    const updatedBets = [...bets];
    [updatedBets[index - 1], updatedBets[index]] = [updatedBets[index], updatedBets[index - 1]];
    setBets(updatedBets);
    await saveBets(updatedBets);
  };

  const handleMoveDown = async (index) => {
    if (index === bets.length - 1) return; // Already at the bottom
    const updatedBets = [...bets];
    [updatedBets[index], updatedBets[index + 1]] = [updatedBets[index + 1], updatedBets[index]];
    setBets(updatedBets);
    await saveBets(updatedBets);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let updatedBets;

    if (editingBet) {
      // Update existing bet
      updatedBets = bets.map(bet =>
        bet.id === editingBet.id
          ? {
              ...editingBet,
              question: formData.question,
              type: formData.type,
              teamNames: selectedBetType?.requiresTeamNames ? formData.teamNames : undefined
            }
          : bet
      );
    } else {
      // Add new bet
      const newBet = {
        id: `bet-${Date.now()}`,
        question: formData.question,
        type: formData.type,
        teamNames: selectedBetType?.requiresTeamNames ? formData.teamNames : undefined,
        createdAt: Date.now()
      };
      updatedBets = [...bets, newBet];
    }

    try {
      setBets(updatedBets);
      const success = await saveBets(updatedBets);
      if (!success) {
        showAlert('Failed to save bet. Please try again.', 'error');
        // Revert the state change on failure
        const reloadedBets = await getBets();
        setBets(reloadedBets);
        return;
      }
      showAlert('Bet saved successfully.', 'success');
    } catch (error) {
      console.error('Failed to save bet:', error);
      showAlert('An error occurred while saving the bet. Please try again.', 'error');
      // Revert the state change on error
      const reloadedBets = await getBets();
      setBets(reloadedBets);
      return;
    }
    setShowAddForm(false);
    setEditingBet(null);
    setFormData({
      question: '',
      type: betTypes.length > 0 ? betTypes[0].id : '',
      teamNames: { option1: '', option2: '' }
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingBet(null);
    setFormData({
      question: '',
      type: betTypes.length > 0 ? betTypes[0].id : '',
      teamNames: { option1: '', option2: '' }
    });
  };

  const selectedBetType = Array.isArray(betTypes) ? betTypes.find(bt => bt.id === formData.type) : null;

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
                  Manage Bets
                </h1>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  Add, edit, or delete prop bet questions
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="px-5 py-3 text-gray-700 dark:text-gray-300 hover:text-[#0D4F3C] dark:hover:text-green-400 rounded-xl text-sm font-black uppercase tracking-wider border-4 border-gray-400 dark:border-gray-600 hover:border-[#0D4F3C] dark:hover:border-green-500 transition-all"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleAdd}
                className="px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Add New Bet
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-6 mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
                {editingBet ? 'Edit Bet' : 'Add New Bet'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                    Question
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                    placeholder="Enter bet question"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                    Bet Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value, teamNames: { option1: '', option2: '' } })
                    }
                    className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                    required
                  >
                    {betTypes.length === 0 ? (
                      <option value="">No bet types available. Please configure bet types first.</option>
                    ) : (
                      betTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))
                    )}
                  </select>
                  {betTypes.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <a href="/admin/bet-types" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Go to Manage Bet Types
                      </a> to configure bet types.
                    </p>
                  )}
                </div>

                {selectedBetType && selectedBetType.requiresTeamNames && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                        Team 1 Name
                      </label>
                      <input
                        type="text"
                        value={formData.teamNames.option1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            teamNames: {
                              ...formData.teamNames,
                              option1: e.target.value
                            }
                          })
                        }
                        required
                        className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                        placeholder="e.g., KC"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                        Team 2 Name
                      </label>
                      <input
                        type="text"
                        value={formData.teamNames.option2}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            teamNames: {
                              ...formData.teamNames,
                              option2: e.target.value
                            }
                          })
                        }
                        required
                        className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                        placeholder="e.g., PHL"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    {editingBet ? 'Update Bet' : 'Add Bet'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-xl font-black uppercase tracking-wider border-4 border-gray-400 dark:border-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 overflow-hidden">
            {bets.length === 0 ? (
              <div className="p-8 text-center text-gray-700 dark:text-gray-300 font-bold">
                No bets configured. Click "Add New Bet" to get started.
              </div>
            ) : (
              <div className="divide-y-4 divide-gray-300 dark:divide-gray-700">
                {bets.map((bet, index) => (
                  <div
                    key={bet.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex flex-col gap-1 pt-1">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className={`p-1 rounded ${
                              index === 0
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title="Move up"
                          >
                            <svg
                              className="w-4 h-4 text-gray-600 dark:text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === bets.length - 1}
                            className={`p-1 rounded ${
                              index === bets.length - 1
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title="Move down"
                          >
                            <svg
                              className="w-4 h-4 text-gray-600 dark:text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase">
                              #{index + 1}
                            </span>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">
                              {bet.question}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Type: {Array.isArray(betTypes) ? betTypes.find(t => t.id === bet.type)?.label || bet.type : bet.type}
                            {bet.teamNames && (
                              <span className="ml-2">
                                ({bet.teamNames.option1} / {bet.teamNames.option2})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(bet)}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(bet.id)}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-[#EF4444] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

