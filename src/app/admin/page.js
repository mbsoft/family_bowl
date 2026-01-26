'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getBets } from '../../lib/storage';
import { getAllSubmissions } from '../../lib/storage';
import { arePicksLocked, setPicksLocked } from '../../lib/storage';
import { getCurrentUsername } from '../../lib/auth';
import AlertDialog from '../../components/AlertDialog';
import Alert from '../../components/Alert';
import { useDialog, useAlert } from '../../hooks/useDialog';

export default function AdminDashboard() {
  const [bets, setBets] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [username, setUsername] = useState(null);
  const [picksLocked, setPicksLockedState] = useState(false);
  const { dialogState, showDialog, hideDialog } = useDialog();
  const { alertState, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const loadData = async () => {
      setUsername(getCurrentUsername());
      const [betsData, submissionsData, locked] = await Promise.all([
        getBets(),
        getAllSubmissions(),
        arePicksLocked()
      ]);
      setBets(betsData || []);
      setSubmissions(submissionsData || []);
      setPicksLockedState(locked || false);
    };
    loadData();
  }, []);

  const handleToggleLock = () => {
    const newLockStatus = !picksLocked;
    showDialog({
      title: newLockStatus ? 'Lock All Picks' : 'Unlock All Picks',
      message: newLockStatus
        ? 'Are you sure you want to LOCK all picks? Users will not be able to modify their submissions.'
        : 'Are you sure you want to UNLOCK all picks? Users will be able to modify their submissions again.',
      type: 'warning',
      confirmText: newLockStatus ? 'Lock' : 'Unlock',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const success = await setPicksLocked(newLockStatus);
        if (success) {
          setPicksLockedState(newLockStatus);
        } else {
          showAlert('Failed to update lock status. Please try again.', 'error');
        }
      }
    });
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#1A1A1A] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src="/logo.webp" 
                alt="Family Bowl Logo" 
                className="h-14 w-auto drop-shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  Welcome, {username}! Manage bets and view submissions.
                </p>
              </div>
            </div>
          </div>

          {/* Lock Status Banner */}
          <div className={`mb-6 rounded-2xl shadow-2xl p-6 border-4 ${
            picksLocked
              ? 'bg-[#EF4444]/20 dark:bg-[#EF4444]/20 border-[#EF4444] dark:border-[#EF4444]'
              : 'bg-[#10B981]/20 dark:bg-[#10B981]/20 border-[#10B981] dark:border-[#10B981]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-black mb-1 uppercase tracking-wide ${
                  picksLocked
                    ? 'text-[#EF4444] dark:text-[#EF4444]'
                    : 'text-[#10B981] dark:text-[#10B981]'
                }`}>
                  Picks Status: {picksLocked ? 'LOCKED' : 'UNLOCKED'}
                </h3>
                <p className={`text-sm font-bold ${
                  picksLocked
                    ? 'text-[#EF4444] dark:text-[#EF4444]'
                    : 'text-[#10B981] dark:text-[#10B981]'
                }`}>
                  {picksLocked
                    ? 'Users cannot modify their picks. All submissions are locked.'
                    : 'Users can modify their picks. Submissions are open for editing.'}
                </p>
              </div>
              <button
                onClick={handleToggleLock}
                className={`px-6 py-3 rounded-xl font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  picksLocked
                    ? 'bg-gradient-to-r from-[#10B981] to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                    : 'bg-gradient-to-r from-[#EF4444] to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                }`}
              >
                {picksLocked ? 'Unlock Picks' : 'Lock All Picks'}
              </button>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-6 mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Statistics
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-black text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  Total Bets
                </h3>
                <p className="text-4xl font-black text-[#0D4F3C] dark:text-green-500">
                  {bets.length}
                </p>
              </div>
              <div className="text-center sm:text-left border-t-4 sm:border-t-0 sm:border-l-4 border-gray-300 dark:border-gray-700 pt-4 sm:pt-0 sm:pl-6">
                <h3 className="text-sm font-black text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  Total Submissions
                </h3>
                <p className="text-4xl font-black text-[#0D4F3C] dark:text-green-500">
                  {submissions.length}
                </p>
              </div>
              <div className="text-center sm:text-left border-t-4 sm:border-t-0 sm:border-l-4 border-gray-300 dark:border-gray-700 pt-4 sm:pt-0 sm:pl-6">
                <h3 className="text-sm font-black text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  Completion Rate
                </h3>
                <p className="text-4xl font-black text-[#0D4F3C] dark:text-green-500">
                  {bets.length > 0 && submissions.length > 0
                    ? `${Math.round((submissions.length / bets.length) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/admin/invites"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-4 border-[#0D4F3C] dark:border-green-600 p-6 hover:shadow-xl transition-all transform hover:scale-105"
            >
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                Manage Invites
              </h2>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                Generate and manage invite links for new users.
              </p>
            </Link>

            <Link
              href="/admin/users"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-4 border-[#0D4F3C] dark:border-green-600 p-6 hover:shadow-xl transition-all transform hover:scale-105"
            >
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                Manage Users
              </h2>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                View and delete registered users.
              </p>
            </Link>

            <Link
              href="/admin/bet-types"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-4 border-[#0D4F3C] dark:border-green-600 p-6 hover:shadow-xl transition-all transform hover:scale-105"
            >
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                Manage Bet Types
              </h2>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                Define and configure bet type options and labels.
              </p>
            </Link>

            <Link
              href="/admin/bets"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-4 border-[#0D4F3C] dark:border-green-600 p-6 hover:shadow-xl transition-all transform hover:scale-105"
            >
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                Manage Bets
              </h2>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                Add, edit, or delete prop bet questions.
              </p>
            </Link>

            <Link
              href="/admin/submissions"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-4 border-[#0D4F3C] dark:border-green-600 p-6 hover:shadow-xl transition-all transform hover:scale-105"
            >
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                View Submissions
              </h2>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                Review and edit all user submissions.
              </p>
            </Link>

            <Link
              href="/admin/export"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-4 border-[#0D4F3C] dark:border-green-600 p-6 hover:shadow-xl transition-all transform hover:scale-105"
            >
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                Export Data
              </h2>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                Download all submissions as an Excel spreadsheet.
              </p>
            </Link>

            <Link
              href="/admin/results"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-4 border-[#0D4F3C] dark:border-green-600 p-6 hover:shadow-xl transition-all transform hover:scale-105"
            >
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                Set Bet Results
              </h2>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                Enter correct results for each bet (requires picks to be locked).
              </p>
            </Link>

            <Link
              href="/view-picks"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-4 border-[#0D4F3C] dark:border-green-600 p-6 hover:shadow-xl transition-all transform hover:scale-105"
            >
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                View All Picks
              </h2>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                View everyone's picks in a table format with scoring.
              </p>
            </Link>

            <Link
              href="/admin/archive"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-4 border-[#0D4F3C] dark:border-green-600 p-6 hover:shadow-xl transition-all transform hover:scale-105"
            >
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                Archive Management
              </h2>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                Archive and view historical Super Bowl results.
              </p>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('auth_user');
                  window.location.href = '/login';
                }
              }}
              className="text-sm font-black text-gray-600 dark:text-gray-400 hover:text-[#0D4F3C] dark:hover:text-green-400 uppercase tracking-wide"
            >
              Logout
            </button>
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

