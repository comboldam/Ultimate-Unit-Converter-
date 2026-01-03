import { describe, it, expect } from 'vitest';
import { convert, type Unit } from './conversions';
import unitsData from '../data/units.json';

describe('Fuel Consumption Conversions', () => {
  const fuelUnits = (unitsData as any)['fuel-consumption'] as Unit[];

  it('converts 10 L/100km correctly to all units', () => {
    const liter100km = fuelUnits.find(u => u.id === 'liter_per_100km')!;
    const kmPerLiter = fuelUnits.find(u => u.id === 'km_per_liter')!;
    const mpgUs = fuelUnits.find(u => u.id === 'mpg_us')!;
    const mpgUk = fuelUnits.find(u => u.id === 'mpg_uk')!;
    const miPerLiter = fuelUnits.find(u => u.id === 'mile_per_liter')!;

    expect(convert(10, liter100km, kmPerLiter, 'fuel-consumption')).toBeCloseTo(10, 6);
    expect(convert(10, liter100km, mpgUs, 'fuel-consumption')).toBeCloseTo(23.521458, 6);
    expect(convert(10, liter100km, mpgUk, 'fuel-consumption')).toBeCloseTo(28.248094, 6);
    expect(convert(10, liter100km, miPerLiter, 'fuel-consumption')).toBeCloseTo(6.213712, 6);
  });

  it('converts 5 L/100km correctly to all units', () => {
    const liter100km = fuelUnits.find(u => u.id === 'liter_per_100km')!;
    const kmPerLiter = fuelUnits.find(u => u.id === 'km_per_liter')!;
    const mpgUs = fuelUnits.find(u => u.id === 'mpg_us')!;
    const mpgUk = fuelUnits.find(u => u.id === 'mpg_uk')!;
    const miPerLiter = fuelUnits.find(u => u.id === 'mile_per_liter')!;

    expect(convert(5, liter100km, kmPerLiter, 'fuel-consumption')).toBeCloseTo(20, 6);
    expect(convert(5, liter100km, mpgUs, 'fuel-consumption')).toBeCloseTo(47.042917, 6);
    expect(convert(5, liter100km, mpgUk, 'fuel-consumption')).toBeCloseTo(56.496187, 6);
    expect(convert(5, liter100km, miPerLiter, 'fuel-consumption')).toBeCloseTo(12.427424, 6);
  });

  it('converts 30 MPG (US) correctly to L/100km and km/L', () => {
    const liter100km = fuelUnits.find(u => u.id === 'liter_per_100km')!;
    const kmPerLiter = fuelUnits.find(u => u.id === 'km_per_liter')!;
    const mpgUs = fuelUnits.find(u => u.id === 'mpg_us')!;

    const resultL100km = convert(30, mpgUs, liter100km, 'fuel-consumption');
    expect(resultL100km).toBeCloseTo(7.840486, 6);

    const resultKmL = convert(30, mpgUs, kmPerLiter, 'fuel-consumption');
    expect(resultKmL).toBeCloseTo(12.754, 3); // Lower precision due to compound conversion
  });

  it('roundtrip: L/100km → km/L → L/100km', () => {
    const liter100km = fuelUnits.find(u => u.id === 'liter_per_100km')!;
    const kmPerLiter = fuelUnits.find(u => u.id === 'km_per_liter')!;

    const original = 8.5;
    const toKmL = convert(original, liter100km, kmPerLiter, 'fuel-consumption');
    const backToL100 = convert(toKmL, kmPerLiter, liter100km, 'fuel-consumption');

    expect(backToL100).toBeCloseTo(original, 9);
  });

  it('roundtrip: MPG US → L/100km → MPG US', () => {
    const liter100km = fuelUnits.find(u => u.id === 'liter_per_100km')!;
    const mpgUs = fuelUnits.find(u => u.id === 'mpg_us')!;

    const original = 25;
    const toL100 = convert(original, mpgUs, liter100km, 'fuel-consumption');
    const backToMpg = convert(toL100, liter100km, mpgUs, 'fuel-consumption');

    expect(backToMpg).toBeCloseTo(original, 9);
  });

  it('handles zero and infinity values gracefully', () => {
    const liter100km = fuelUnits.find(u => u.id === 'liter_per_100km')!;
    const kmPerLiter = fuelUnits.find(u => u.id === 'km_per_liter')!;

    // 0 L/100km means infinite efficiency, converting to km/L gives 0 (handled by 100/Infinity)
    const result1 = convert(0, liter100km, kmPerLiter, 'fuel-consumption');
    expect(result1).toBe(0);

    // 0 km/L means zero efficiency, converting to L/100km gives Infinity
    const result2 = convert(0, kmPerLiter, liter100km, 'fuel-consumption');
    expect(result2).toBe(Infinity);
  });
});

