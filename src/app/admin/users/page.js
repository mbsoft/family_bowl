'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getUserCredentials, deleteUser } from '../../../lib/storage';
import { getAllSubmissions } from '../../../lib/storage';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
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
  };

  const handleDelete = async (username) => {
    if (username.toLowerCase() === 'admin') {
      alert('Cannot delete admin user');
      return;
    }

    const submissionCount = submissions[username] || 0;
    const message = submissionCount > 0
      ? `Are you sure you want to delete user "${username}"? This will also delete ${submissionCount} submission(s) associated with this user. This action cannot be undone.`
      : `Are you sure you want to delete user "${username}"? This action cannot be undone.`;

    if (confirm(message)) {
      try {
        const success = await deleteUser(username);
        if (success) {
          await loadData();
        } else {
          alert('Failed to delete user. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
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
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Manage Users
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage all registered users
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

          {filteredUsers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No users found matching your search.' : 'No users registered yet.'}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {user.username}
                            </h3>
                            {isAdmin && (
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
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
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
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

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Warning:</strong> Deleting a user will permanently remove their account and all associated submissions. This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

