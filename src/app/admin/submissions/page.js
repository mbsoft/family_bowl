'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getAllSubmissions, saveSubmission, deleteSubmission } from '../../../lib/storage';
import { getBets, getBetTypes } from '../../../lib/storage';
import { getBetOptions, getBetOptionLabel } from '../../../utils/constants';

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [bets, setBets] = useState([]);
  const [betTypes, setBetTypes] = useState([]);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editingSelections, setEditingSelections] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    loadData();
  }, []);

  const loadData = () => {
    setSubmissions(getAllSubmissions());
    setBets(getBets());
    setBetTypes(getBetTypes());
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

  const handleSave = () => {
    if (!editingSubmission) return;

    const updatedSubmission = {
      ...editingSubmission,
      selections: editingSelections,
      timestamp: Date.now()
    };

    saveSubmission(updatedSubmission);
    loadData();
    setEditingSubmission(null);
    setEditingSelections({});
  };

  const handleCancel = () => {
    setEditingSubmission(null);
    setEditingSelections({});
  };

  const handleDelete = (submission) => {
    if (confirm(`Are you sure you want to delete the submission for ${submission.username}? This action cannot be undone.`)) {
      const success = deleteSubmission(submission.username);
      if (success) {
        loadData();
        // If we were editing this submission, cancel editing
        if (editingSubmission?.username === submission.username) {
          setEditingSubmission(null);
          setEditingSelections({});
        }
      } else {
        alert('Failed to delete submission. Please try again.');
      }
    }
  };

  const filteredSubmissions = submissions.filter((submission) =>
    submission.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                View Submissions
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Review and edit all user submissions
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
              className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No submissions found matching your search.' : 'No submissions yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.username}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {submission.username}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Submitted: {new Date(submission.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {editingSubmission?.username !== submission.username && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(submission)}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(submission)}
                          className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingSubmission?.username === submission.username ? (
                    <div className="space-y-4">
                      {bets.map((bet) => {
                        const options = getBetOptions(bet.type, bet.teamNames, betTypes);

                        return (
                          <div key={bet.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {bet.question}
                            </label>
                            <div className="flex gap-4">
                              {options.map((option) => {
                                const label = getBetOptionLabel(bet.type, option, bet.teamNames, betTypes);
                                const isSelected = editingSelections[bet.id] === option;
                                return (
                                  <label
                                    key={option}
                                    className={`
                                      flex items-center px-3 py-1 rounded cursor-pointer
                                      ${
                                        isSelected
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                          </div>
                        );
                      })}
                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                          Save Changes
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
                            <span className="text-gray-600 dark:text-gray-400">{bet.question}</span>
                            <span
                              className={`font-medium ${
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
    </ProtectedRoute>
  );
}

