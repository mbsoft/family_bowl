'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getBetTypes, saveBetTypes } from '../../../lib/storage';
import { DEFAULT_BET_TYPES } from '../../../utils/constants';

export default function AdminBetTypesPage() {
  const router = useRouter();
  const [betTypes, setBetTypes] = useState([]);
  const [editingBetType, setEditingBetType] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    label: '',
    options: ['', ''],
    optionLabels: { '': '', '': '' },
    requiresTeamNames: false,
    isIntegerRange: false,
    minValue: 0,
    maxValue: 100
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    loadBetTypes();
  }, []);

  const loadBetTypes = async () => {
    try {
      let loaded = await getBetTypes();
      if (!loaded || loaded.length === 0) {
        // Initialize with defaults if none exist
        loaded = DEFAULT_BET_TYPES;
        await saveBetTypes(loaded);
      }
      setBetTypes(loaded || []);
    } catch (error) {
      console.error('Error loading bet types:', error);
      // Fallback to defaults on error
      setBetTypes(DEFAULT_BET_TYPES);
    }
  };

  const handleAdd = () => {
    setFormData({
      id: '',
      label: '',
      options: ['', ''],
      optionLabels: {},
      requiresTeamNames: false,
      isIntegerRange: false,
      minValue: 0,
      maxValue: 100
    });
    setEditingBetType(null);
    setShowAddForm(true);
  };

  const handleEdit = (betType) => {
    setFormData({
      id: betType.id,
      label: betType.label,
      options: [...(betType.options || [])],
      optionLabels: { ...(betType.optionLabels || {}) },
      requiresTeamNames: betType.requiresTeamNames || false,
      isIntegerRange: betType.isIntegerRange || false,
      minValue: betType.minValue !== undefined ? betType.minValue : 0,
      maxValue: betType.maxValue !== undefined ? betType.maxValue : 100
    });
    setEditingBetType(betType);
    setShowAddForm(true);
  };

  const handleDelete = async (betTypeId) => {
    if (confirm('Are you sure you want to delete this bet type? This may affect existing bets using this type.')) {
      const updated = betTypes.filter(bt => bt.id !== betTypeId);
      setBetTypes(updated);
      try {
        await saveBetTypes(updated);
      } catch (error) {
        console.error('Error deleting bet type:', error);
        alert('Failed to delete bet type. Please try again.');
        // Reload to restore state
        loadBetTypes();
      }
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    
    // Update option labels to match
    const newOptionLabels = { ...formData.optionLabels };
    if (formData.requiresTeamNames) {
      // Clear option labels for team types
      newOptionLabels[value] = '';
    } else {
      // Keep existing labels
      if (!newOptionLabels[value]) {
        newOptionLabels[value] = '';
      }
    }

    setFormData({
      ...formData,
      options: newOptions,
      optionLabels: newOptionLabels
    });
  };

  const handleOptionLabelChange = (optionValue, label) => {
    setFormData({
      ...formData,
      optionLabels: {
        ...formData.optionLabels,
        [optionValue]: label
      }
    });
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, '']
    });
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length <= 2) {
      alert('Bet types must have at least 2 options');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    const removedOption = formData.options[index];
    const newOptionLabels = { ...formData.optionLabels };
    delete newOptionLabels[removedOption];
    
    setFormData({
      ...formData,
      options: newOptions,
      optionLabels: newOptionLabels
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.id.trim() || !formData.label.trim()) {
      alert('ID and Label are required');
      return;
    }

    if (formData.isIntegerRange) {
      // Validate integer range
      const min = parseInt(formData.minValue, 10);
      const max = parseInt(formData.maxValue, 10);
      if (isNaN(min) || isNaN(max) || min >= max) {
        alert('Min value must be less than max value');
        return;
      }
    } else {
      // Validate options for non-integer range types
      if (formData.options.length < 2) {
        alert('At least 2 options are required');
        return;
      }

      if (formData.options.some(opt => !opt.trim())) {
        alert('All options must have values');
        return;
      }
    }

    // Check for duplicate ID (unless editing)
    if (!editingBetType && betTypes.some(bt => bt.id === formData.id)) {
      alert('A bet type with this ID already exists');
      return;
    }

    // Clean up option labels (remove empty ones and labels for removed options)
    const cleanedOptionLabels = {};
    if (!formData.isIntegerRange) {
      formData.options.forEach(opt => {
        if (formData.optionLabels[opt]) {
          cleanedOptionLabels[opt] = formData.optionLabels[opt];
        }
      });
    }

    const betTypeData = {
      id: formData.id.trim(),
      label: formData.label.trim(),
      options: formData.isIntegerRange ? [] : formData.options.map(opt => opt.trim()),
      optionLabels: formData.requiresTeamNames ? {} : cleanedOptionLabels,
      requiresTeamNames: formData.requiresTeamNames,
      isIntegerRange: formData.isIntegerRange,
      ...(formData.isIntegerRange && {
        minValue: parseInt(formData.minValue, 10),
        maxValue: parseInt(formData.maxValue, 10)
      })
    };

    let updated;
    if (editingBetType) {
      // Update existing
      updated = betTypes.map(bt =>
        bt.id === editingBetType.id ? betTypeData : bt
      );
    } else {
      // Add new
      updated = [...betTypes, betTypeData];
    }

    setBetTypes(updated);
    try {
      await saveBetTypes(updated);
      setShowAddForm(false);
      setEditingBetType(null);
      setFormData({
        id: '',
        label: '',
        options: ['', ''],
        optionLabels: {},
        requiresTeamNames: false,
        isIntegerRange: false,
        minValue: 0,
        maxValue: 100
      });
    } catch (error) {
      console.error('Error saving bet type:', error);
      alert('Failed to save bet type. Please try again.');
      // Reload to restore state
      loadBetTypes();
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingBetType(null);
    setFormData({
      id: '',
      label: '',
      options: ['', ''],
      optionLabels: {},
      requiresTeamNames: false,
      isIntegerRange: false,
      minValue: 0,
      maxValue: 100
    });
  };

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
                  Manage Bet Types
                </h1>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  Define and edit bet type configurations
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
                Add New Bet Type
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-6 mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
                {editingBetType ? 'Edit Bet Type' : 'Add New Bet Type'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                    ID (unique identifier)
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                    required
                    disabled={!!editingBetType}
                    className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., O/U"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editingBetType ? 'ID cannot be changed after creation' : 'This will be used as the bet type identifier'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                    Label (display name)
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                    placeholder="e.g., Over/Under"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.isIntegerRange}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isIntegerRange: e.target.checked,
                          requiresTeamNames: false // Can't be both
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Integer Range (for numeric input bets)
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    If checked, users will enter an integer value within a specified range
                  </p>
                </div>

                {formData.isIntegerRange ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                        Minimum Value
                      </label>
                      <input
                        type="number"
                        value={formData.minValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minValue: parseInt(e.target.value, 10) || 0
                          })
                        }
                        required
                        className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                        Maximum Value
                      </label>
                      <input
                        type="number"
                        value={formData.maxValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxValue: parseInt(e.target.value, 10) || 100
                          })
                        }
                        required
                        className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={formData.requiresTeamNames}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              requiresTeamNames: e.target.checked,
                              optionLabels: {} // Clear labels for team types
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Requires Team Names (for team selection bets)
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        If checked, team names will be entered when creating bets using this type
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                        Options
                      </label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        required
                        className="flex-1 px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                        placeholder={`Option ${index + 1} value`}
                      />
                      {!formData.requiresTeamNames && (
                        <input
                          type="text"
                          value={formData.optionLabels[option] || ''}
                          onChange={(e) => handleOptionLabelChange(option, e.target.value)}
                          className="flex-1 px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                          placeholder={`Option ${index + 1} label (optional)`}
                        />
                      )}
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-[#EF4444] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="mt-2 px-4 py-2 text-sm bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-xl font-black uppercase tracking-wider border-2 border-gray-400 dark:border-gray-600"
                      >
                        + Add Option
                      </button>
                    </div>
                  </>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    {editingBetType ? 'Update Bet Type' : 'Add Bet Type'}
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
            {betTypes.length === 0 ? (
              <div className="p-8 text-center text-gray-700 dark:text-gray-300 font-bold">
                No bet types configured. Click "Add New Bet Type" to get started.
              </div>
            ) : (
              <div className="divide-y-4 divide-gray-300 dark:divide-gray-700">
                {betTypes.map((betType) => (
                  <div
                    key={betType.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 uppercase">
                          {betType.label}
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                          ID: <span className="font-mono font-black">{betType.id}</span>
                          {betType.requiresTeamNames && (
                            <span className="ml-2 px-3 py-1 bg-[#0D4F3C]/20 dark:bg-green-700/20 border-2 border-[#0D4F3C] dark:border-green-600 text-[#0D4F3C] dark:text-green-400 rounded-xl text-xs font-black uppercase">
                              Team Selection
                            </span>
                          )}
                          {betType.isIntegerRange && (
                            <span className="ml-2 px-3 py-1 bg-[#10B981]/20 dark:bg-[#10B981]/20 border-2 border-[#10B981] dark:border-[#10B981] text-[#10B981] dark:text-[#10B981] rounded-xl text-xs font-black uppercase">
                              Integer Range
                            </span>
                          )}
                        </p>
                        <div className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                          {betType.isIntegerRange ? (
                            <span>
                              <span className="font-black uppercase">Range:</span>{' '}
                              {betType.minValue} - {betType.maxValue}
                            </span>
                          ) : (
                            <>
                              <span className="font-black uppercase">Options:</span>{' '}
                              {betType.options.map((opt, idx) => {
                                const label = betType.optionLabels?.[opt] || opt;
                                return (
                                  <span key={idx}>
                                    {idx > 0 && ', '}
                                    <span className="font-mono font-black">{opt}</span>
                                    {betType.optionLabels?.[opt] && (
                                      <span className="text-gray-600 dark:text-gray-400"> ({label})</span>
                                    )}
                                  </span>
                                );
                              })}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(betType)}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(betType.id)}
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
    </ProtectedRoute>
  );
}

