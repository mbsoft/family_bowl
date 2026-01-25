'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getBets, saveBets } from '../../../lib/storage';
import { getBetTypes, saveBetTypes } from '../../../lib/storage';
import { DEFAULT_BET_TYPES } from '../../../utils/constants';

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
    setBets(getBets());
    loadBetTypes();
  }, []);

  const loadBetTypes = () => {
    let types = getBetTypes();
    // Initialize with defaults if none exist
    if (types.length === 0) {
      types = DEFAULT_BET_TYPES;
      saveBetTypes(types);
    }
    setBetTypes(types);
    // Set default type if form is empty
    if (types.length > 0 && !formData.type) {
      setFormData(prev => ({ ...prev, type: types[0].id }));
    }
  };

  const handleAdd = () => {
    // Reload bet types to ensure we have the latest
    loadBetTypes();
    const currentTypes = getBetTypes();
    const defaultTypes = currentTypes.length > 0 ? currentTypes : DEFAULT_BET_TYPES;
    
    setFormData({
      question: '',
      type: defaultTypes.length > 0 ? defaultTypes[0].id : '',
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
    if (confirm('Are you sure you want to delete this bet?')) {
      const updatedBets = bets.filter(bet => bet.id !== betId);
      setBets(updatedBets);
      saveBets(updatedBets);
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return; // Already at the top
    const updatedBets = [...bets];
    [updatedBets[index - 1], updatedBets[index]] = [updatedBets[index], updatedBets[index - 1]];
    setBets(updatedBets);
    saveBets(updatedBets);
  };

  const handleMoveDown = (index) => {
    if (index === bets.length - 1) return; // Already at the bottom
    const updatedBets = [...bets];
    [updatedBets[index], updatedBets[index + 1]] = [updatedBets[index + 1], updatedBets[index]];
    setBets(updatedBets);
    saveBets(updatedBets);
  };

  const handleSubmit = (e) => {
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
              teamNames: formData.type === 'KC/PHL' ? formData.teamNames : undefined
            }
          : bet
      );
    } else {
      // Add new bet
      const newBet = {
        id: `bet-${Date.now()}`,
        question: formData.question,
        type: formData.type,
        teamNames: formData.type === 'KC/PHL' ? formData.teamNames : undefined
      };
      updatedBets = [...bets, newBet];
    }

    setBets(updatedBets);
    saveBets(updatedBets);
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

  const selectedBetType = betTypes.find(bt => bt.id === formData.type);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Manage Bets
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Add, edit, or delete prop bet questions
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Add New Bet
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {editingBet ? 'Edit Bet' : 'Add New Bet'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter bet question"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bet Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value, teamNames: { option1: '', option2: '' } })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., KC"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., PHL"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    {editingBet ? 'Update Bet' : 'Add Bet'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {bets.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                No bets configured. Click "Add New Bet" to get started.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
                            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                              #{index + 1}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {bet.question}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Type: {betTypes.find(t => t.id === bet.type)?.label || bet.type}
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
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(bet.id)}
                          className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
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
    </ProtectedRoute>
  );
}

