import { NextResponse } from 'next/server';
import { getDbClient, initDatabase } from '../../../lib/db';

// Initialize database on first import
let dbInitialized = false;
let dbInitializing = false;
async function ensureDbInitialized() {
  if (dbInitialized) {
    return;
  }
  if (dbInitializing) {
    // Wait for initialization to complete
    while (dbInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }
  dbInitializing = true;
  try {
    await initDatabase();
    dbInitialized = true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.error('Error stack:', error.stack);
    throw error;
  } finally {
    dbInitializing = false;
  }
}

export async function POST(request) {
  try {
    await ensureDbInitialized();
    const db = getDbClient();
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const { action, ...params } = body;
    
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    switch (action) {
      case 'getBets': {
        const result = await db.execute('SELECT * FROM bets ORDER BY display_order ASC, created_at ASC');
        return NextResponse.json(result.rows.map(row => ({
          id: row.id,
          question: row.question,
          type: row.type,
          teamNames: row.team_names ? JSON.parse(row.team_names) : undefined
        })));
      }

      case 'saveBets': {
        const { bets } = params;
        if (!bets || !Array.isArray(bets)) {
          return NextResponse.json({ error: 'Invalid bets data' }, { status: 400 });
        }
        
        try {
          await db.execute('DELETE FROM bets');
          if (bets.length > 0) {
            const now = Math.floor(Date.now() / 1000);
            for (let i = 0; i < bets.length; i++) {
              const bet = bets[i];
              try {
                await db.execute(`
                  INSERT INTO bets (id, question, type, team_names, display_order, created_at)
                  VALUES (?, ?, ?, ?, ?, ?)
                `, [
                  bet.id || `bet-${Date.now()}-${i}`,
                  bet.question || '',
                  bet.type || '',
                  bet.teamNames ? JSON.stringify(bet.teamNames) : null,
                  i,
                  now
                ]);
              } catch (error) {
                console.error('Error inserting bet:', bet, error);
                throw error;
              }
            }
          }
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('Error in saveBets:', error);
          throw error;
        }
      }

      case 'getBetTypes': {
        const result = await db.execute('SELECT * FROM bet_types ORDER BY created_at ASC');
        return NextResponse.json(result.rows.map(row => ({
          id: row.id,
          label: row.label,
          options: JSON.parse(row.options),
          optionLabels: row.option_labels ? JSON.parse(row.option_labels) : {},
          requiresTeamNames: row.requires_team_names === 1,
          isIntegerRange: row.is_integer_range === 1,
          minValue: row.min_value,
          maxValue: row.max_value
        })));
      }

      case 'saveBetTypes': {
        const { betTypes } = params;
        if (!betTypes || !Array.isArray(betTypes)) {
          return NextResponse.json({ error: 'Invalid betTypes data' }, { status: 400 });
        }
        
        try {
          // Delete all existing bet types
          await db.execute('DELETE FROM bet_types');
          
          if (betTypes.length > 0) {
            // Use batch insert for better performance and error handling
            const now = Math.floor(Date.now() / 1000);
            for (const betType of betTypes) {
              try {
                // Ensure all required fields are present with defaults
                const id = betType.id || '';
                const label = betType.label || '';
                const options = Array.isArray(betType.options) ? betType.options : [];
                const optionLabels = betType.optionLabels || {};
                const requiresTeamNames = betType.requiresTeamNames === true ? 1 : 0;
                const isIntegerRange = betType.isIntegerRange === true ? 1 : 0;
                const minValue = (betType.isIntegerRange && betType.minValue != null) ? betType.minValue : null;
                const maxValue = (betType.isIntegerRange && betType.maxValue != null) ? betType.maxValue : null;

                await db.execute(`
                  INSERT INTO bet_types (id, label, options, option_labels, requires_team_names, is_integer_range, min_value, max_value, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                  id,
                  label,
                  JSON.stringify(options),
                  JSON.stringify(optionLabels),
                  requiresTeamNames,
                  isIntegerRange,
                  minValue,
                  maxValue,
                  now
                ]);
              } catch (error) {
                console.error('Error inserting bet type:', betType, error);
                console.error('Error details:', error.message, error.stack);
                throw error;
              }
            }
          }
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('Error in saveBetTypes:', error);
          console.error('Error stack:', error.stack);
          return NextResponse.json({ 
            error: error.message || 'Failed to save bet types',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }, { status: 500 });
        }
      }

      case 'getSubmission': {
        const { username } = params;
        const result = await db.execute('SELECT * FROM submissions WHERE username = ?', [username]);
        if (result.rows.length === 0) {
          return NextResponse.json(null);
        }
        const row = result.rows[0];
        return NextResponse.json({
          username: row.username,
          timestamp: row.timestamp * 1000, // Convert to milliseconds
          selections: JSON.parse(row.selections)
        });
      }

      case 'saveSubmission': {
        const { submission } = params;
        await db.execute(`
          INSERT OR REPLACE INTO submissions (username, selections, timestamp)
          VALUES (?, ?, ?)
        `, [
          submission.username,
          JSON.stringify(submission.selections || {}),
          Math.floor((submission.timestamp || Date.now()) / 1000)
        ]);
        return NextResponse.json({ success: true });
      }

      case 'getAllSubmissions': {
        const result = await db.execute('SELECT * FROM submissions');
        return NextResponse.json(result.rows.map(row => ({
          username: row.username,
          timestamp: row.timestamp * 1000,
          selections: JSON.parse(row.selections)
        })));
      }

      case 'deleteSubmission': {
        const { username } = params;
        await db.execute('DELETE FROM submissions WHERE username = ?', [username]);
        return NextResponse.json({ success: true });
      }

      case 'arePicksLocked': {
        const result = await db.execute('SELECT value FROM app_settings WHERE key = ?', ['picks_locked']);
        const locked = result.rows.length > 0 && result.rows[0].value === 'true';
        return NextResponse.json(locked);
      }

      case 'setPicksLocked': {
        const { locked } = params;
        const now = Math.floor(Date.now() / 1000);
        await db.execute(`
          INSERT OR REPLACE INTO app_settings (key, value, updated_at)
          VALUES (?, ?, ?)
        `, ['picks_locked', locked ? 'true' : 'false', now]);
        return NextResponse.json({ success: true });
      }

      case 'getInvites': {
        const result = await db.execute('SELECT * FROM invites ORDER BY created_at DESC');
        return NextResponse.json(result.rows.map(row => ({
          token: row.token,
          defaultUsername: row.default_username,
          createdAt: row.created_at * 1000,
          used: row.used === 1,
          usedBy: row.used_by
        })));
      }

      case 'getInviteByToken': {
        const { token } = params;
        const result = await db.execute('SELECT * FROM invites WHERE token = ?', [token]);
        if (result.rows.length === 0) {
          return NextResponse.json(null);
        }
        const row = result.rows[0];
        return NextResponse.json({
          token: row.token,
          defaultUsername: row.default_username,
          createdAt: row.created_at * 1000,
          used: row.used === 1,
          usedBy: row.used_by
        });
      }

      case 'generateInvite': {
        const { defaultUsername } = params;
        const token = `invite-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        const now = Math.floor(Date.now() / 1000);
        await db.execute(`
          INSERT INTO invites (token, default_username, created_at)
          VALUES (?, ?, ?)
        `, [token, defaultUsername || null, now]);
        return NextResponse.json({
          token,
          defaultUsername: defaultUsername || null,
          createdAt: Date.now(),
          used: false,
          usedBy: null
        });
      }

      case 'markInviteUsed': {
        const { token, username } = params;
        await db.execute(`
          UPDATE invites SET used = 1, used_by = ? WHERE token = ?
        `, [username, token]);
        return NextResponse.json({ success: true });
      }

      case 'deleteInvite': {
        const { token } = params;
        await db.execute('DELETE FROM invites WHERE token = ?', [token]);
        return NextResponse.json({ success: true });
      }

      case 'getUserCredentials': {
        const result = await db.execute('SELECT * FROM user_credentials');
        const credentials = {};
        result.rows.forEach(row => {
          credentials[row.username] = {
            username: row.username,
            password: row.password,
            createdAt: row.created_at * 1000,
            createdVia: row.created_via
          };
        });
        return NextResponse.json(credentials);
      }

      case 'saveUserCredentials': {
        const { username, password, inviteToken } = params;
        // Check if username exists
        const existing = await db.execute('SELECT username FROM user_credentials WHERE username = ?', [username]);
        if (existing.rows.length > 0) {
          return NextResponse.json({ success: false, error: 'Username already exists' });
        }
        const now = Math.floor(Date.now() / 1000);
        await db.execute(`
          INSERT INTO user_credentials (username, password, created_at, created_via)
          VALUES (?, ?, ?, ?)
        `, [username, password, now, inviteToken || null]);
        return NextResponse.json({ success: true });
      }

      case 'validateUserCredentials': {
        const { username, password } = params;
        const result = await db.execute('SELECT password FROM user_credentials WHERE username = ?', [username]);
        if (result.rows.length === 0) {
          return NextResponse.json(false);
        }
        return NextResponse.json(result.rows[0].password === password);
      }

      case 'deleteUser': {
        const { username } = params;
        if (!username) {
          return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
        }
        // Don't allow deleting the admin user
        if (username.toLowerCase() === 'admin') {
          return NextResponse.json({ success: false, error: 'Cannot delete admin user' }, { status: 400 });
        }
        // Delete user's submissions first, then delete the user
        await db.execute('DELETE FROM submissions WHERE username = ?', [username]);
        await db.execute('DELETE FROM user_credentials WHERE username = ?', [username]);
        return NextResponse.json({ success: true });
      }

      case 'getBetResults': {
        const result = await db.execute('SELECT * FROM bet_results');
        const results = {};
        result.rows.forEach(row => {
          results[row.bet_id] = row.result;
        });
        return NextResponse.json(results);
      }

      case 'getBetResult': {
        const { betId } = params;
        const result = await db.execute('SELECT result FROM bet_results WHERE bet_id = ?', [betId]);
        if (result.rows.length === 0) {
          return NextResponse.json(null);
        }
        return NextResponse.json(result.rows[0].result);
      }

      case 'saveBetResult': {
        const { betId, result } = params;
        const now = Math.floor(Date.now() / 1000);
        await db.execute(`
          INSERT OR REPLACE INTO bet_results (bet_id, result, created_at)
          VALUES (?, ?, ?)
        `, [betId, result, now]);
        return NextResponse.json({ success: true });
      }

      case 'deleteBetResult': {
        const { betId } = params;
        await db.execute('DELETE FROM bet_results WHERE bet_id = ?', [betId]);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database API error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

