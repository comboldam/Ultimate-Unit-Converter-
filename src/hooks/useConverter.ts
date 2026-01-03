import { useState } from 'react';
import { convertToAllUnits, type Unit } from '../utils/conversions';

export function useConverter(units: Unit[], categoryId: string = 'length') {
  const [activeUnitId, setActiveUnitId] = useState(units[0]?.id || '');
  const [inputValue, setInputValue] = useState('1');

  // Always recalculate conversions on every render - no memoization, no caching
  const numValue = parseFloat(inputValue);
  const conversions: Record<string, string> = {};

  if (!isNaN(numValue)) {
    const fromUnit = units.find(u => u.id === activeUnitId);
    if (fromUnit) {
      const numericConversions = convertToAllUnits(numValue, fromUnit, units, categoryId);

      // Convert ALL units to display strings
      Object.entries(numericConversions).forEach(([unitId, convertedValue]) => {
        if (!isFinite(convertedValue)) {
          conversions[unitId] = '∞';
        } else {
          conversions[unitId] = formatNumber(convertedValue);
        }
      });
    }
  }

  const handleUnitChange = (unitId: string, value: string) => {
    setActiveUnitId(unitId);
    setInputValue(value);
  };

  return {
    activeUnitId,
    inputValue,
    conversions,
    handleUnitChange,
  };
}

/**
 * Format number with reasonable precision
 */
function formatNumber(value: number): string {
  // Very small numbers: use scientific notation
  if (Math.abs(value) < 0.000001 && value !== 0) {
    return value.toExponential(6);
  }

  // Very large numbers: use scientific notation
  if (Math.abs(value) > 1e9) {
    return value.toExponential(6);
  }

  // Regular numbers: use up to 8 significant digits
  const str = value.toPrecision(8);
  // Remove trailing zeros and decimal point if not needed
  return parseFloat(str).toString();
}
