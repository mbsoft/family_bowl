/**
 * Utility functions for Super Bowl logos and information
 */

/**
 * Get Super Bowl number from year
 * Super Bowl I was in 1967, so year - 1966 = Super Bowl number
 */
export function getSuperBowlNumber(year) {
  const superBowlNumber = year - 1966;
  if (superBowlNumber <= 0) return null;
  return `L${toRomanNumeral(superBowlNumber)}`;
}

/**
 * Convert number to Roman numeral
 */
export function toRomanNumeral(num) {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += numerals[i];
      num -= values[i];
    }
  }
  
  return result;
}

/**
 * Get Super Bowl number as Roman numeral string
 */
export function getSuperBowlRomanNumeral(year) {
  const number = year - 1966;
  if (number <= 0) return null;
  return toRomanNumeral(number);
}
