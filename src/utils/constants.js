/**
 * Default bet definitions based on Super Bowl prop bet structure
 * These will be used to initialize the app if no bets are configured
 */

export const DEFAULT_BETS = [
  {
    id: 'bet-1',
    question: 'Total Points Scored - Over/Under 47.5',
    type: 'O/U'
  },
  {
    id: 'bet-2',
    question: 'Coin Toss Result',
    type: 'H or T'
  },
  {
    id: 'bet-3',
    question: 'Will there be overtime?',
    type: 'Y/N'
  },
  {
    id: 'bet-4',
    question: 'Which team will win?',
    type: 'KC/PHL',
    teamNames: {
      option1: 'KC',
      option2: 'PHL'
    }
  },
  {
    id: 'bet-5',
    question: 'Total Touchdowns - Odd or Even',
    type: 'O/E'
  },
  {
    id: 'bet-6',
    question: 'First Score Type - Over/Under 6.5 points',
    type: 'O/U'
  },
  {
    id: 'bet-7',
    question: 'Will the first score be a touchdown?',
    type: 'Y/N'
  },
  {
    id: 'bet-8',
    question: 'Longest Field Goal - Over/Under 45.5 yards',
    type: 'O/U'
  },
  {
    id: 'bet-9',
    question: 'Total Sacks - Odd or Even',
    type: 'O/E'
  },
  {
    id: 'bet-10',
    question: 'Which team will score first?',
    type: 'KC/PHL',
    teamNames: {
      option1: 'KC',
      option2: 'PHL'
    }
  }
];

/**
 * Default bet type definitions
 * These will be used to initialize the app if no bet types are configured
 */
export const DEFAULT_BET_TYPES = [
  {
    id: 'O/U',
    label: 'Over/Under',
    options: ['O', 'U'],
    optionLabels: { 'O': 'Over', 'U': 'Under' },
    requiresTeamNames: false
  },
  {
    id: 'H or T',
    label: 'Heads or Tails',
    options: ['H', 'T'],
    optionLabels: { 'H': 'Heads', 'T': 'Tails' },
    requiresTeamNames: false
  },
  {
    id: 'Y/N',
    label: 'Yes/No',
    options: ['Y', 'N'],
    optionLabels: { 'Y': 'Yes', 'N': 'No' },
    requiresTeamNames: false
  },
  {
    id: 'KC/PHL',
    label: 'Team Selection',
    options: ['KC', 'PHL'],
    optionLabels: {},
    requiresTeamNames: true
  },
  {
    id: 'O/E',
    label: 'Odd/Even',
    options: ['O', 'E'],
    optionLabels: { 'O': 'Odd', 'E': 'Even' },
    requiresTeamNames: false
  }
];

/**
 * Get bet type by ID (requires bet types array to be passed)
 */
export function getBetTypeById(betTypes, betTypeId) {
  if (!betTypes || !Array.isArray(betTypes)) {
    return null;
  }
  return betTypes.find(bt => bt.id === betTypeId) || null;
}

/**
 * Get options for a bet type
 * @param {string|object} betType - Bet type ID string or bet type object
 * @param {object} teamNames - Team names object {option1, option2}
 * @param {array} betTypesArray - Array of bet type definitions (optional, will fetch if not provided)
 */
export function getBetOptions(betType, teamNames = null, betTypesArray = null) {
  let betTypeDef;
  
  if (typeof betType === 'string') {
    // If betTypesArray provided, use it; otherwise use defaults
    if (betTypesArray) {
      betTypeDef = getBetTypeById(betTypesArray, betType);
    } else {
      betTypeDef = getBetTypeById(DEFAULT_BET_TYPES, betType);
    }
  } else {
    betTypeDef = betType;
  }
  
  if (!betTypeDef) {
    return [];
  }

  // Integer range types don't have options
  if (betTypeDef.isIntegerRange) {
    return [];
  }

  if (betTypeDef.requiresTeamNames && teamNames) {
    return [teamNames.option1, teamNames.option2];
  }

  return betTypeDef.options || [];
}

/**
 * Get label for a bet option
 * @param {string|object} betType - Bet type ID string or bet type object
 * @param {string} value - Option value
 * @param {object} teamNames - Team names object {option1, option2}
 * @param {array} betTypesArray - Array of bet type definitions (optional, will fetch if not provided)
 */
export function getBetOptionLabel(betType, value, teamNames = null, betTypesArray = null) {
  let betTypeDef;
  
  if (typeof betType === 'string') {
    // If betTypesArray provided, use it; otherwise use defaults
    if (betTypesArray) {
      betTypeDef = getBetTypeById(betTypesArray, betType);
    } else {
      betTypeDef = getBetTypeById(DEFAULT_BET_TYPES, betType);
    }
  } else {
    betTypeDef = betType;
  }
  
  if (!betTypeDef) {
    return value;
  }

  // For integer range types, return the value directly (the number)
  if (betTypeDef.isIntegerRange) {
    return value;
  }

  // For team selection types, return the value directly (team name)
  if (betTypeDef.requiresTeamNames) {
    return value;
  }

  // Use option labels if available
  if (betTypeDef.optionLabels && betTypeDef.optionLabels[value]) {
    return betTypeDef.optionLabels[value];
  }

  return value;
}

/**
 * Legacy BET_TYPES array for backward compatibility
 * This will be populated dynamically from storage
 * Note: Components should import getBetTypes from storage.js directly
 */
export function getBET_TYPES() {
  if (typeof window === 'undefined') {
    return DEFAULT_BET_TYPES.map(bt => ({
      value: bt.id,
      label: bt.label
    }));
  }
  // For client components, import from storage
  // This is a fallback - components should use getBetTypes from storage.js
  return DEFAULT_BET_TYPES.map(bt => ({
    value: bt.id,
    label: bt.label
  }));
}

