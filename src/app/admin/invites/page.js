'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { generateInvite, getInvites, deleteInvite } from '../../../lib/storage';

export default function AdminInvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState([]);
  const [copiedToken, setCopiedToken] = useState(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [defaultUsername, setDefaultUsername] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const loadedInvites = await getInvites();
      setInvites(loadedInvites || []);
    } catch (error) {
      console.error('Failed to load invites:', error);
      setInvites([]);
    }
  };

  const handleGenerateInvite = async () => {
    const username = defaultUsername.trim() || null;
    try {
      const newInvite = await generateInvite(username);
      if (newInvite) {
        await loadInvites();
        setShowGenerateForm(false);
        setDefaultUsername('');
      } else {
        alert('Failed to generate invite');
      }
    } catch (error) {
      console.error('Failed to generate invite:', error);
      alert('Failed to generate invite. Please try again.');
    }
  };

  const handleShowGenerateForm = () => {
    setShowGenerateForm(true);
    setDefaultUsername('');
  };

  const handleCancelGenerate = () => {
    setShowGenerateForm(false);
    setDefaultUsername('');
  };

  const handleCopyLink = (token) => {
    if (typeof window === 'undefined') {
      return;
    }
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const handleDeleteInvite = async (token) => {
    const invite = Array.isArray(invites) ? invites.find(inv => inv.token === token) : null;
    const message = invite?.used
      ? `Are you sure you want to delete this used invite? This action cannot be undone.`
      : `Are you sure you want to delete this invite? The link will no longer work and cannot be recovered.`;
    
    if (confirm(message)) {
      try {
        const success = await deleteInvite(token);
        if (success) {
          await loadInvites();
        } else {
          alert('Failed to delete invite');
        }
      } catch (error) {
        console.error('Failed to delete invite:', error);
        alert('Failed to delete invite. Please try again.');
      }
    }
  };

  // Sort invites: unused first, then by creation date (newest first)
  const sortedInvites = Array.isArray(invites) ? [...invites].sort((a, b) => {
    if (a.used !== b.used) {
      return a.used ? 1 : -1;
    }
    return b.createdAt - a.createdAt;
  }) : [];

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Manage Invites
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Generate and manage invite links for new users
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Back to Dashboard
              </button>
              {!showGenerateForm && (
                <button
                  onClick={handleShowGenerateForm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Generate New Invite
                </button>
              )}
            </div>
          </div>

          {showGenerateForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Generate New Invite
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={defaultUsername}
                    onChange={(e) => setDefaultUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter username to pre-fill in registration form"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    If provided, this username will be pre-filled when the user opens the invite link. 
                    They can still change it if needed.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleGenerateInvite}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Generate Invite
                  </button>
                  <button
                    onClick={handleCancelGenerate}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {sortedInvites.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                <p className="mb-4">No invites have been generated yet.</p>
                <button
                  onClick={handleShowGenerateForm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Generate Your First Invite
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedInvites.map((invite) => {
                  const inviteUrl = typeof window !== 'undefined' 
                    ? `${window.location.origin}/invite/${invite.token}`
                    : '';
                  
                  return (
                    <div
                      key={invite.token}
                      className={`p-6 ${
                        invite.used
                          ? 'bg-gray-50 dark:bg-gray-700/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {invite.used ? (
                                <span className="line-through text-gray-400">{invite.token}</span>
                              ) : (
                                invite.token
                              )}
                            </h3>
                            {invite.used ? (
                              <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                                Used
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Created: {new Date(invite.createdAt).toLocaleString()}
                          </p>
                          {invite.defaultUsername && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              Default Username: <span className="font-medium">{invite.defaultUsername}</span>
                            </p>
                          )}
                          {invite.used && invite.usedBy && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Used by: <span className="font-medium">{invite.usedBy}</span>
                            </p>
                          )}
                          {!invite.used && (
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Invite Link:
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={inviteUrl}
                                  readOnly
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <button
                                  onClick={() => handleCopyLink(invite.token)}
                                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                                >
                                  {copiedToken === invite.token ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleDeleteInvite(invite.token)}
                            className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                            title="Delete invite"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>How it works:</strong> Generate an invite link and share it with the user. 
              When they click the link, they'll be able to create their account with a username and password. 
              Each invite can only be used once.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

