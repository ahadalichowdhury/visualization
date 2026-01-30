import React from 'react';

/**
 * A specialized numeric input component that solves the common "can't delete first character" 
 * and "scroll wheel changes value" issues in HTML number inputs.
 * 
 * Features:
 * - Uses type="text" with inputMode="numeric" for better UX (especially mobile)
 * - Allows clearing the field completely (handling empty string state)
 * - Returns proper `number | undefined` to parent
 * - Validates input to allow ONLY digits
 */

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  className?: string;
  min?: number;
  max?: number;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  className = '',
  min,
  max,
  ...props
}) => {
  // Convert number value to string for display, handle null/undefined as empty string
  const displayValue = value === undefined || value === null ? '' : value.toString();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty string (clearing the field)
    if (inputValue === '') {
      onChange(undefined);
      return;
    }

    // Only allow digits
    if (/^\d*$/.test(inputValue)) {
      const numValue = parseInt(inputValue, 10);
      
      // OPTIONAL: Enforce min/max in real-time or just let parent validation handle it?
      // Usually better to let user type freely and validate on blur/submit, 
      // but strict constraints can be enforced here if preferred.
      onChange(numValue);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={displayValue}
      onChange={handleChange}
      className={`w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-[#d4d4d4] ${className}`}
      min={min}
      max={max}
      {...props}
    />
  );
};
