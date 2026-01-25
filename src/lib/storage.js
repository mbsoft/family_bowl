'use client';

/**
 * Storage utilities for managing bets and submissions in localStorage
 */

const BETS_CONFIG_KEY = 'bets_config';
const BET_TYPES_CONFIG_KEY = 'bet_types_config';
const SUBMISSION_PREFIX = 'submission_';
const PICKS_LOCKED_KEY = 'picks_locked';
const INVITES_CONFIG_KEY = 'invites_config';
const USER_CREDENTIALS_KEY = 'user_credentials';
const BET_RESULTS_KEY = 'bet_results';

/**
 * Get all bet definitions from localStorage
 */
export function getBets() {
  if (typeof window === 'undefined') {
    return [];
  }
  const betsJson = localStorage.getItem(BETS_CONFIG_KEY);
  if (!betsJson) {
    return [];
  }
  try {
    return JSON.parse(betsJson);
  } catch (e) {
    return [];
  }
}

/**
 * Save bet definitions to localStorage
 */
export function saveBets(bets) {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    localStorage.setItem(BETS_CONFIG_KEY, JSON.stringify(bets));
    return true;
  } catch (e) {
    console.error('Failed to save bets:', e);
    return false;
  }
}

/**
 * Get a user's submission
 */
export function getSubmission(username) {
  if (typeof window === 'undefined' || !username) {
    return null;
  }
  const submissionJson = localStorage.getItem(`${SUBMISSION_PREFIX}${username}`);
  if (!submissionJson) {
    return null;
  }
  try {
    return JSON.parse(submissionJson);
  } catch (e) {
    return null;
  }
}

/**
 * Save or update a user's submission
 */
export function saveSubmission(submission) {
  if (typeof window === 'undefined' || !submission || !submission.username) {
    return false;
  }
  try {
    const submissionData = {
      username: submission.username,
      timestamp: submission.timestamp || Date.now(),
      selections: submission.selections || {}
    };
    localStorage.setItem(
      `${SUBMISSION_PREFIX}${submission.username}`,
      JSON.stringify(submissionData)
    );
    return true;
  } catch (e) {
    console.error('Failed to save submission:', e);
    return false;
  }
}

/**
 * Get all submissions (admin only)
 */
export function getAllSubmissions() {
  if (typeof window === 'undefined') {
    return [];
  }
  const submissions = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SUBMISSION_PREFIX)) {
        const username = key.replace(SUBMISSION_PREFIX, '');
        const submission = getSubmission(username);
        if (submission) {
          submissions.push(submission);
        }
      }
    }
  } catch (e) {
    console.error('Failed to get all submissions:', e);
  }
  return submissions;
}

/**
 * Delete a submission (admin only)
 */
export function deleteSubmission(username) {
  if (typeof window === 'undefined' || !username) {
    return false;
  }
  try {
    localStorage.removeItem(`${SUBMISSION_PREFIX}${username}`);
    return true;
  } catch (e) {
    console.error('Failed to delete submission:', e);
    return false;
  }
}

/**
 * Get all bet type definitions from localStorage
 */
export function getBetTypes() {
  if (typeof window === 'undefined') {
    return [];
  }
  const betTypesJson = localStorage.getItem(BET_TYPES_CONFIG_KEY);
  if (!betTypesJson) {
    return [];
  }
  try {
    return JSON.parse(betTypesJson);
  } catch (e) {
    return [];
  }
}

/**
 * Save bet type definitions to localStorage
 */
export function saveBetTypes(betTypes) {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    localStorage.setItem(BET_TYPES_CONFIG_KEY, JSON.stringify(betTypes));
    return true;
  } catch (e) {
    console.error('Failed to save bet types:', e);
    return false;
  }
}

/**
 * Check if picks are locked
 */
export function arePicksLocked() {
  if (typeof window === 'undefined') {
    return false;
  }
  const locked = localStorage.getItem(PICKS_LOCKED_KEY);
  return locked === 'true';
}

/**
 * Set picks lock status (admin only)
 */
export function setPicksLocked(locked) {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    localStorage.setItem(PICKS_LOCKED_KEY, locked ? 'true' : 'false');
    return true;
  } catch (e) {
    console.error('Failed to set picks lock status:', e);
    return false;
  }
}

/**
 * Generate a unique invite token
 */
