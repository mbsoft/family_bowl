/**
 * Script to import 2024 archive data from Excel file
 * Run with: node scripts/import-2024-archive.js
 * 
 * Excel structure:
 * - Row 0: Usernames starting at column E (index 4)
 * - Row 1: Point totals starting at column E (index 4), "Result" in column D
 * - Row 2+: Bet data
 *   - Column A: Bet number
 *   - Column B: Question
 *   - Column C: Type
 *   - Column D: Result
 *   - Column E+: User selections
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

const EXCEL_FILE = path.join(__dirname, '..', 'Untitled spreadsheet (1).xlsx');
const YEAR = 2024;

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
    const sheetName = workbook.SheetNames[0];
    console.log(`Using sheet: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!jsonData || jsonData.length === 0) {
      console.error('Error: Excel sheet is empty');
      process.exit(1);
    }

    // Parse data
    console.log('Parsing Excel data...');

    // Extract usernames from row 0, starting at column E (index 4)
    const usernames = [];
    for (let i = 4; i < jsonData[0].length; i++) {
      const username = String(jsonData[0][i] || '').trim();
      if (username && username !== '') {
        usernames.push(username);
      }
    }
    console.log(`Found ${usernames.length} usernames:`, usernames);

    // Extract point totals from row 1 for verification
    const expectedPoints = {};
    for (let i = 0; i < usernames.length; i++) {
      const points = jsonData[1][4 + i];
      if (points !== undefined && points !== null && points !== '') {
        expectedPoints[usernames[i]] = parseInt(points, 10);
      }
    }
    console.log('Expected point totals:', expectedPoints);

    // Extract bets and results
    const bets = [];
    const results = {};
    const submissionsData = {};
    
    // Initialize submissions data structure
    usernames.forEach(username => {
      submissionsData[username] = {};
    });

    // Process bet rows (starting at row 2, every other row is a bet)
    for (let i = 2; i < jsonData.length; i += 2) {
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
      let result = String(row[3] || '').trim();
      
      // Special handling for tiebreaker - if result is empty, check if it's a tiebreaker question
      if (!result || result === '' || result === ' ') {
        if (question.toLowerCase().includes('tie breaker')) {
          // For 2024, the tiebreaker result was 47 (total points scored in Super Bowl LVIII)
          // KC 25 + SF 22 = 47
          // Note: With result 47, Lee (41, diff: 6) would be closest
          // But user indicated Corey wins, so checking if result might be different
          // Using 47 as the actual game result
          result = '47';
        }
      }
      
      const betId = `bet-${YEAR}-${bets.length + 1}`;
      
      bets.push({
        id: betId,
        question: question,
        type: type,
        teamNames: extractTeamNames(question, type)
      });

      // Store result
      if (result && result !== '' && result !== ' ') {
        results[betId] = result;
      }
      
      // Extract selections for each user (starting at column E, index 4)
      usernames.forEach((username, userIndex) => {
        const selectionValue = row[4 + userIndex];
        if (selectionValue !== undefined && selectionValue !== null && selectionValue !== '') {
          submissionsData[username][betId] = String(selectionValue).trim();
        }
      });
    }

    console.log(`Found ${bets.length} bets`);
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
    console.log('\nSaving to database...');
    
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

    // Insert submissions
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

    // Verify point totals
    console.log('\n📊 Verifying point totals...');
    const calculatedPoints = {};
    
    submissions.forEach(submission => {
      let points = 0;
      bets.forEach(bet => {
        const result = results[bet.id];
        if (result && submission.selections[bet.id]) {
          const userSelection = submission.selections[bet.id];
          if (String(userSelection).trim() === String(result).trim()) {
            points += 1;
          }
        }
      });
      calculatedPoints[submission.username] = points;
    });

    // Compare with expected points
    let allMatch = true;
    usernames.forEach(username => {
      const expected = expectedPoints[username];
      const calculated = calculatedPoints[username] || 0;
      const match = expected === calculated ? '✅' : '❌';
      console.log(`   ${match} ${username}: Expected ${expected}, Calculated ${calculated}`);
      if (expected !== calculated) {
        allMatch = false;
      }
    });

    if (allMatch) {
      console.log('\n✅ All point totals match!');
    } else {
      console.log('\n⚠️  Some point totals do not match. Please verify.');
    }

    // Determine and verify winner
    console.log('\n🏆 Determining winner...');
    const userPoints = usernames.map(username => ({
      username: username,
      points: calculatedPoints[username] || 0
    }));

    const maxPoints = Math.max(...userPoints.map(u => u.points));
    const topUsers = userPoints.filter(u => u.points === maxPoints);

    console.log(`   Maximum points: ${maxPoints}`);
    console.log(`   Users with max points: ${topUsers.map(u => u.username).join(', ')}`);

    if (topUsers.length === 1) {
      console.log(`   ✅ Winner: ${topUsers[0].username}`);
    } else {
      console.log(`   ⚠️  Tie detected! Checking tiebreaker...`);
      
      // Find tiebreaker bet
      const tieBreakerBet = bets.find(bet => 
        bet.question.toLowerCase().includes('tie breaker')
      );

      if (tieBreakerBet && results[tieBreakerBet.id]) {
        const tieBreakerResult = parseInt(results[tieBreakerBet.id], 10);
        if (!isNaN(tieBreakerResult)) {
          console.log(`   Tiebreaker question: ${tieBreakerBet.question}`);
          console.log(`   Tiebreaker result: ${tieBreakerResult}`);
          
          let winner = topUsers[0].username;
          let closestDiff = Infinity;

          topUsers.forEach(user => {
            const submission = submissions.find(s => s.username === user.username);
            if (submission && submission.selections[tieBreakerBet.id]) {
              const userAnswer = parseInt(submission.selections[tieBreakerBet.id], 10);
              if (!isNaN(userAnswer)) {
                const diff = Math.abs(userAnswer - tieBreakerResult);
                console.log(`     ${user.username}: ${userAnswer} (diff: ${diff})`);
                if (diff < closestDiff) {
                  closestDiff = diff;
                  winner = user.username;
                }
              }
            }
          });

          console.log(`   ✅ Winner (tiebreaker): ${winner}`);
          
          // Note: If user indicated a different winner, the tiebreaker result in the sheet
          // might be different from the actual game result
          if (winner !== 'Corey' && topUsers.some(u => u.username === 'Corey')) {
            console.log(`   ⚠️  Note: Calculated winner is ${winner}, but user indicated Corey should win.`);
            console.log(`   ⚠️  Please verify the tiebreaker result in the Excel sheet.`);
          }
        } else {
          console.log(`   ⚠️  Tiebreaker result is not a number`);
        }
      } else {
        console.log(`   ⚠️  No tiebreaker found or no result`);
      }
    }

  } catch (error) {
    console.error('Error importing archive:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

function extractTeamNames(question, type) {
  if (type !== 'TEAM' && !type.includes('/')) {
    return undefined;
  }
  
  // Try to extract team names from question or type
  const q = question.toLowerCase();
  
  if (q.includes('sf') || q.includes('san francisco')) {
    return { option1: 'SF', option2: 'KC' };
  }
  if (q.includes('kc') || q.includes('kansas city')) {
    return { option1: 'SF', option2: 'KC' };
  }
  
  // Check if type has team names (e.g., "SF/KC")
  if (type.includes('/')) {
    const parts = type.split('/');
    if (parts.length === 2) {
      return { option1: parts[0].trim(), option2: parts[1].trim() };
    }
  }
  
  return undefined;
}

// Run the import
importArchive().then(() => {
  console.log('\nImport complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
