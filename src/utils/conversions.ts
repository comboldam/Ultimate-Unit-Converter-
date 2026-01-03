/**
 * Unit conversion utilities with support for special categories
 */

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  toBase: number;
  offset?: number; // For temperature conversions (legacy, not used)
  inverse?: boolean; // Legacy flag (not used in new implementation)
  category?: string;
}

/**
 * Ring size conversion tables (inner diameter in mm)
 * Based on international standards
 */
const RING_SIZE_TABLE: Record<string, (number | string)[]> = {
  'diameter_mm': [14.0, 14.4, 14.8, 15.3, 15.7, 16.1, 16.5, 16.9, 17.3, 17.7, 18.2, 18.6, 19.0, 19.4, 19.8, 20.2, 20.6, 21.0, 21.4, 21.8, 22.2],
  'us': [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13],
  'uk': ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  'eu': [44, 45, 47, 48, 49, 51, 52, 53, 54, 56, 57, 58, 60, 61, 62, 63, 65, 66, 67, 69, 70],
  'japan': [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
};

/**
 * Men's shoe size conversion tables (foot length in cm)
 * Based on international retail standards
 * US Men's sizes 4.5-14 (step 0.5)
 */
const MENS_SHOE_SIZE_TABLE: Record<string, number[]> = {
  'cm': [22.5, 23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5, 28.0, 28.5, 29.0, 29.5, 30.0, 30.5, 31.0, 31.5, 32.0],
  'us_mens': [4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14],
  'uk': [3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13],
  'eu': [36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 40.5, 41, 41.5, 42, 42.5, 43, 43.5, 44, 44.5, 45, 45.5, 46],
  'china': [36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 40.5, 41, 41.5, 42, 42.5, 43, 43.5, 44, 44.5, 45, 45.5],
};

/**
 * Women's shoe size conversion tables
 * Based on international retail standards
 * US Women's sizes 4.5-14 (step 0.5)
 */
const WOMENS_SHOE_SIZE_TABLE: Record<string, number[]> = {
  'us_womens': [4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14],
  'uk': [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5],
  'eu': [35, 35, 36, 37, 37, 38, 38, 39, 40, 40, 41, 42, 42, 43, 43, 44, 44, 45, 45, 46],
  'china': [34, 34, 35, 36, 36, 37, 37, 38, 39, 39, 40, 40, 40, 41, 41, 42, 42, 43, 43, 44],
  'cm': [21.5, 22.0, 22.5, 23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5, 28.0, 28.5, 29.0, 29.5, 30.0, 30.5, 31.0],
};

/**
 * Convert a value from one unit to base unit
 */
export function convertToBase(value: number, unit: Unit, categoryId: string): number {
  // Special case: Men's Shoe Size (lookup table conversion)
  if (categoryId === 'mens-shoe-size') {
    return convertMensShoeSizeToBase(value, unit.id);
  }

  // Special case: Women's Shoe Size (lookup table conversion)
  if (categoryId === 'womens-shoe-size') {
    return convertWomensShoeSizeToBase(value, unit.id);
  }

  // Special case: Ring Size (lookup table conversion)
  if (categoryId === 'ring-size') {
    return convertRingSizeToBase(value, unit.id);
  }

  // Special case: Fuel Consumption (reciprocal conversion)
  if (categoryId === 'fuel-consumption') {
    return convertFuelConsumptionToBase(value, unit.id);
  }

  // Special case: Temperature (convert to Kelvin as base)
  if (categoryId === 'temperature') {
    return convertTemperatureToKelvin(value, unit.id);
  }

  // Standard linear conversion
  return value * unit.toBase;
}

/**
 * Convert a value from base unit to target unit
 */
export function convertFromBase(baseValue: number, unit: Unit, categoryId: string): number {
  // Special case: Men's Shoe Size (lookup table conversion)
  if (categoryId === 'mens-shoe-size') {
    return convertMensShoeSizeFromBase(baseValue, unit.id);
  }

  // Special case: Women's Shoe Size (lookup table conversion)
  if (categoryId === 'womens-shoe-size') {
    return convertWomensShoeSizeFromBase(baseValue, unit.id);
  }

  // Special case: Ring Size (lookup table conversion)
  if (categoryId === 'ring-size') {
    return convertRingSizeFromBase(baseValue, unit.id);
  }

  // Special case: Fuel Consumption (reciprocal conversion)
  if (categoryId === 'fuel-consumption') {
    return convertFuelConsumptionFromBase(baseValue, unit.id);
  }

  // Special case: Temperature (convert from Kelvin)
  if (categoryId === 'temperature') {
    return convertKelvinToTemperature(baseValue, unit.id);
  }

  // Standard linear conversion
  return baseValue / unit.toBase;
}

/**
 * Men's Shoe Size: Convert to cm (base unit)
 * Uses lookup tables for discrete standard sizes with linear interpolation
 */
function convertMensShoeSizeToBase(value: number, unitId: string): number {
  if (unitId === 'cm') {
    return value; // Already in base unit
  }

  if (unitId === 'inches') {
    return value * 2.54; // Direct conversion: 1 inch = 2.54 cm
  }

  const table = MENS_SHOE_SIZE_TABLE[unitId];
  const cmTable = MENS_SHOE_SIZE_TABLE['cm'];

  if (!table || !cmTable) {
    return value; // Fallback
  }

  // Find the closest match or interpolate
  for (let i = 0; i < table.length; i++) {
    if (Math.abs(value - (table[i] as number)) < 0.01) {
      return cmTable[i]; // Exact match
    }
    if (i > 0 && value > (table[i - 1] as number) && value < (table[i] as number)) {
      // Linear interpolation between two points
      const ratio = (value - (table[i - 1] as number)) / ((table[i] as number) - (table[i - 1] as number));
      return cmTable[i - 1] + ratio * (cmTable[i] - cmTable[i - 1]);
    }
  }

  // Handle values outside range
  if (value < (table[0] as number)) return cmTable[0];
  if (value > (table[table.length - 1] as number)) return cmTable[cmTable.length - 1];

  return value; // Fallback
}

/**
 * Men's Shoe Size: Convert from cm (base) to target unit
 * Simple, direct conversion - no early returns, always calculate
 */
function convertMensShoeSizeFromBase(cm: number, unitId: string): number {
  // Linear units: direct formula (same as Length category)
  if (unitId === 'cm') return cm;
  if (unitId === 'inches') return cm / 2.54;

  // Lookup table units: US, UK, EU
  const sizeTable = MENS_SHOE_SIZE_TABLE[unitId];
  const cmTable = MENS_SHOE_SIZE_TABLE['cm'];

  if (!sizeTable || !cmTable) return 0;

  // Below range
  if (cm <= cmTable[0]) return sizeTable[0] as number;

  // Above range
  if (cm >= cmTable[cmTable.length - 1]) return sizeTable[sizeTable.length - 1] as number;

  // Find interpolation range
  for (let i = 0; i < cmTable.length - 1; i++) {
    const cmLow = cmTable[i];
    const cmHigh = cmTable[i + 1];

    if (cm >= cmLow && cm <= cmHigh) {
      const sizeLow = sizeTable[i] as number;
      const sizeHigh = sizeTable[i + 1] as number;
      const ratio = (cm - cmLow) / (cmHigh - cmLow);
      return sizeLow + ratio * (sizeHigh - sizeLow);
    }
  }

  return sizeTable[0] as number;
}

/**
 * Women's Shoe Size: Convert to US Women's (base unit)
 * Uses lookup tables for discrete standard sizes with linear interpolation
 */
function convertWomensShoeSizeToBase(value: number, unitId: string): number {
  if (unitId === 'us_womens') {
    return value; // Already in base unit
  }

  if (unitId === 'inches') {
    // Convert inches to cm first, then cm to US Women's
    const cm = value * 2.54;
    return convertWomensShoeSizeToBase(cm, 'cm');
  }

  const table = WOMENS_SHOE_SIZE_TABLE[unitId];
  const usTable = WOMENS_SHOE_SIZE_TABLE['us_womens'];

  if (!table || !usTable) {
    return value; // Fallback
  }

  // Find the closest match or interpolate
  for (let i = 0; i < table.length; i++) {
    if (Math.abs(value - (table[i] as number)) < 0.01) {
      return usTable[i]; // Exact match
    }
    if (i > 0 && value > (table[i - 1] as number) && value < (table[i] as number)) {
      // Linear interpolation between two points
      const ratio = (value - (table[i - 1] as number)) / ((table[i] as number) - (table[i - 1] as number));
      return usTable[i - 1] + ratio * (usTable[i] - usTable[i - 1]);
    }
  }

  // Handle values outside range
  if (value < (table[0] as number)) return usTable[0];
  if (value > (table[table.length - 1] as number)) return usTable[usTable.length - 1];

  return value; // Fallback
}

/**
 * Women's Shoe Size: Convert from US Women's (base) to target unit
 * Simple, direct conversion - no early returns, always calculate
 */
function convertWomensShoeSizeFromBase(usWomens: number, unitId: string): number {
  // Base unit: direct return (same as Length category)
  if (unitId === 'us_womens') return usWomens;

  // Inches: convert from cm first
  if (unitId === 'inches') {
    const cm = convertWomensShoeSizeFromBase(usWomens, 'cm');
    return cm / 2.54;
  }

  // Lookup table units: UK, EU, China, cm
  const sizeTable = WOMENS_SHOE_SIZE_TABLE[unitId];
  const usTable = WOMENS_SHOE_SIZE_TABLE['us_womens'];

  if (!sizeTable || !usTable) return 0;

  // Below range
  if (usWomens <= usTable[0]) return sizeTable[0] as number;

  // Above range
  if (usWomens >= usTable[usTable.length - 1]) return sizeTable[sizeTable.length - 1] as number;

  // Find interpolation range
  for (let i = 0; i < usTable.length - 1; i++) {
    const usLow = usTable[i];
    const usHigh = usTable[i + 1];

    if (usWomens >= usLow && usWomens <= usHigh) {
      const sizeLow = sizeTable[i] as number;
      const sizeHigh = sizeTable[i + 1] as number;
      const ratio = (usWomens - usLow) / (usHigh - usLow);
      return sizeLow + ratio * (sizeHigh - sizeLow);
    }
  }

  return sizeTable[0] as number;
}

/**
 * Ring Size: Convert to diameter in mm (base unit)
 * Uses lookup tables for discrete standard sizes with linear interpolation
 */
function convertRingSizeToBase(value: number, unitId: string): number {
  if (unitId === 'diameter_mm') {
    return value; // Already in base unit
  }

  const table = RING_SIZE_TABLE[unitId];
  const diameterTable = RING_SIZE_TABLE['diameter_mm'];

  if (!table || !diameterTable) {
    return value; // Fallback
  }

  // For numeric sizes, use linear interpolation
  if (unitId === 'us' || unitId === 'eu' || unitId === 'japan') {
    // Find the closest match or interpolate
    for (let i = 0; i < table.length; i++) {
      if (value === table[i]) {
        return diameterTable[i] as number;
      }
      if (i > 0 && value > (table[i - 1] as number) && value < (table[i] as number)) {
        // Linear interpolation between two points
        const ratio = (value - (table[i - 1] as number)) / ((table[i] as number) - (table[i - 1] as number));
        return (diameterTable[i - 1] as number) + ratio * ((diameterTable[i] as number) - (diameterTable[i - 1] as number));
      }
    }
    // Handle values outside range
    if (value < (table[0] as number)) return diameterTable[0] as number;
    if (value > (table[table.length - 1] as number)) return diameterTable[diameterTable.length - 1] as number;
  }

  // For UK letter sizes, find exact match
  if (unitId === 'uk') {
    const valueStr = String.fromCharCode(Math.round(value + 65)); // Convert number to letter (A=65)
    const index = table.indexOf(valueStr);
    if (index !== -1) {
      return diameterTable[index] as number;
    }
  }

  return value; // Fallback
}

/**
 * Ring Size: Convert from diameter in mm (base) to target unit
 * Simple, direct conversion - no early returns, always calculate
 */
function convertRingSizeFromBase(diameterMm: number, unitId: string): number {
  // Base unit: direct return (same as Length category)
  if (unitId === 'diameter_mm') return diameterMm;

  // Lookup table units: US, UK, EU, Japan
  const sizeTable = RING_SIZE_TABLE[unitId];
  const mmTable = RING_SIZE_TABLE['diameter_mm'];

  if (!sizeTable || !mmTable) return 0;

  // Below range
  if (diameterMm <= (mmTable[0] as number)) {
    if (unitId === 'uk') {
      return (sizeTable[0] as string).charCodeAt(0) - 65;
    }
    return sizeTable[0] as number;
  }

  // Above range
  if (diameterMm >= (mmTable[mmTable.length - 1] as number)) {
    if (unitId === 'uk') {
      return (sizeTable[sizeTable.length - 1] as string).charCodeAt(0) - 65;
    }
    return sizeTable[sizeTable.length - 1] as number;
  }

  // Find interpolation range
  for (let i = 0; i < mmTable.length - 1; i++) {
    const mmLow = mmTable[i] as number;
    const mmHigh = mmTable[i + 1] as number;

    if (diameterMm >= mmLow && diameterMm <= mmHigh) {
      // UK uses letters - snap to nearest (no interpolation)
      if (unitId === 'uk') {
        const closer = (diameterMm - mmLow) < (mmHigh - diameterMm) ? i : i + 1;
        return (sizeTable[closer] as string).charCodeAt(0) - 65;
      }

      // Numeric sizes: interpolate
      const sizeLow = sizeTable[i] as number;
      const sizeHigh = sizeTable[i + 1] as number;
      const ratio = (diameterMm - mmLow) / (mmHigh - mmLow);
      return sizeLow + ratio * (sizeHigh - sizeLow);
    }
  }

  // Fallback
  if (unitId === 'uk') {
    return (sizeTable[0] as string).charCodeAt(0) - 65;
  }
  return sizeTable[0] as number;
}

/**
 * Temperature: Convert to Kelvin (base unit)
 */
function convertTemperatureToKelvin(value: number, unitId: string): number {
  switch (unitId) {
    case 'celsius':
      return value + 273.15;
    case 'fahrenheit':
      return (value + 459.67) * (5 / 9);
    case 'kelvin':
      return value;
    default:
      return value;
  }
}

/**
 * Temperature: Convert from Kelvin to target unit
 */
function convertKelvinToTemperature(kelvin: number, unitId: string): number {
  switch (unitId) {
    case 'celsius':
      return kelvin - 273.15;
    case 'fahrenheit':
      return kelvin * (9 / 5) - 459.67;
    case 'kelvin':
      return kelvin;
    default:
      return kelvin;
  }
}

/**
 * Fuel Consumption: Convert from unit to base (L/100km)
 *
 * Base unit: L/100km (liters per 100 kilometers)
 *
 * Conversion formulas TO base:
 * - L/100km → base: value
 * - km/L → base: 100 / value
 * - mi/L → base: 62.13711922373339 / value
 * - MPG (US) → base: 235.214583 / value
 * - MPG (UK) → base: 282.480936 / value
 */
function convertFuelConsumptionToBase(value: number, unitId: string): number {
  if (value === 0) return Infinity;

  switch (unitId) {
    case 'liter_per_100km':
      return value;
    case 'km_per_liter':
      return 100 / value;
    case 'mpg_us':
      return 235.214583 / value;
    case 'mpg_uk':
      return 282.480936 / value;
    case 'mile_per_liter':
      return 62.13711922373339 / value;
    default:
      return value; // Fallback
  }
}

/**
 * Fuel Consumption: Convert from base (L/100km) to unit
 *
 * Conversion formulas FROM base:
 * - base → L/100km: value
 * - base → km/L: 100 / value
 * - base → mi/L: 62.13711922373339 / value
 * - base → MPG (US): 235.214583 / value
 * - base → MPG (UK): 282.480936 / value
 */
function convertFuelConsumptionFromBase(baseValue: number, unitId: string): number {
  if (baseValue === 0) return Infinity;

  switch (unitId) {
    case 'liter_per_100km':
      return baseValue;
    case 'km_per_liter':
      return 100 / baseValue;
    case 'mpg_us':
      return 235.214583 / baseValue;
    case 'mpg_uk':
      return 282.480936 / baseValue;
    case 'mile_per_liter':
      return 62.13711922373339 / baseValue;
    default:
      return baseValue; // Fallback
  }
}

/**
 * Convert value from one unit to another
 */
export function convert(
  value: number,
  fromUnit: Unit,
  toUnit: Unit,
  categoryId: string
): number {
  const baseValue = convertToBase(value, fromUnit, categoryId);
  return convertFromBase(baseValue, toUnit, categoryId);
}

/**
 * Convert a value to all other units in the category
 */
export function convertToAllUnits(
  value: number,
  fromUnit: Unit,
  allUnits: Unit[],
  categoryId: string
): Record<string, number> {
  const baseValue = convertToBase(value, fromUnit, categoryId);

  const conversions: Record<string, number> = {};
  allUnits.forEach(unit => {
    conversions[unit.id] = convertFromBase(baseValue, unit, categoryId);
  });

  return conversions;
}
