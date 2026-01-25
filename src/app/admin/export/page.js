'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { exportSubmissionsToXLSX } from '../../../lib/export';
import { getAllSubmissions } from '../../../lib/storage';
import { getBets } from '../../../lib/storage';

export default function AdminExportPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [bets, setBets] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setSubmissions(getAllSubmissions());
    setBets(getBets());
  }, []);

  const handleExport = () => {
    if (submissions.length === 0) {
      setExportMessage('No submissions to export.');
      return;
    }

    if (bets.length === 0) {
      setExportMessage('No bets configured. Please configure bets first.');
      return;
    }

    setExporting(true);
    setExportMessage('');

    try {
      const result = exportSubmissionsToXLSX();
      if (result.success) {
        setExportMessage(`Successfully exported ${submissions.length} submissions to ${result.fileName}`);
      } else {
        setExportMessage(`Export failed: ${result.error}`);
      }
    } catch (error) {
      setExportMessage(`Export error: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

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
                  Export Submissions
                </h1>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  Download all submissions as an Excel spreadsheet
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

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 border-[#0D4F3C] dark:border-green-600 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Export Information
              </h2>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-black uppercase">Total Submissions:</span> {submissions.length}
                </p>
                <p>
                  <span className="font-black uppercase">Total Bets:</span> {bets.length}
                </p>
                <p className="text-sm mt-4">
                  The export will include all user submissions with their selections for each bet.
                  The file will be downloaded automatically in XLSX format.
                </p>
              </div>
            </div>

            {exportMessage && (
              <div
                className={`mb-6 px-4 py-3 rounded ${
                  exportMessage.includes('Successfully')
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}
              >
                {exportMessage}
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={exporting || submissions.length === 0 || bets.length === 0}
              className={`
                w-full py-4 px-6 rounded-xl font-black uppercase tracking-wider shadow-lg transition-all
                ${
                  exporting || submissions.length === 0 || bets.length === 0
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white hover:shadow-xl transform hover:scale-105'
                }
              `}
            >
              {exporting
                ? 'Exporting...'
                : submissions.length === 0
                ? 'No Submissions to Export'
                : bets.length === 0
                ? 'No Bets Configured'
                : 'Export to Excel'}
            </button>

            {submissions.length > 0 && bets.length > 0 && (
              <div className="mt-6 p-4 bg-[#0D4F3C]/20 dark:bg-green-700/20 border-4 border-[#0D4F3C] dark:border-green-600 rounded-xl">
                <p className="text-sm text-gray-900 dark:text-white font-bold">
                  <strong>Note:</strong> The exported file will contain one row per user with
                  columns for username, timestamp, and each bet question. The file will be named
                  with a timestamp (e.g., submissions_2024-01-15T10-30-00.xlsx).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

