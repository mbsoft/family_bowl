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

  const loadBetTypes = () => {
    let loaded = getBetTypes();
    if (loaded.length === 0) {
      // Initialize with defaults if none exist
      loaded = DEFAULT_BET_TYPES;
      saveBetTypes(loaded);
    }
    setBetTypes(loaded);
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

  const handleDelete = (betTypeId) => {
    if (confirm('Are you sure you want to delete this bet type? This may affect existing bets using this type.')) {
      const updated = betTypes.filter(bt => bt.id !== betTypeId);
      setBetTypes(updated);
      saveBetTypes(updated);
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

  const handleSubmit = (e) => {
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
    saveBetTypes(updated);
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
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Manage Bet Types
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Define and edit bet type configurations
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
                Add New Bet Type
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {editingBetType ? 'Edit Bet Type' : 'Add New Bet Type'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., O/U"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editingBetType ? 'ID cannot be changed after creation' : 'This will be used as the bet type identifier'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Label (display name)
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Options
                      </label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        required
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={`Option ${index + 1} value`}
                      />
                      {!formData.requiresTeamNames && (
                        <input
                          type="text"
                          value={formData.optionLabels[option] || ''}
                          onChange={(e) => handleOptionLabelChange(option, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder={`Option ${index + 1} label (optional)`}
                        />
                      )}
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="mt-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        + Add Option
                      </button>
                    </div>
                  </>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    {editingBetType ? 'Update Bet Type' : 'Add Bet Type'}
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
            {betTypes.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                No bet types configured. Click "Add New Bet Type" to get started.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {betTypes.map((betType) => (
                  <div
                    key={betType.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {betType.label}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          ID: <span className="font-mono">{betType.id}</span>
                          {betType.requiresTeamNames && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                              Team Selection
                            </span>
                          )}
                          {betType.isIntegerRange && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                              Integer Range
                            </span>
                          )}
                        </p>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {betType.isIntegerRange ? (
                            <span>
                              <span className="font-medium">Range:</span>{' '}
                              {betType.minValue} - {betType.maxValue}
                            </span>
                          ) : (
                            <>
                              <span className="font-medium">Options:</span>{' '}
                              {betType.options.map((opt, idx) => {
                                const label = betType.optionLabels?.[opt] || opt;
                                return (
                                  <span key={idx}>
                                    {idx > 0 && ', '}
                                    <span className="font-mono">{opt}</span>
                                    {betType.optionLabels?.[opt] && (
                                      <span className="text-gray-500"> ({label})</span>
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
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(betType.id)}
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