function generateInviteToken() {
  return `invite-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate a new invite
 * @param {string} username - Optional default username to encode in the invite
 */
export function generateInvite(username = null) {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const invites = getInvites();
    const newInvite = {
      token: generateInviteToken(),
      createdAt: Date.now(),
      used: false,
      usedBy: null,
      defaultUsername: username || null
    };
    invites.push(newInvite);
    localStorage.setItem(INVITES_CONFIG_KEY, JSON.stringify(invites));
    return newInvite;
  } catch (e) {
    console.error('Failed to generate invite:', e);
    return null;
  }
}

/**
 * Get all invites
 */
export function getInvites() {
  if (typeof window === 'undefined') {
    return [];
  }
  const invitesJson = localStorage.getItem(INVITES_CONFIG_KEY);
  if (!invitesJson) {
    return [];
  }
  try {
    return JSON.parse(invitesJson);
  } catch (e) {
    return [];
  }
}

/**
 * Get invite by token
 */
export function getInviteByToken(token) {
  if (typeof window === 'undefined' || !token) {
    return null;
  }
  const invites = getInvites();
  return invites.find(invite => invite.token === token) || null;
}

/**
 * Mark invite as used
 */
export function markInviteUsed(token, username) {
  if (typeof window === 'undefined' || !token || !username) {
    return false;
  }
  try {
    const invites = getInvites();
    const updatedInvites = invites.map(invite =>
      invite.token === token
        ? { ...invite, used: true, usedBy: username }
        : invite
    );
    localStorage.setItem(INVITES_CONFIG_KEY, JSON.stringify(updatedInvites));
    return true;
  } catch (e) {
    console.error('Failed to mark invite as used:', e);
    return false;
  }
}

/**
 * Get all user credentials
 */
export function getUserCredentials() {
  if (typeof window === 'undefined') {
    return {};
  }
  const credentialsJson = localStorage.getItem(USER_CREDENTIALS_KEY);
  if (!credentialsJson) {
    return {};
  }
  try {
    return JSON.parse(credentialsJson);
  } catch (e) {
    return {};
  }
}

/**
 * Save user credentials
 */
export function saveUserCredentials(username, password, inviteToken) {
  if (typeof window === 'undefined' || !username || !password) {
    return false;
  }
  try {
    const credentials = getUserCredentials();
    
    // Check if username already exists
    if (credentials[username]) {
      return { success: false, error: 'Username already exists' };
    }

    credentials[username] = {
      username,
      password, // Stored as-is (client-side only)
      createdAt: Date.now(),
      createdVia: inviteToken || null
    };

    localStorage.setItem(USER_CREDENTIALS_KEY, JSON.stringify(credentials));
    return { success: true };
  } catch (e) {
    console.error('Failed to save user credentials:', e);
    return { success: false, error: 'Failed to save credentials' };
  }
}

/**
 * Validate user credentials
 */
export function validateUserCredentials(username, password) {
  if (typeof window === 'undefined' || !username || !password) {
    return false;
  }
  const credentials = getUserCredentials();
  const userCreds = credentials[username];
  
  if (!userCreds) {
    return false;
  }

  return userCreds.password === password;
}

/**
 * Get all bet results
 */
export function getBetResults() {
  if (typeof window === 'undefined') {
    return {};
  }
  const resultsJson = localStorage.getItem(BET_RESULTS_KEY);
  if (!resultsJson) {
    return {};
  }
  try {
    return JSON.parse(resultsJson);
  } catch (e) {
    console.error('Failed to parse bet results:', e);
    return {};
  }
}

/**
 * Get result for a specific bet
 */
export function getBetResult(betId) {
  if (typeof window === 'undefined' || !betId) {
    return null;
  }
  const results = getBetResults();
  return results[betId] || null;
}

/**
 * Save bet result
 */
export function saveBetResult(betId, result) {
  if (typeof window === 'undefined' || !betId || !result) {
    return false;
  }
  try {
    const results = getBetResults();
    results[betId] = result;
    localStorage.setItem(BET_RESULTS_KEY, JSON.stringify(results));
    return true;
  } catch (e) {
    console.error('Failed to save bet result:', e);
    return false;
  }
}

/**
 * Delete bet result
 */
export function deleteBetResult(betId) {
  if (typeof window === 'undefined' || !betId) {
    return false;
  }
  try {
    const results = getBetResults();
    delete results[betId];
    localStorage.setItem(BET_RESULTS_KEY, JSON.stringify(results));
    return true;
  } catch (e) {
    console.error('Failed to delete bet result:', e);
    return false;
  }
}