describe('Temperature Conversions (Offset handling)', () => {
  const tempUnits = (unitsData as any)['temperature'] as Unit[];

  it('converts 0°C to 32°F', () => {
    const celsius = tempUnits.find(u => u.id === 'celsius')!;
    const fahrenheit = tempUnits.find(u => u.id === 'fahrenheit')!;

    const result = convert(0, celsius, fahrenheit, 'temperature');
    expect(result).toBeCloseTo(32, 6);
  });

  it('converts 100°C to 212°F', () => {
    const celsius = tempUnits.find(u => u.id === 'celsius')!;
    const fahrenheit = tempUnits.find(u => u.id === 'fahrenheit')!;

    const result = convert(100, celsius, fahrenheit, 'temperature');
    expect(result).toBeCloseTo(212, 6);
  });

  it('converts 0°C to 273.15K', () => {
    const celsius = tempUnits.find(u => u.id === 'celsius')!;
    const kelvin = tempUnits.find(u => u.id === 'kelvin')!;

    const result = convert(0, celsius, kelvin, 'temperature');
    expect(result).toBeCloseTo(273.15, 6);
  });

  it('roundtrip: °C → °F → °C', () => {
    const celsius = tempUnits.find(u => u.id === 'celsius')!;
    const fahrenheit = tempUnits.find(u => u.id === 'fahrenheit')!;

    const original = 25;
    const toF = convert(original, celsius, fahrenheit, 'temperature');
    const backToC = convert(toF, fahrenheit, celsius, 'temperature');

    expect(backToC).toBeCloseTo(original, 9);
  });

  it('roundtrip: K → °C → K', () => {
    const celsius = tempUnits.find(u => u.id === 'celsius')!;
    const kelvin = tempUnits.find(u => u.id === 'kelvin')!;

    const original = 300;
    const toC = convert(original, kelvin, celsius, 'temperature');
    const backToK = convert(toC, celsius, kelvin, 'temperature');

    expect(backToK).toBeCloseTo(original, 9);
  });
});

describe('Linear Conversions - Roundtrip Tests', () => {
  const categories = [
    'length',
    'area',
    'volume',
    'mass',
    'pressure',
    'acceleration',
    'speed',
    'angle',
    'time',
    'power',
    'energy',
    'charge',
    'frequency',
    'resistance',
    'voltage',
    'current',
    'data',
    'network-bandwidth',
    'illuminance',
    'wind-speed',
    'concentration',
    'radioactivity',
    'cooking',
    'fuel-volume',
  ];

  categories.forEach(category => {
    it(`roundtrip conversion for ${category}`, () => {
      const units = (unitsData as any)[category] as Unit[];
      if (!units || units.length < 2) return;

      const unit1 = units[0];
      const unit2 = units[1];

      const original = 42.5;
      const converted = convert(original, unit1, unit2, category);
      const backConverted = convert(converted, unit2, unit1, category);

      expect(backConverted).toBeCloseTo(original, 9);
    });
  });
});

