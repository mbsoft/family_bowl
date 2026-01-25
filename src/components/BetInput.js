'use client';

import { useState, useEffect } from 'react';
import { getBetOptions, getBetOptionLabel } from '../utils/constants';
import { getBetTypes } from '../lib/storage';

/**
 * BetInput component - renders different input types based on bet type
 */
export default function BetInput({ bet, value, onChange, disabled = false }) {
  const [betTypes, setBetTypes] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBetTypes(getBetTypes());
    }
  }, []);

  const betTypeDef = betTypes.find(bt => bt.id === bet.type);
  const isIntegerRange = betTypeDef?.isIntegerRange || false;
  const options = getBetOptions(bet.type, bet.teamNames, betTypes);

  const handleChange = (optionValue) => {
    if (disabled) {
      return; // Don't allow changes if disabled
    }
    onChange(bet.id, optionValue);
  };

  const handleIntegerChange = (e) => {
    if (disabled) {
      return;
    }
    const inputValue = e.target.value;
    // Allow empty string for clearing, or valid integer
    if (inputValue === '' || /^\d+$/.test(inputValue)) {
      const numValue = inputValue === '' ? '' : parseInt(inputValue, 10);
      if (inputValue === '' || (numValue >= betTypeDef.minValue && numValue <= betTypeDef.maxValue)) {
        onChange(bet.id, inputValue === '' ? '' : String(numValue));
      }
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {bet.question}
        {isIntegerRange && betTypeDef && (
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            (Range: {betTypeDef.minValue} - {betTypeDef.maxValue})
          </span>
        )}
      </label>
      {isIntegerRange ? (
        <div>
          <input
            type="number"
            value={value || ''}
            onChange={handleIntegerChange}
            min={betTypeDef?.minValue || 0}
            max={betTypeDef?.maxValue || 100}
            disabled={disabled}
            className={`
              w-full max-w-xs px-4 py-2 border-2 rounded-lg
              ${disabled ? 'cursor-not-allowed opacity-60' : ''}
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              border-gray-300 dark:border-gray-600
              focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800
            `}
            placeholder={`Enter a number between ${betTypeDef?.minValue || 0} and ${betTypeDef?.maxValue || 100}`}
          />
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {options.map((option) => {
            const optionId = `${bet.id}-${option}`;
            const label = getBetOptionLabel(bet.type, option, bet.teamNames, betTypes);
            const isSelected = value === option;

            return (
              <label
                key={optionId}
                htmlFor={optionId}
                className={`
                  flex items-center px-4 py-2 rounded-lg border-2 transition-colors
                  ${
                    disabled
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer'
                  }
                  ${
                    isSelected
                      ? 'bg-blue-500 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }
                  ${disabled ? '' : 'hover:border-blue-400'}
                `}
              >
                <input
                  type="radio"
                  id={optionId}
                  name={bet.id}
                  value={option}
                  checked={isSelected}
                  onChange={() => handleChange(option)}
                  disabled={disabled}
                  className="sr-only"
                />
                <span className="font-medium">{label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

