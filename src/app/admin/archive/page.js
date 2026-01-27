'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { getArchiveYears, deleteArchiveYear, saveArchiveData } from '../../../lib/storage';
import { getBets, getAllSubmissions, getBetResults } from '../../../lib/storage';
import { parseExcelArchive } from '../../../lib/importArchive';
import AlertDialog from '../../../components/AlertDialog';
import Alert from '../../../components/Alert';
import { useDialog, useAlert } from '../../../hooks/useDialog';
import SuperBowlLogo from '../../../components/SuperBowlLogo';
import { getSuperBowlNumber, toRomanNumeral } from '../../../utils/superbowlLogos';

export default function AdminArchivePage() {
  const router = useRouter();
  const [archiveYears, setArchiveYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [importing, setImporting] = useState(false);
  const { dialogState, showDialog, hideDialog } = useDialog();
  const { alertState, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    loadArchiveYears();
  }, []);

  const loadArchiveYears = async () => {
    try {
      const years = await getArchiveYears();
      setArchiveYears(years || []);
    } catch (error) {
      console.error('Error loading archive years:', error);
      setArchiveYears([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveCurrentYear = () => {
    const currentYear = new Date().getFullYear();
    
    showDialog({
      title: 'Archive Current Year',
      message: `Are you sure you want to archive the data for ${currentYear}? This will create a permanent record of this year's bets, submissions, and results.`,
      type: 'warning',
      confirmText: 'Archive',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setArchiving(true);
        try {
          // Get current year data
          const [bets, submissions, results] = await Promise.all([
            getBets(),
            getAllSubmissions(),
            getBetResults()
          ]);

          if (!bets || bets.length === 0) {
            showAlert('No bets to archive. Please create bets first.', 'error');
            setArchiving(false);
            return;
          }

          if (!submissions || submissions.length === 0) {
            showAlert('No submissions to archive. Please ensure users have submitted their picks.', 'error');
            setArchiving(false);
            return;
          }

          // Save archive data
          const success = await saveArchiveData(currentYear, bets, submissions, results);
          
          if (success) {
            showAlert(`Successfully archived ${currentYear} data!`, 'success');
            await loadArchiveYears();
          } else {
            showAlert('Failed to archive data. Please try again.', 'error');
          }
        } catch (error) {
          console.error('Error archiving data:', error);
          showAlert('An error occurred while archiving. Please try again.', 'error');
        } finally {
          setArchiving(false);
        }
      }
    });
  };

  const handleDeleteYear = (year) => {
    showDialog({
      title: 'Delete Archive Year',
      message: `Are you sure you want to permanently delete the archive for ${year}? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const success = await deleteArchiveYear(year);
          if (success) {
            showAlert(`Successfully deleted archive for ${year}`, 'success');
            await loadArchiveYears();
          } else {
            showAlert('Failed to delete archive. Please try again.', 'error');
          }
        } catch (error) {
          console.error('Error deleting archive:', error);
          showAlert('An error occurred while deleting. Please try again.', 'error');
        }
      }
    });
  };

  const handleImportExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setImporting(true);
      try {
        // Prompt for year
        const yearInput = prompt('Enter the year for this archive (e.g., 2025):');
        if (!yearInput) {
          setImporting(false);
          return;
        }
        
        const year = parseInt(yearInput, 10);
        if (isNaN(year) || year < 2000 || year > 2100) {
          showAlert('Invalid year. Please enter a year between 2000 and 2100.', 'error');
          setImporting(false);
          return;
        }

        // Parse Excel file
        const archiveData = await parseExcelArchive(file, year);
        
        if (!archiveData.bets || archiveData.bets.length === 0) {
          showAlert('No bets found in Excel file.', 'error');
          setImporting(false);
          return;
        }

        if (!archiveData.submissions || archiveData.submissions.length === 0) {
          showAlert('No submissions found in Excel file.', 'error');
          setImporting(false);
          return;
        }

        // Save archive data
        const success = await saveArchiveData(
          year,
          archiveData.bets,
          archiveData.submissions,
          archiveData.results || {}
        );

        if (success) {
          showAlert(`Successfully imported ${year} archive from Excel!`, 'success');
          await loadArchiveYears();
        } else {
          showAlert('Failed to import archive. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Error importing Excel:', error);
        showAlert(`Import error: ${error.message}`, 'error');
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#1A1A1A] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.webp" 
                  alt="Family Bowl Logo" 
                  className="h-10 sm:h-12 w-auto flex-shrink-0 drop-shadow-lg"
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                    Archive Management
                  </h1>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-semibold">
                    Manage historical Super Bowl prop bet results
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="px-5 py-3 text-gray-700 dark:text-gray-300 hover:text-[#0D4F3C] dark:hover:text-green-400 rounded-xl text-sm font-black uppercase tracking-wider border-4 border-gray-400 dark:border-gray-600 hover:border-[#0D4F3C] dark:hover:border-green-500 transition-all"
              >
                Back to Admin
              </button>
            </div>
          </div>

          <div className="space-y-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                    Archive Current Year
                  </h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Create a permanent archive of the current year&apos;s bets, submissions, and results.
                  </p>
                </div>
                <button
                  onClick={handleArchiveCurrentYear}
                  disabled={archiving}
                  className={`
                    px-6 py-3 rounded-xl font-black uppercase tracking-wider transition-all shadow-lg whitespace-nowrap
                    ${
                      archiving
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white hover:shadow-xl transform hover:scale-105'
                    }
                  `}
                >
                  {archiving ? 'Archiving...' : `Archive ${new Date().getFullYear()}`}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                    Import from Excel
                  </h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Import historical archive data from an Excel file. File should have headers: Username, Timestamp, then bet questions.
                  </p>
                </div>
                <button
                  onClick={handleImportExcel}
                  disabled={importing}
                  className={`
                    px-6 py-3 rounded-xl font-black uppercase tracking-wider transition-all shadow-lg whitespace-nowrap
                    ${
                      importing
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-xl transform hover:scale-105'
                    }
                  `}
                >
                  {importing ? 'Importing...' : 'Import Excel File'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
                Archived Years
              </h2>
              
              {archiveYears.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No archived years yet.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Archive the current year to preserve this year&apos;s results.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {archiveYears.map((yearData) => (
                    <div
                      key={yearData.year}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-4">
                        <SuperBowlLogo year={yearData.year} size={50} />
                        <div>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white">
                            {yearData.year} - Super Bowl {getSuperBowlNumber(yearData.year)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Archived {new Date(yearData.created_at * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        <Link
                          href={`/archive/${yearData.year}`}
                          className="px-4 py-2 bg-[#0D4F3C] dark:bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 dark:hover:bg-green-700 transition-colors"
                        >
                          View Archive
                        </Link>
                      </div>
                      <button
                        onClick={() => handleDeleteYear(yearData.year)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
