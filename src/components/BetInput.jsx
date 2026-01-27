'use client';

import { useState, useEffect } from 'react';
import { getBetOptions, getBetOptionLabel } from '../utils/constants';
import { getBetTypes } from '../lib/storage';

/**
 * BetInput component - renders different input types based on bet type
 */
export default function BetInput({ bet, value, onChange, disabled = false, showLabel = true }) {
  const [betTypes, setBetTypes] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadBetTypes = async () => {
        try {
          const types = await getBetTypes();
          setBetTypes(types || []);
        } catch (error) {
          console.error('Failed to load bet types:', error);
          setBetTypes([]);
        }
      };
      loadBetTypes();
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
    <div>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {bet.question}
          {isIntegerRange && betTypeDef && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              (Range: {betTypeDef.minValue} - {betTypeDef.maxValue})
            </span>
          )}
        </label>
      )}
      {isIntegerRange ? (
        <div>
          {!showLabel && betTypeDef && (
            <span className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase">
              Range: {betTypeDef.minValue} - {betTypeDef.maxValue}
            </span>
          )}
          <input
            type="number"
            value={value || ''}
            onChange={handleIntegerChange}
            min={betTypeDef?.minValue || 0}
            max={betTypeDef?.maxValue || 100}
            disabled={disabled}
            className={`
              w-full max-w-xs px-4 py-3 border-3 rounded-xl font-semibold
              ${disabled ? 'cursor-not-allowed opacity-60' : ''}
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              border-gray-400 dark:border-gray-600
              focus:border-[#0D4F3C] focus:ring-4 focus:ring-[#0D4F3C]/20 dark:focus:border-green-500 dark:focus:ring-green-500/20
            `}
            placeholder={`Enter a number between ${betTypeDef?.minValue || 0} and ${betTypeDef?.maxValue || 100}`}
          />
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {options.map((option) => {
            const optionId = `${bet.id}-${option}`;
            const label = getBetOptionLabel(bet.type, option, bet.teamNames, betTypes);
            const isSelected = value === option;

            return (
              <label
                key={optionId}
                htmlFor={optionId}
                className={`
                  flex items-center px-5 py-3 rounded-xl border-4 font-bold uppercase tracking-wide transition-all text-sm sm:text-base
                  ${
                    disabled
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer hover:scale-105'
                  }
                  ${
                    isSelected
                      ? 'bg-[#0D4F3C] text-white border-[#0D4F3C] dark:bg-green-600 dark:border-green-600 shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-400 dark:border-gray-600 hover:border-[#0D4F3C] dark:hover:border-green-500'
                  }
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
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

