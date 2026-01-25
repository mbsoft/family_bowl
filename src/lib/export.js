'use client';

import * as XLSX from 'xlsx';
import { getAllSubmissions } from './storage';
import { getBets } from './storage';

/**
 * Export all submissions to XLSX format
 */
export function exportSubmissionsToXLSX() {
  const submissions = getAllSubmissions();
  const bets = getBets();

  if (submissions.length === 0) {
    return { success: false, error: 'No submissions to export' };
  }

  if (bets.length === 0) {
    return { success: false, error: 'No bets configured' };
  }

  try {
    // Create worksheet data
    const worksheetData = [];

    // Header row: Username, Timestamp, then each bet question
    const headers = ['Username', 'Timestamp', ...bets.map(bet => bet.question)];
    worksheetData.push(headers);

    // Data rows: one per submission
    submissions.forEach(submission => {
      const row = [
        submission.username,
        new Date(submission.timestamp).toLocaleString()
      ];

      // Add selection for each bet
      bets.forEach(bet => {
        const selection = submission.selections[bet.id] || '';
        row.push(selection);
      });

      worksheetData.push(row);
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Username
      { wch: 20 }, // Timestamp
      ...bets.map(() => ({ wch: 30 })) // Bet questions
    ];
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `submissions_${timestamp}.xlsx`;

    // Write file and trigger download
    XLSX.writeFile(workbook, fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
}

