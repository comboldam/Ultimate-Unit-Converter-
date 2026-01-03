import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useConverter } from '../hooks/useConverter';
import unitsData from '../data/units.json';

interface Unit {
  id: string;
  name: string;
  symbol: string;
  toBase: number;
  category: string;
}

export function UnitConverter() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Get the previous filter from navigation state
  const previousFilter = (location.state as { previousFilter?: string } | null)?.previousFilter || 'All';

  // Get units for the selected category, default to length if not specified
  const category = categoryId || 'length';
  const categoryUnits: Unit[] = (unitsData as Record<string, Unit[]>)[category] || [];

  const { activeUnitId, inputValue, conversions, handleUnitChange } = useConverter(categoryUnits, category);

  // Define input constraints for special categories
  const getInputConstraints = (unitId: string) => {
    // Men's Shoe Size
    if (category === 'mens-shoe-size') {
      if (unitId === 'us_mens') return { min: 4.5, max: 14, step: 0.5 };
      if (unitId === 'uk') return { min: 3.5, max: 13, step: 0.5 };
      if (unitId === 'eu') return { min: 36.5, max: 46, step: 0.5 };
      if (unitId === 'china') return { min: 36, max: 45.5, step: 0.5 };
      if (unitId === 'cm') return { min: 22.5, max: 32, step: 0.5 };
      if (unitId === 'inches') return { min: 8.86, max: 12.6, step: 0.01 };
    }

    // Women's Shoe Size
    if (category === 'womens-shoe-size') {
      if (unitId === 'us_womens') return { min: 4.5, max: 14, step: 0.5 };
      if (unitId === 'uk') return { min: 2, max: 11.5, step: 0.5 };
      if (unitId === 'eu') return { min: 35, max: 46, step: 0.5 };
      if (unitId === 'china') return { min: 34, max: 44, step: 0.5 };
      if (unitId === 'cm') return { min: 21.5, max: 31, step: 0.5 };
      if (unitId === 'inches') return { min: 8.46, max: 12.2, step: 0.01 };
    }

    // Ring Size
    if (category === 'ring-size' && unitId === 'diameter_mm') {
      return { min: 12, max: 25, step: 0.1 };
    }

    return { min: undefined, max: undefined, step: undefined };
  };

  const filteredUnits = categoryUnits.filter((unit) => {
    const matchesSearch = unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          unit.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Show empty state if category is unknown
  if (categoryUnits.length === 0) {
    return (
      <div className="unit-converter">
        <header className="converter-header">
          <button className="back-button" onClick={() => navigate('/', { state: { previousFilter } })}>
            ←
          </button>
          <div className="converter-header-content">
            <h1>Unit Converter</h1>
            <p className="category-headline">{(categoryId || 'length').toUpperCase()}</p>
          </div>
          <div className="header-spacer"></div>
        </header>
        <div className="placeholder">
          <p>Category not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="unit-converter">
      <header className="converter-header">
        <button className="back-button" onClick={() => navigate('/', { state: { previousFilter } })}>
          ←
        </button>
        <div className="converter-header-content">
          <h1>Unit Converter</h1>
          <p className="category-headline">{(categoryId || 'length').toUpperCase()}</p>
        </div>
        <div className="header-spacer"></div>
      </header>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search units..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="converter">
        {filteredUnits.map((unit) => {
          const isActive = unit.id === activeUnitId;
          const rawDisplayValue = conversions[unit.id] || '0';

          // Check if base unit is out of range for special categories
          const constraints = getInputConstraints(activeUnitId);
          const numValue = parseFloat(inputValue);
          const isOutOfRange = constraints.min !== undefined &&
                               constraints.max !== undefined &&
                               !isActive &&
                               (numValue < constraints.min || numValue > constraints.max);

          const displayValue = isOutOfRange ? '—' : rawDisplayValue;

          return (
            <div
              key={unit.id}
              className={`unit-card ${isActive ? 'active' : ''}`}
              onClick={() => !isActive && handleUnitChange(unit.id, displayValue)}
            >
              <div className="unit-info">
                <span className="unit-name">{unit.name}</span>
                <span className="unit-symbol">{unit.symbol}</span>
              </div>
              {isActive ? (
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  className="unit-input"
                  value={inputValue}
                  min={constraints.min}
                  max={constraints.max}
                  step={constraints.step}
                  onInput={(e) => {
                    e.preventDefault();
                    const newValue = (e.target as HTMLInputElement).value;
                    handleUnitChange(unit.id, newValue);
                  }}
                  autoFocus
                />
              ) : (
                <div className="unit-value">{displayValue}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
