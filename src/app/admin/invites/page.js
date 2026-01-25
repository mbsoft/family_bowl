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
                  Manage Invites
                </h1>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  Generate and manage invite links for new users
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
              {!showGenerateForm && (
                <button
                  onClick={handleShowGenerateForm}
                  className="px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  Generate New Invite
                </button>
              )}
            </div>
          </div>

          {showGenerateForm && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-6 mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
                Generate New Invite
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                    Default Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={defaultUsername}
                    onChange={(e) => setDefaultUsername(e.target.value)}
                    className="w-full px-4 py-3 border-3 border-gray-400 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-[#0D4F3C] focus:border-[#0D4F3C] dark:focus:ring-green-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                    placeholder="Enter username to pre-fill in registration form"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-semibold">
                    If provided, this username will be pre-filled when the user opens the invite link. 
                    They can still change it if needed.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleGenerateInvite}
                    className="px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    Generate Invite
                  </button>
                  <button
                    onClick={handleCancelGenerate}
                    className="px-5 py-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-xl font-black uppercase tracking-wider border-4 border-gray-400 dark:border-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 overflow-hidden">
            {sortedInvites.length === 0 ? (
              <div className="p-8 text-center text-gray-700 dark:text-gray-300 font-bold">
                <p className="mb-4">No invites have been generated yet.</p>
                <button
                  onClick={handleShowGenerateForm}
                  className="px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  Generate Your First Invite
                </button>
              </div>
            ) : (
              <div className="divide-y-4 divide-gray-300 dark:divide-gray-700">
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
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">
                              {invite.used ? (
                                <span className="line-through text-gray-400">{invite.token}</span>
                              ) : (
                                invite.token
                              )}
                            </h3>
                            {invite.used ? (
                              <span className="px-3 py-1 text-xs bg-[#EF4444]/20 dark:bg-[#EF4444]/20 border-2 border-[#EF4444] dark:border-[#EF4444] text-[#EF4444] dark:text-[#EF4444] rounded-xl font-black uppercase">
                                Used
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-xs bg-[#10B981]/20 dark:bg-[#10B981]/20 border-2 border-[#10B981] dark:border-[#10B981] text-[#10B981] dark:text-[#10B981] rounded-xl font-black uppercase">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                            Created: {new Date(invite.createdAt).toLocaleString()}
                          </p>
                          {invite.defaultUsername && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                              Default Username: <span className="font-black">{invite.defaultUsername}</span>
                            </p>
                          )}
                          {invite.used && invite.usedBy && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                              Used by: <span className="font-black">{invite.usedBy}</span>
                            </p>
                          )}
                          {!invite.used && (
                            <div className="mt-3">
                              <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                                Invite Link:
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={inviteUrl}
                                  readOnly
                                  className="flex-1 px-3 py-2 text-sm border-3 border-gray-400 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                                />
                                <button
                                  onClick={() => handleCopyLink(invite.token)}
                                  className="px-4 py-2 text-sm bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-xl font-black uppercase tracking-wide border-2 border-gray-400 dark:border-gray-600 transition-all"
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
                            className="px-4 py-2 text-sm bg-gradient-to-r from-[#EF4444] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
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

          <div className="mt-6 p-4 bg-[#0D4F3C]/20 dark:bg-green-700/20 border-4 border-[#0D4F3C] dark:border-green-600 rounded-xl">
            <p className="text-sm text-gray-900 dark:text-white font-bold">
              <strong className="uppercase">How it works:</strong> Generate an invite link and share it with the user. 
              When they click the link, they'll be able to create their account with a username and password. 
              Each invite can only be used once.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

