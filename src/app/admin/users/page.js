'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getUserCredentials, deleteUser } from '../../../lib/storage';
import { getAllSubmissions } from '../../../lib/storage';
import AlertDialog from '../../../components/AlertDialog';
import Alert from '../../../components/Alert';
import { useDialog, useAlert } from '../../../hooks/useDialog';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { dialogState, showDialog, hideDialog } = useDialog();
  const { alertState, showAlert, hideAlert } = useAlert();

  const loadData = useCallback(async () => {
    try {
      const [usersData, submissionsData] = await Promise.all([
        getUserCredentials(),
        getAllSubmissions()
      ]);
      
      // Convert users object to array
      const usersArray = Object.values(usersData || {}).map(user => ({
        username: user.username,
        createdAt: user.createdAt,
        createdVia: user.createdVia
      }));
      
      // Count submissions per user
      const submissionCounts = {};
      if (Array.isArray(submissionsData)) {
        submissionsData.forEach(sub => {
          submissionCounts[sub.username] = (submissionCounts[sub.username] || 0) + 1;
        });
      }
      
      setUsers(usersArray);
      setSubmissions(submissionCounts);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setSubmissions({});
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleDelete = (username) => {
    if (username.toLowerCase() === 'admin') {
      showAlert('Cannot delete admin user', 'error');
      return;
    }

    const submissionCount = submissions[username] || 0;
    const message = submissionCount > 0
      ? `Are you sure you want to delete user "${username}"? This will also delete ${submissionCount} submission(s) associated with this user. This action cannot be undone.`
      : `Are you sure you want to delete user "${username}"? This action cannot be undone.`;

    showDialog({
      title: 'Delete User',
      message,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const success = await deleteUser(username);
          if (success) {
            await loadData();
            showAlert('User deleted successfully.', 'success');
          } else {
            showAlert('Failed to delete user. Please try again.', 'error');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          showAlert('Failed to delete user. Please try again.', 'error');
        }
      }
    });
  };

  const filteredUsers = Array.isArray(users)
    ? users.filter((user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center text-gray-600 dark:text-gray-400">
              Loading users...
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
                  Manage Users
                </h1>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  View and manage all registered users
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

          {filteredUsers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-8 text-center text-gray-700 dark:text-gray-300 font-bold">
              {searchTerm ? 'No users found matching your search.' : 'No users registered yet.'}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 overflow-hidden">
              <div className="divide-y-4 divide-gray-300 dark:divide-gray-700">
                {filteredUsers.map((user) => {
                  const submissionCount = submissions[user.username] || 0;
                  const isAdmin = user.username.toLowerCase() === 'admin';
                  
                  return (
                    <div
                      key={user.username}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">
                              {user.username}
                            </h3>
                            {isAdmin && (
                              <span className="px-3 py-1 bg-[#FFD700] dark:bg-yellow-600 text-gray-900 dark:text-white rounded-xl text-xs font-black uppercase tracking-wide border-2 border-yellow-600 dark:border-yellow-500">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 font-semibold">
                            <p>
                              Created: {new Date(user.createdAt).toLocaleString()}
                            </p>
                            {user.createdVia && (
                              <p>
                                Created via invite: {user.createdVia.substring(0, 20)}...
                              </p>
                            )}
                            <p>
                              Submissions: {submissionCount}
                            </p>
                          </div>
                        </div>
                        {!isAdmin && (
                          <button
                            onClick={() => handleDelete(user.username)}
                            className="px-5 py-3 bg-gradient-to-r from-[#EF4444] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                          >
                            Delete User
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-[#FFD700]/20 dark:bg-yellow-600/20 border-4 border-[#FFD700] dark:border-yellow-600 rounded-xl">
            <p className="text-sm text-gray-900 dark:text-white font-bold">
              <strong className="uppercase">Warning:</strong> Deleting a user will permanently remove their account and all associated submissions. This action cannot be undone.
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

