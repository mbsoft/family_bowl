'use client';

import { toRomanNumeral } from '../utils/superbowlLogos';

/**
 * Super Bowl Logo Component
 * Displays a stylized Super Bowl logo with the Roman numeral
 */
export default function SuperBowlLogo({ year, size = 120, className = '' }) {
  // Calculate Super Bowl number: Super Bowl I was in 1967, so year - 1966 = Super Bowl number
  if (!year || typeof year !== 'number') {
    console.warn('SuperBowlLogo: Invalid year prop', year);
    return null;
  }
  
  const superBowlNumber = year - 1966;
  if (superBowlNumber <= 0) return null;
  
  const romanNumeral = toRomanNumeral(superBowlNumber);
  
  // Debug: log the values to ensure they're correct
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(`SuperBowlLogo: year=${year}, number=${superBowlNumber}, roman=${romanNumeral}`);
  }
  
  // Calculate font sizes based on the size prop (scale from 120px base)
  const scale = size / 120;
  const romanFontSize = Math.round(48 * scale); // Much larger Roman numerals
  
  return (
    <div className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 120 120" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id={`grad-${year}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
          </linearGradient>
          <filter id={`shadow-${year}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3"/>
          </filter>
        </defs>
        <circle 
          cx="60" 
          cy="60" 
          r="55" 
          fill={`url(#grad-${year})`} 
          stroke="#8B4513" 
          strokeWidth="3"
          filter={`url(#shadow-${year})`}
        />
        <text 
          x="60" 
          y="60" 
          fontFamily="Arial, sans-serif" 
          fontSize={`${romanFontSize}px`}
          fontWeight="bold" 
          textAnchor="middle" 
          fill="#654321"
          dominantBaseline="middle"
        >
          {romanNumeral}
        </text>
      </svg>
    </div>
  );
}