describe('Edge Cases', () => {
  it('handles very small numbers in length', () => {
    const units = (unitsData as any)['length'] as Unit[];
    const meter = units.find(u => u.id === 'meter')!;
    const nanometer = units.find(u => u.id === 'nanometer')!;

    const result = convert(1, meter, nanometer, 'length');
    expect(result).toBeCloseTo(1e9, 6);
  });

  it('handles very large numbers in data', () => {
    const units = (unitsData as any)['data'] as Unit[];
    const byte = units.find(u => u.id === 'byte')!;
    const petabyte = units.find(u => u.id === 'petabyte')!;

    const result = convert(1, petabyte, byte, 'data');
    expect(result).toBeCloseTo(1125899906842624, 0);
  });

  it('converts negative temperatures correctly', () => {
    const tempUnits = (unitsData as any)['temperature'] as Unit[];
    const celsius = tempUnits.find(u => u.id === 'celsius')!;
    const fahrenheit = tempUnits.find(u => u.id === 'fahrenheit')!;

    const result = convert(-40, celsius, fahrenheit, 'temperature');
    expect(result).toBeCloseTo(-40, 6); // -40°C = -40°F
  });
});

describe('Volume Conversions (US vs UK)', () => {
  const volumeUnits = (unitsData as any)['volume'] as Unit[];

  it('distinguishes US gallon from UK gallon', () => {
    const liter = volumeUnits.find(u => u.id === 'liter')!;
    const gallonUS = volumeUnits.find(u => u.id === 'gallon_us')!;
    const gallonUK = volumeUnits.find(u => u.id === 'gallon_uk')!;

    const fromUS = convert(1, gallonUS, liter, 'volume');
    const fromUK = convert(1, gallonUK, liter, 'volume');

    expect(fromUS).toBeCloseTo(3.78541, 5);
    expect(fromUK).toBeCloseTo(4.54609, 5);
    expect(fromUK).toBeGreaterThan(fromUS);
  });

  it('roundtrip: US gallon → Liter → US gallon', () => {
    const liter = volumeUnits.find(u => u.id === 'liter')!;
    const gallonUS = volumeUnits.find(u => u.id === 'gallon_us')!;

    const original = 10;
    const toLiter = convert(original, gallonUS, liter, 'volume');
    const backToGallon = convert(toLiter, liter, gallonUS, 'volume');

    expect(backToGallon).toBeCloseTo(original, 9);
  });
});

describe('Specific Unit Accuracy Tests', () => {
  it('mile to kilometer conversion', () => {
    const lengthUnits = (unitsData as any)['length'] as Unit[];
    const mile = lengthUnits.find(u => u.id === 'mile')!;
    const kilometer = lengthUnits.find(u => u.id === 'kilometer')!;

    const result = convert(1, mile, kilometer, 'length');
    expect(result).toBeCloseTo(1.609344, 6);
  });

  it('pound to kilogram conversion', () => {
    const massUnits = (unitsData as any)['mass'] as Unit[];
    const pound = massUnits.find(u => u.id === 'pound')!;
    const kilogram = massUnits.find(u => u.id === 'kilogram')!;

    const result = convert(1, pound, kilogram, 'mass');
    expect(result).toBeCloseTo(0.453592, 6);
  });

  it('PSI to Pascal conversion', () => {
    const pressureUnits = (unitsData as any)['pressure'] as Unit[];
    const psi = pressureUnits.find(u => u.id === 'psi')!;
    const pascal = pressureUnits.find(u => u.id === 'pascal')!;

    const result = convert(1, psi, pascal, 'pressure');
    expect(result).toBeCloseTo(6894.757, 3);
  });

  it('degree to radian conversion', () => {
    const angleUnits = (unitsData as any)['angle'] as Unit[];
    const degree = angleUnits.find(u => u.id === 'degree')!;
    const radian = angleUnits.find(u => u.id === 'radian')!;

    const result = convert(180, degree, radian, 'angle');
    expect(result).toBeCloseTo(Math.PI, 6);
  });

  it('horsepower to watt conversion', () => {
    const powerUnits = (unitsData as any)['power'] as Unit[];
    const hp = powerUnits.find(u => u.id === 'horsepower')!;
    const watt = powerUnits.find(u => u.id === 'watt')!;

    const result = convert(1, hp, watt, 'power');
    expect(result).toBeCloseTo(745.7, 1);
  });
});
