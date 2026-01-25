'use client';

/**
 * Storage utilities for managing data via Turso database API
 */

/**
 * Helper function to call database API
 */
async function dbCall(action, params = {}) {
  try {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...params }),
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || response.statusText;
        if (errorData.details) {
          console.error('API error details:', errorData.details);
        }
      } catch (e) {
        // If we can't parse the error, use status text
      }
      throw new Error(`API call failed: ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Database API error (${action}):`, error);
    console.error('Action:', action, 'Params:', params);
    throw error;
  }
}

/**
 * Get all bet definitions
 */
export async function getBets() {
  try {
    return await dbCall('getBets');
  } catch (e) {
    console.error('Failed to get bets:', e);
    return [];
  }
}

/**
 * Save bet definitions
 */
export async function saveBets(bets) {
  try {
    await dbCall('saveBets', { bets });
    return true;
  } catch (e) {
    console.error('Failed to save bets:', e);
    return false;
  }
}

/**
 * Get a user's submission
 */
export async function getSubmission(username) {
  if (!username) {
    return null;
  }
  try {
    return await dbCall('getSubmission', { username });
  } catch (e) {
    console.error('Failed to get submission:', e);
    return null;
  }
}

/**
 * Save or update a user's submission
 */
export async function saveSubmission(submission) {
  if (!submission || !submission.username) {
    return false;
  }
  try {
    await dbCall('saveSubmission', { submission });
    return true;
  } catch (e) {
    console.error('Failed to save submission:', e);
    return false;
  }
}

/**
 * Get all submissions (admin only)
 */
export async function getAllSubmissions() {
  try {
    return await dbCall('getAllSubmissions');
  } catch (e) {
    console.error('Failed to get all submissions:', e);
    return [];
  }
}

/**
 * Delete a submission (admin only)
 */
export async function deleteSubmission(username) {
  if (!username) {
    return false;
  }
  try {
    await dbCall('deleteSubmission', { username });
    return true;
  } catch (e) {
    console.error('Failed to delete submission:', e);
    return false;
  }
}

/**
 * Get all bet type definitions
 */
export async function getBetTypes() {
  try {
    return await dbCall('getBetTypes');
  } catch (e) {
    console.error('Failed to get bet types:', e);
    return [];
  }
}

/**
 * Save bet type definitions
 */
export async function saveBetTypes(betTypes) {
  try {
    await dbCall('saveBetTypes', { betTypes });
    return true;
  } catch (e) {
    console.error('Failed to save bet types:', e);
    return false;
  }
}

/**
 * Check if picks are locked
 */
export async function arePicksLocked() {
  try {
    return await dbCall('arePicksLocked');
  } catch (e) {
    console.error('Failed to check picks lock status:', e);
    return false;
  }
}

/**
 * Set picks lock status (admin only)
 */
export async function setPicksLocked(locked) {
  try {
    await dbCall('setPicksLocked', { locked });
    return true;
  } catch (e) {
    console.error('Failed to set picks lock status:', e);
    return false;
  }
}

/**
 * Generate a new invite
 * @param {string} username - Optional default username to encode in the invite
 */
export async function generateInvite(username = null) {
  try {
    return await dbCall('generateInvite', { defaultUsername: username });
  } catch (e) {
    console.error('Failed to generate invite:', e);
    return null;
  }
}

/**
 * Get all invites
 */
export async function getInvites() {
  try {
    return await dbCall('getInvites');
  } catch (e) {
    console.error('Failed to get invites:', e);
    return [];
  }
}

/**
 * Get invite by token
 */
export async function getInviteByToken(token) {
  if (!token) {
    return null;
  }
  try {
    return await dbCall('getInviteByToken', { token });
  } catch (e) {
    console.error('Failed to get invite by token:', e);
    return null;
  }
}

/**
 * Mark invite as used
 */
export async function markInviteUsed(token, username) {
  if (!token || !username) {
    return false;
  }
  try {
    await dbCall('markInviteUsed', { token, username });
    return true;
  } catch (e) {
    console.error('Failed to mark invite as used:', e);
    return false;
  }
}

/**
 * Delete an invite
 */
export async function deleteInvite(token) {
  if (!token) {
    return false;
  }
  try {
    await dbCall('deleteInvite', { token });
    return true;
  } catch (e) {
    console.error('Failed to delete invite:', e);
    return false;
  }
}

/**
 * Get all user credentials
 */
export async function getUserCredentials() {
  try {
    return await dbCall('getUserCredentials');
  } catch (e) {
    console.error('Failed to get user credentials:', e);
    return {};
  }
}

/**
 * Save user credentials
 */
export async function saveUserCredentials(username, password, inviteToken) {
  if (!username || !password) {
    return { success: false, error: 'Username and password are required' };
  }
  try {
    const result = await dbCall('saveUserCredentials', { username, password, inviteToken });
    return result;
  } catch (e) {
    console.error('Failed to save user credentials:', e);
    return { success: false, error: 'Failed to save credentials' };
  }
}

/**
 * Validate user credentials
 */
export async function validateUserCredentials(username, password) {
  if (!username || !password) {
    return false;
  }
  try {
    return await dbCall('validateUserCredentials', { username, password });
  } catch (e) {
    console.error('Failed to validate user credentials:', e);
    return false;
  }
}

/**
 * Delete a user
 */
export async function deleteUser(username) {
  if (!username) {
    return false;
  }
  try {
    const result = await dbCall('deleteUser', { username });
    return result?.success || false;
  } catch (e) {
    console.error('Failed to delete user:', e);
    return false;
  }
}

/**
 * Get all bet results
 */
export async function getBetResults() {
  try {
    return await dbCall('getBetResults');
  } catch (e) {
    console.error('Failed to get bet results:', e);
    return {};
  }
}

/**
 * Get result for a specific bet
 */
export async function getBetResult(betId) {
  if (!betId) {
    return null;
  }
  try {
    return await dbCall('getBetResult', { betId });
  } catch (e) {
    console.error('Failed to get bet result:', e);
    return null;
  }
}

/**
 * Save bet result
 */
export async function saveBetResult(betId, result) {
  if (!betId || !result) {
    return false;
  }
  try {
    await dbCall('saveBetResult', { betId, result });
    return true;
  } catch (e) {
    console.error('Failed to save bet result:', e);
    return false;
  }
}

/**
 * Delete bet result
 */
export async function deleteBetResult(betId) {
  if (!betId) {
    return false;
  }
  try {
    await dbCall('deleteBetResult', { betId });
    return true;
  } catch (e) {
    console.error('Failed to delete bet result:', e);
    return false;
  }
}
