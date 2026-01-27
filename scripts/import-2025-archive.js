/**
 * Script to import 2025 archive data from Excel file
 * Run with: node scripts/import-2025-archive.js
 */

const XLSX = require('xlsx');
const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local if it exists
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (error) {
  console.warn('Warning: Could not load .env.local:', error.message);
}

const EXCEL_FILE = path.join(__dirname, '..', 'SuperBowl-PropBet-Tracker.xlsx');
const YEAR = 2025;

async function importArchive() {
  // Initialize database client
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env.local');
    process.exit(1);
  }

  const db = createClient({
    url,
    authToken,
  });

  try {
    // Read Excel file
    console.log(`Reading Excel file: ${EXCEL_FILE}`);
    if (!fs.existsSync(EXCEL_FILE)) {
      console.error(`Error: Excel file not found at ${EXCEL_FILE}`);
      process.exit(1);
    }

    const workbook = XLSX.readFile(EXCEL_FILE);
    
    // Get sheet names
    console.log('Available sheets:', workbook.SheetNames);
    
    // Try to find a sheet for 2025 or use the first sheet
    let sheetName = workbook.SheetNames.find(name => name.includes('2025')) || workbook.SheetNames[0];
    console.log(`Using sheet: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!jsonData || jsonData.length === 0) {
      console.error('Error: Excel sheet is empty');
      process.exit(1);
    }

    // Parse data
    console.log('Parsing Excel data...');
    console.log('First few rows:');
    jsonData.slice(0, 5).forEach((row, i) => {
      console.log(`Row ${i}:`, row.slice(0, 10));
    });

    // Based on the structure:
    // Row 0: Empty, Empty, Empty, then usernames starting at column 3
    // Row 1: Empty, Empty, Empty, "Result", then result values
    // Row 2+: Bet number, Question, Type, then user selections
    
    const usernamesRow = jsonData[0];
    const resultsRow = jsonData[1];
    
    // Extract usernames from row 0, starting at column 3 (index 3)
    const usernames = [];
    for (let i = 3; i < usernamesRow.length; i++) {
      const username = String(usernamesRow[i] || '').trim();
      if (username && username !== '') {
        usernames.push(username);
      }
    }
    console.log(`Found ${usernames.length} usernames:`, usernames.slice(0, 5));
    
    // Results are not stored in row 1 (that's points per user)
    // We'll leave results empty - they may need to be entered manually
    // OR check if there's a results column in each bet row
    const results = {};
    
    // Extract bet questions from rows starting at row 2
    const bets = [];
    const submissionsData = {}; // username -> array of selections
    
    // Initialize submissions data structure
    usernames.forEach(username => {
      submissionsData[username] = {};
    });
    
    // Process bet rows (starting at row 2)
    for (let i = 2; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      // Check if this is a bet row - should have a number in first column
      const betNum = row[0];
      if (betNum === undefined || betNum === null || betNum === '') {
        continue; // Skip non-bet rows
      }
      
      const question = String(row[1] || '').trim();
      if (!question || question === '') {
        continue; // Skip rows without questions
      }
      
      const type = String(row[2] || '').trim() || 'Y/N';
      const betId = `bet-${YEAR}-${bets.length + 1}`;
      
      bets.push({
        id: betId,
        question: question,
        type: type,
        teamNames: extractTeamNames(question, type)
      });
      
      // Extract selections for each user (starting at column 3)
      const selectionsForThisBet = {};
      usernames.forEach((username, userIndex) => {
        const selectionValue = row[3 + userIndex];
        if (selectionValue !== undefined && selectionValue !== null && selectionValue !== '') {
          const cleanValue = String(selectionValue).trim();
          selectionsForThisBet[username] = cleanValue;
          submissionsData[username][betId] = cleanValue;
        }
      });
      
      // Try to infer result from the correct/incorrect row (row after bet)
      // If there's a row with 1s and 0s, the result is likely the answer that most people got right
      const nextRow = jsonData[i + 1];
      if (nextRow && nextRow.length > 4) {
        // Count how many people got each answer correct
        const answerCounts = {};
        usernames.forEach((username, userIndex) => {
          const isCorrect = nextRow[4 + userIndex]; // 1 = correct, 0 = incorrect
          const userAnswer = selectionsForThisBet[username];
          if (userAnswer && isCorrect === 1) {
            answerCounts[userAnswer] = (answerCounts[userAnswer] || 0) + 1;
          }
        });
        
        // The result is likely the answer with the most correct responses
        // But only if there's a clear winner (not a tie)
        const sortedAnswers = Object.entries(answerCounts)
          .sort((a, b) => b[1] - a[1]);
        
        if (sortedAnswers.length > 0 && sortedAnswers[0][1] > 0) {
          // Check if it's clearly the most common correct answer
          const topAnswer = sortedAnswers[0][0];
          const topCount = sortedAnswers[0][1];
          const secondCount = sortedAnswers.length > 1 ? sortedAnswers[1][1] : 0;
          
          // If the top answer has significantly more correct responses, use it
          if (topCount > secondCount || sortedAnswers.length === 1) {
            results[betId] = topAnswer;
          }
        }
      }
    }
    
    console.log(`Found ${bets.length} bets`);
    console.log('Sample bets:', bets.slice(0, 3).map(b => b.question));
    console.log(`Found ${Object.keys(results).length} results`);


    // Convert submissionsData to submissions array
    const submissions = Object.entries(submissionsData).map(([username, selections]) => {
      if (Object.keys(selections).length > 0) {
        return {
          username: username,
          selections: selections,
          timestamp: Date.now()
        };
      }
      return null;
    }).filter(s => s !== null);

    console.log(`Found ${submissions.length} submissions`);

    // Save to database
    console.log('Saving to database...');
    
    // Create year if it doesn't exist
    await db.execute(`
      INSERT OR IGNORE INTO archive_years (year, created_at)
      VALUES (?, ?)
    `, [YEAR, Math.floor(Date.now() / 1000)]);

    // Delete existing data for this year
    await db.execute('DELETE FROM archive_results WHERE year = ?', [YEAR]);
    await db.execute('DELETE FROM archive_submissions WHERE year = ?', [YEAR]);
    await db.execute('DELETE FROM archive_bets WHERE year = ?', [YEAR]);

    // Insert bets
    for (let i = 0; i < bets.length; i++) {
      const bet = bets[i];
      await db.execute(`
        INSERT INTO archive_bets (id, year, question, type, team_names, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        bet.id,
        YEAR,
        bet.question,
        bet.type,
        bet.teamNames ? JSON.stringify(bet.teamNames) : null,
        i
      ]);
    }

    // Insert submissions (use INSERT OR REPLACE to handle duplicates)
    for (const submission of submissions) {
      await db.execute(`
        INSERT OR REPLACE INTO archive_submissions (id, year, username, selections, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `, [
        `archive-${YEAR}-${submission.username}`,
        YEAR,
        submission.username,
        JSON.stringify(submission.selections),
        Math.floor((submission.timestamp || Date.now()) / 1000)
      ]);
    }

    // Insert results
    for (const [betId, result] of Object.entries(results)) {
      await db.execute(`
        INSERT INTO archive_results (id, year, bet_id, result)
        VALUES (?, ?, ?, ?)
      `, [
        `archive-result-${YEAR}-${betId}`,
        YEAR,
        betId,
        result
      ]);
    }

    console.log(`\n✅ Successfully imported ${YEAR} archive!`);
    console.log(`   - ${bets.length} bets`);
    console.log(`   - ${submissions.length} submissions`);
    console.log(`   - ${Object.keys(results).length} results`);

  } catch (error) {
    console.error('Error importing archive:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

function inferBetType(question) {
  const q = question.toLowerCase();
  
  if (q.includes('over/under') || (q.includes('over') && q.includes('under'))) {
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
    return 'TEAM';
  }
  
  return 'Y/N';
}

function extractTeamNames(question, type) {
  if (type !== 'TEAM') {
    return undefined;
  }
  
  // Try to extract team names - this is a simple implementation
  // May need adjustment based on actual data
  const q = question.toLowerCase();
  
  // Common patterns
  if (q.includes('kc') || q.includes('kansas city')) {
    return { option1: 'KC', option2: 'SF' };
  }
  if (q.includes('sf') || q.includes('san francisco')) {
    return { option1: 'KC', option2: 'SF' };
  }
  
  return { option1: 'Team1', option2: 'Team2' };
}

function parseTimestamp(value) {
  if (typeof value === 'number') {
    if (value > 1000000000000) {
      return value;
    } else if (value > 1000000000) {
      return value * 1000;
    } else {
      // Excel serial date
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

// Run the import
importArchive().then(() => {
  console.log('\nImport complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
