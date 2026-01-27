'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, getCurrentUsername } from '../../lib/auth';
import { getBets, getBetTypes } from '../../lib/storage';
import { getSubmission, saveSubmission, deleteSubmission, arePicksLocked } from '../../lib/storage';
import { DEFAULT_BETS } from '../../utils/constants';
import BetInput from '../../components/BetInput';
import AlertDialog from '../../components/AlertDialog';
import Alert from '../../components/Alert';
import { useDialog, useAlert } from '../../hooks/useDialog';

export default function BetsPage() {
  const router = useRouter();
  const [bets, setBets] = useState([]);
  const [selections, setSelections] = useState({});
  const [originalSubmittedSelections, setOriginalSubmittedSelections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [username, setUsername] = useState(null);
  const [picksLocked, setPicksLocked] = useState(false);
  const [betTypes, setBetTypes] = useState([]);
  const { dialogState, showDialog, hideDialog } = useDialog();
  const { alertState, showAlert, hideAlert } = useAlert();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = getCurrentUsername();
    setUsername(currentUser);

    // Load data asynchronously
    const loadData = async () => {
      try {
        // Load bets, picks lock status, submission, and bet types in parallel
        const [loadedBets, locked, existingSubmission, types] = await Promise.all([
          getBets(),
          arePicksLocked(),
          currentUser ? getSubmission(currentUser) : Promise.resolve(null),
          getBetTypes()
        ]);

        setPicksLocked(locked);
        setBetTypes(types || []);

        // Use loaded bets or defaults
        const betsToUse = loadedBets && loadedBets.length > 0 ? loadedBets : DEFAULT_BETS;
        setBets(betsToUse);

        // Load from localStorage first (draft progress)
        const draftKey = `family_bowl_draft_${currentUser}`;
        const savedDraft = localStorage.getItem(draftKey);
        let draftSelections = {};
        
        if (savedDraft) {
          try {
            draftSelections = JSON.parse(savedDraft);
          } catch (e) {
            console.error('Failed to parse draft from localStorage:', e);
          }
        }

        // Load existing submission if any, but prefer draft if it exists
        if (existingSubmission && existingSubmission.selections) {
          // Store the original submitted selections for comparison
          setOriginalSubmittedSelections(existingSubmission.selections);
          // Merge: use draft selections if they exist, otherwise use submitted selections
          const finalSelections = Object.keys(draftSelections).length > 0 ? draftSelections : existingSubmission.selections;
          setSelections(finalSelections);
          // If we're using draft, mark as not submitted since it's been modified
          if (Object.keys(draftSelections).length > 0) {
            setSubmitted(false);
          } else {
            setSubmitted(true);
          }
        } else if (Object.keys(draftSelections).length > 0) {
          // Only draft exists, use it
          setSelections(draftSelections);
          setOriginalSubmittedSelections(null);
        } else {
          setOriginalSubmittedSelections(null);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback to defaults on error
        setBets(DEFAULT_BETS);
        setBetTypes([]);
      } finally {
        setLoading(false);
        // Mark that initial load is complete
        hasLoadedRef.current = true;
      }
    };

    loadData();
  }, [router]);

  // Auto-save to localStorage whenever selections change
  useEffect(() => {
    // Don't run during initial load - wait until data has been loaded
    if (typeof window === 'undefined' || !username || picksLocked || !hasLoadedRef.current) {
      return;
    }

    const draftKey = `family_bowl_draft_${username}`;
    if (Object.keys(selections).length > 0) {
      localStorage.setItem(draftKey, JSON.stringify(selections));
    } else {
      // Only clear draft if selections are empty AND we've finished loading
      // This prevents clearing during initial mount
      localStorage.removeItem(draftKey);
    }
  }, [selections, username, picksLocked]);

  const handleSelectionChange = (betId, value) => {
    if (picksLocked) {
      return; // Don't allow changes if locked
    }
    setSelections((prev) => ({
      ...prev,
      [betId]: value
    }));
    setSubmitted(false);
  };

  const allBetsAnswered = bets.length > 0 && bets.every(bet => selections[bet.id]);

  // Check if current selections differ from original submitted selections
  const hasChanges = originalSubmittedSelections ? (() => {
    // Compare all bet IDs
    const allBetIds = new Set([
      ...Object.keys(selections),
      ...Object.keys(originalSubmittedSelections)
    ]);
    
    for (const betId of allBetIds) {
      if (selections[betId] !== originalSubmittedSelections[betId]) {
        return true;
      }
    }
    return false;
  })() : false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (picksLocked) {
      return; // Don't allow submission if locked
    }
    if (!allBetsAnswered || !username) {
      return;
    }

    setSubmitting(true);

    const submission = {
      username,
      timestamp: Date.now(),
      selections
    };

    try {
      const success = await saveSubmission(submission);
      if (success) {
        setSubmitted(true);
        // Update original submitted selections to match current
        setOriginalSubmittedSelections({ ...selections });
        // Clear draft from localStorage after successful submission
        if (username) {
          const draftKey = `family_bowl_draft_${username}`;
          localStorage.removeItem(draftKey);
        }
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showAlert('Failed to save submission. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Failed to save submission:', error);
      showAlert('An error occurred while saving. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearAll = () => {
    if (picksLocked) {
      return; // Don't allow clearing if locked
    }
    
    if (!username) {
      return;
    }

    // Show confirmation dialog
    showDialog({
      title: 'Clear All Entries',
      message: 'Are you sure you want to clear all your entries? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          // Clear local state
          setSelections({});
          setSubmitted(false);
          setOriginalSubmittedSelections(null);
          
          // Clear draft from localStorage
          if (username) {
            const draftKey = `family_bowl_draft_${username}`;
            localStorage.removeItem(draftKey);
          }
          
          // Delete submission from database
          const success = await deleteSubmission(username);
          if (success) {
            // Scroll to top to show confirmation
            window.scrollTo({ top: 0, behavior: 'smooth' });
            showAlert('All entries cleared successfully.', 'success');
          } else {
            showAlert('Failed to clear entries. Please try again.', 'error');
          }
        } catch (error) {
          console.error('Failed to clear entries:', error);
          showAlert('An error occurred while clearing entries. Please try again.', 'error');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#1A1A1A] py-4 sm:py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-4 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <img 
                  src="/logo.webp" 
                  alt="Family Bowl Logo" 
                  className="h-10 sm:h-12 w-auto flex-shrink-0 drop-shadow-lg"
                />
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                    {process.env.NEXT_PUBLIC_APP_TITLE || 'Super Bowl Prop Bets'}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-semibold">
                    Welcome, {username}! Make your selections below.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/archive"
                  className="flex-shrink-0 p-2 text-gray-600 dark:text-gray-400 hover:text-[#0D4F3C] dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors border-2 border-transparent hover:border-[#0D4F3C] dark:hover:border-green-500"
                  title="View Archive"
                  aria-label="View Archive"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </Link>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('auth_user');
                      router.push('/login');
                    }
                  }}
                  className="flex-shrink-0 p-2 text-gray-600 dark:text-gray-400 hover:text-[#0D4F3C] dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors border-2 border-transparent hover:border-[#0D4F3C] dark:hover:border-green-500"
                  title="Logout"
                  aria-label="Logout"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {picksLocked && (
            <div className="mb-6 bg-[#EF4444]/20 dark:bg-[#EF4444]/20 border-4 border-[#EF4444] dark:border-[#EF4444] text-[#EF4444] dark:text-[#EF4444] px-4 py-3 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-2">
                  <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <strong className="block font-black uppercase text-lg">Picks are LOCKED</strong>
                    <p className="text-sm mt-1 font-semibold">All picks have been locked by the administrator. You cannot modify your selections at this time.</p>
                  </div>
                </div>
                <Link
                  href="/view-picks"
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap text-center shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  View All Picks
                </Link>
              </div>
            </div>
          )}

          {submitted && !picksLocked && (
            <div className="mb-6 bg-[#10B981]/20 dark:bg-[#10B981]/20 border-4 border-[#10B981] dark:border-[#10B981] text-[#10B981] dark:text-[#10B981] px-4 py-3 rounded-xl font-bold">
              Your selections have been saved successfully! You can edit them at any time.
            </div>
          )}

          {bets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No bets have been configured yet.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Please contact an &apos;Uncle Jim&apos; to set up the prop bets.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={`space-y-4 sm:space-y-6 ${picksLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                {bets.map((bet) => {
                  const betTypeDef = betTypes.find(bt => bt.id === bet.type);
                  const isIntegerRange = betTypeDef?.isIntegerRange || false;
                  
                  return (
                    <div key={bet.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start pb-6 md:pb-8 border-b-4 border-gray-300 dark:border-gray-700 last:border-b-0">
                      {/* Left Column: Bet Question */}
                      <div className="md:pr-4">
                        <label className="block text-base sm:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                          {bet.question}
                        </label>
                        {isIntegerRange && betTypeDef && (
                          <span className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 font-bold uppercase">
                            Range: {betTypeDef.minValue} - {betTypeDef.maxValue}
                          </span>
                        )}
                      </div>
                      {/* Right Column: Response Input */}
                      <div className="md:pl-4">
                        <BetInput
                          bet={bet}
                          value={selections[bet.id] || ''}
                          onChange={handleSelectionChange}
                          disabled={picksLocked}
                          showLabel={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t-4 border-gray-300 dark:border-gray-700 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={!allBetsAnswered || submitting || picksLocked}
                    className={`
                      flex-1 py-4 px-6 rounded-xl font-black uppercase tracking-wider transition-all shadow-lg
                      ${
                        allBetsAnswered && !submitting && !picksLocked
                          ? 'bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {picksLocked
                      ? 'Picks are Locked - Cannot Submit'
                      : submitting
                      ? (hasChanges ? 'Updating...' : 'Saving...')
                      : allBetsAnswered
                      ? (hasChanges ? 'Update Selections' : 'Submit Selections')
                      : `Please answer all ${bets.length} bets to submit`}
                  </button>
                  
                  {Object.keys(selections).length > 0 && !picksLocked && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-6 py-4 bg-gradient-to-r from-[#EF4444] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all whitespace-nowrap"
                    >
                      Clear All Entries
                    </button>
                  )}
                </div>
              </div>
            </form>
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
    </div>
  );
}

