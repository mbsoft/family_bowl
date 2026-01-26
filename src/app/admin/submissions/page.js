'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getAllSubmissions, saveSubmission, deleteSubmission } from '../../../lib/storage';
import { getBets, getBetTypes } from '../../../lib/storage';
import { getBetOptions, getBetOptionLabel } from '../../../utils/constants';
import AlertDialog from '../../../components/AlertDialog';
import Alert from '../../../components/Alert';
import { useDialog, useAlert } from '../../../hooks/useDialog';

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [bets, setBets] = useState([]);
  const [betTypes, setBetTypes] = useState([]);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editingSelections, setEditingSelections] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const { dialogState, showDialog, hideDialog } = useDialog();
  const { alertState, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [submissionsData, betsData, betTypesData] = await Promise.all([
        getAllSubmissions(),
        getBets(),
        getBetTypes()
      ]);
      setSubmissions(submissionsData || []);
      setBets(betsData || []);
      setBetTypes(betTypesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setSubmissions([]);
      setBets([]);
      setBetTypes([]);
    }
  };

  const handleEdit = (submission) => {
    setEditingSubmission(submission);
    setEditingSelections({ ...submission.selections });
  };

  const handleSelectionChange = (betId, value) => {
    setEditingSelections((prev) => ({
      ...prev,
      [betId]: value
    }));
  };

  const handleSave = async () => {
    if (!editingSubmission) return;

    const updatedSubmission = {
      ...editingSubmission,
      selections: editingSelections,
      timestamp: Date.now()
    };

    try {
      const success = await saveSubmission(updatedSubmission);
      if (success) {
        await loadData();
        setEditingSubmission(null);
        setEditingSelections({});
        showAlert('Submission saved successfully.', 'success');
      } else {
        showAlert('Failed to save submission. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error saving submission:', error);
      showAlert('Failed to save submission. Please try again.', 'error');
    }
  };

  const handleCancel = () => {
    setEditingSubmission(null);
    setEditingSelections({});
  };

  const handleDelete = (submission) => {
    showDialog({
      title: 'Delete Submission',
      message: `Are you sure you want to delete the submission for ${submission.username}? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const success = await deleteSubmission(submission.username);
          if (success) {
            await loadData();
            // If we were editing this submission, cancel editing
            if (editingSubmission?.username === submission.username) {
              setEditingSubmission(null);
              setEditingSelections({});
            }
            showAlert('Submission deleted successfully.', 'success');
          } else {
            showAlert('Failed to delete submission. Please try again.', 'error');
          }
        } catch (error) {
          console.error('Error deleting submission:', error);
          showAlert('Failed to delete submission. Please try again.', 'error');
        }
      }
    });
  };

  const filteredSubmissions = Array.isArray(submissions) 
    ? submissions.filter((submission) =>
        submission.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#1A1A1A] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.webp" 
                alt="Family Bowl Logo" 
                className="h-12 w-auto drop-shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                  View Submissions
                </h1>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  Review and edit all user submissions
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

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
            />
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-8 text-center text-gray-700 dark:text-gray-300 font-bold">
              {searchTerm ? 'No submissions found matching your search.' : 'No submissions yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.username}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">
                        {submission.username}
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                        Submitted: {new Date(submission.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {editingSubmission?.username !== submission.username && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(submission)}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wide shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(submission)}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-[#EF4444] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-black uppercase tracking-wide shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingSubmission?.username === submission.username ? (
                    <div className="space-y-4">
                      {bets.map((bet) => {
                        const betTypeDef = betTypes.find(bt => bt.id === bet.type);
                        const isIntegerRange = betTypeDef?.isIntegerRange || false;
                        const options = getBetOptions(bet.type, bet.teamNames, betTypes);
                        const currentValue = editingSelections[bet.id] || '';

                        return (
                          <div key={bet.id} className="border-b-4 border-gray-300 dark:border-gray-700 pb-4">
                            <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                              {bet.question}
                              {isIntegerRange && betTypeDef && (
                                <span className="ml-2 text-xs text-gray-600 dark:text-gray-400 font-bold">
                                  (Range: {betTypeDef.minValue} - {betTypeDef.maxValue})
                                </span>
                              )}
                            </label>
                            {isIntegerRange ? (
                              <div>
                                <input
                                  type="number"
                                  value={currentValue}
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    // Allow empty string for clearing, or valid integer
                                    if (inputValue === '' || /^\d+$/.test(inputValue)) {
                                      const numValue = inputValue === '' ? '' : parseInt(inputValue, 10);
                                      if (inputValue === '' || (numValue >= betTypeDef.minValue && numValue <= betTypeDef.maxValue)) {
                                        handleSelectionChange(bet.id, inputValue === '' ? '' : String(numValue));
                                      }
                                    }
                                  }}
                                  min={betTypeDef?.minValue || 0}
                                  max={betTypeDef?.maxValue || 100}
                                  placeholder={`Enter a number between ${betTypeDef?.minValue || 0} and ${betTypeDef?.maxValue || 100}`}
                                  className="w-full max-w-xs px-4 py-3 border-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-400 dark:border-gray-600 focus:border-[#0D4F3C] focus:ring-4 focus:ring-[#0D4F3C]/20 dark:focus:border-green-500 dark:focus:ring-green-500/20 font-semibold"
                                />
                              </div>
                            ) : (
                              <div className="flex gap-3 flex-wrap">
                                {options.map((option) => {
                                  const label = getBetOptionLabel(bet.type, option, bet.teamNames, betTypes);
                                  const isSelected = editingSelections[bet.id] === option;
                                  return (
                                    <label
                                      key={option}
                                      className={`
                                        flex items-center px-5 py-3 rounded-xl border-4 cursor-pointer font-bold uppercase tracking-wide transition-all
                                        ${
                                          isSelected
                                            ? 'bg-[#0D4F3C] text-white border-[#0D4F3C] dark:bg-green-600 dark:border-green-600 shadow-lg scale-105'
                                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-400 dark:border-gray-600 hover:border-[#0D4F3C] dark:hover:border-green-500'
                                        }
                                      `}
                                    >
                                      <input
                                        type="radio"
                                        name={`edit-${bet.id}`}
                                        value={option}
                                        checked={isSelected}
                                        onChange={() => handleSelectionChange(bet.id, option)}
                                        className="sr-only"
                                      />
                                      <span className="text-sm">{label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={handleSave}
                          className="px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                          Save Changes
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
                    <div className="space-y-2">
                      {bets.map((bet) => {
                        const selection = submission.selections[bet.id];
                        const label = selection
                          ? getBetOptionLabel(bet.type, selection, bet.teamNames, betTypes)
                          : 'Not answered';
                        return (
                          <div
                            key={bet.id}
                            className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700"
                          >
                            <span className="text-gray-700 dark:text-gray-300 font-semibold">{bet.question}</span>
                            <span
                              className={`font-bold ${
                                selection
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}
                            >
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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

