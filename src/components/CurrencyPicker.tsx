import { useState } from 'react';
import { currencies } from '../data/currencies';
import type { Currency } from '../data/currencies';

interface CurrencyPickerProps {
  isOpen: boolean;
  currentBaseCurrency: string;
  onSelect: (currency: Currency) => void;
  onClose: () => void;
}

export function CurrencyPicker({
  isOpen,
  currentBaseCurrency,
  onSelect,
  onClose,
}: CurrencyPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredCurrencies = currencies.filter((currency) => {
    const query = searchQuery.toLowerCase();
    return (
      currency.name.toLowerCase().includes(query) ||
      currency.code.toLowerCase().includes(query) ||
      currency.country.toLowerCase().includes(query)
    );
  });

  const handleSelect = (currency: Currency) => {
    onSelect(currency);
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="currency-picker-overlay" onClick={onClose}>
      <div className="currency-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="currency-picker-header">
          <h2>Select Base Currency</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="currency-picker-search">
          <input
            type="text"
            className="search-input"
            placeholder="Search currencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="currency-picker-list">
          {filteredCurrencies.map((currency) => (
            <div
              key={currency.code}
              className={`currency-picker-item ${
                currency.code === currentBaseCurrency ? 'active' : ''
              }`}
              onClick={() => handleSelect(currency)}
            >
              <span className="currency-flag">{currency.flag}</span>
              <div className="currency-details">
                <span className="currency-name">{currency.name}</span>
                <span className="currency-code">
                  {currency.code} • {currency.country}
                </span>
              </div>
              {currency.code === currentBaseCurrency && (
                <span className="checkmark">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
