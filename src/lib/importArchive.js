'use client';

import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract archive data for a specific year
 * @param {File} file - Excel file to parse
 * @param {number} year - Year to extract data for
 * @returns {Object} Archive data with bets, submissions, and results
 */
export function parseExcelArchive(file, year) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet (or look for a sheet with the year name)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        // Parse the data
        const archiveData = parseExcelData(jsonData, year);
        resolve(archiveData);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse Excel data array into archive format
 * Assumes format:
 * - First row: Headers (Username, Timestamp, Bet Questions...)
 * - Subsequent rows: User data
 * - Last row or separate sheet: Results
 */
function parseExcelData(jsonData, year) {
  if (!jsonData || jsonData.length === 0) {
    throw new Error('Excel file is empty');
  }

  // First row should be headers
  const headers = jsonData[0];
  if (!headers || headers.length < 3) {
    throw new Error('Invalid Excel format: Expected headers in first row');
  }

  // Extract bet questions (skip Username and Timestamp columns)
  const betQuestions = headers.slice(2).filter(q => q && q.trim() !== '');
  
  // Create bets array
  const bets = betQuestions.map((question, index) => {
    // Try to infer bet type from question
    const type = inferBetType(question);
    
    return {
      id: `bet-${year}-${index + 1}`,
      question: question.trim(),
      type: type,
      teamNames: extractTeamNames(question, type)
    };
  });

  // Extract submissions (skip header row)
  const submissions = [];
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;
    
    const username = String(row[0] || '').trim();
    if (!username) continue; // Skip rows without username
    
    const selections = {};
    betQuestions.forEach((question, index) => {
      const value = row[index + 2]; // Skip username and timestamp columns
      if (value !== undefined && value !== null && value !== '') {
        selections[`bet-${year}-${index + 1}`] = String(value).trim();
      }
    });

    if (Object.keys(selections).length > 0) {
      submissions.push({
        username: username,
        selections: selections,
        timestamp: row[1] ? parseTimestamp(row[1]) : Date.now()
      });
    }
  }

  // Try to find results - look for a row that starts with "Result" or "Results"
  // Or check if there's a separate results sheet
  const results = {};
  
  // Look for results in the same sheet (row starting with "Result" or "Results")
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && row.length > 0) {
      const firstCell = String(row[0] || '').toLowerCase().trim();
      if (firstCell === 'result' || firstCell === 'results') {
        // This row contains results
        betQuestions.forEach((question, index) => {
          const resultValue = row[index + 2];
          if (resultValue !== undefined && resultValue !== null && resultValue !== '') {
            results[`bet-${year}-${index + 1}`] = String(resultValue).trim();
          }
        });
        break;
      }
    }
  }

  return {
    bets,
    submissions,
    results
  };
}

/**
 * Infer bet type from question text
 */
function inferBetType(question) {
  const q = question.toLowerCase();
  
  if (q.includes('over/under') || q.includes('over') || q.includes('under')) {
    return 'O/U';
  }
  if (q.includes('coin toss') || q.includes('heads') || q.includes('tails')) {
    return 'H or T';
  }
  if (q.includes('yes/no') || q.includes('will there') || q.includes('will the')) {
    return 'Y/N';
  }
  if (q.includes('odd/even') || q.includes('odd or even')) {
    return 'O/E';
  }
  if (q.includes('team') || q.includes('which team') || q.includes('winner')) {
    // Will need team names
    return 'TEAM';
  }
  
  // Default to Y/N if we can't determine
  return 'Y/N';
}

/**
 * Extract team names from question if it's a team selection
 */
function extractTeamNames(question, type) {
  if (type !== 'TEAM') {
    return undefined;
  }
  
  // Try to extract team names from common patterns
  // This is a simple implementation - may need adjustment based on actual data
  const q = question.toLowerCase();
  
  // Look for common team abbreviations or names
  // This is a placeholder - actual implementation would need to parse the Excel better
  return {
    option1: 'Team1',
    option2: 'Team2'
  };
}

/**
 * Parse timestamp from various formats
 */
function parseTimestamp(value) {
  if (typeof value === 'number') {
    // Excel serial date or Unix timestamp
    if (value > 1000000000000) {
      // Unix timestamp in milliseconds
      return value;
    } else if (value > 1000000000) {
      // Unix timestamp in seconds
      return value * 1000;
    } else {
      // Excel serial date (days since 1900-01-01)
      return (value - 25569) * 86400 * 1000;
    }
  }
  
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  return Date.now();
}
