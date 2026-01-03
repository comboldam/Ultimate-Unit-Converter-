import { useState, useEffect } from 'react';
import { useCurrencyRates } from '../hooks/useCurrencyRates';
import { currencies, getCurrencyByCode } from '../data/currencies';
import type { Currency } from '../data/currencies';
import { CurrencyHeader } from '../components/CurrencyHeader';
import { CurrencyInput } from '../components/CurrencyInput';
import { CurrencyCard } from '../components/CurrencyCard';
import { CurrencyPicker } from '../components/CurrencyPicker';
import { CurrencyActionModal } from '../components/CurrencyActionModal';

const PINNED_CURRENCIES_KEY = 'pinned_currencies';

export function CurrencyPage() {
  const {
    baseCurrency,
    amount,
    setAmount,
    rates,
    setBaseCurrency,
    lastUpdated,
    isLoading,
    error,
  } = useCurrencyRates('USD');

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedCurrencies, setPinnedCurrencies] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Load pinned currencies from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PINNED_CURRENCIES_KEY);
      if (saved) {
        setPinnedCurrencies(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load pinned currencies:', err);
    }
  }, []);

  // Save pinned currencies to localStorage
  const savePinnedCurrencies = (pinned: string[]) => {
    try {
      localStorage.setItem(PINNED_CURRENCIES_KEY, JSON.stringify(pinned));
      setPinnedCurrencies(pinned);
    } catch (err) {
      console.error('Failed to save pinned currencies:', err);
    }
  };

  const baseCurrencyData = getCurrencyByCode(baseCurrency);
  const numericAmount = parseFloat(amount) || 0;

  // Filter out the base currency from the list
  const otherCurrencies = currencies.filter((c) => c.code !== baseCurrency);

  // Filter by search query
  const filteredCurrencies = otherCurrencies.filter((currency) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      currency.code.toLowerCase().includes(query) ||
      currency.name.toLowerCase().includes(query) ||
      currency.country.toLowerCase().includes(query)
    );
  });

  // Separate pinned and unpinned currencies
  const pinnedCurrencyList = pinnedCurrencies
    .map(code => filteredCurrencies.find(c => c.code === code))
    .filter((c): c is Currency => c !== undefined);

  const unpinnedCurrencyList = filteredCurrencies.filter(
    c => !pinnedCurrencies.includes(c.code)
  );

  // Combine: pinned first, then unpinned
  const sortedCurrencies = [...pinnedCurrencyList, ...unpinnedCurrencyList];

  // Convert rates to selected base
  const getConvertedRate = (targetCode: string): number => {
    if (baseCurrency === 'USD') {
      return rates[targetCode] || 0;
    }
    const baseRate = rates[baseCurrency] || 1;
    const targetRate = rates[targetCode] || 0;
    return targetRate / baseRate;
  };

  const handleBaseCurrencyChange = (currency: Currency) => {
    setBaseCurrency(currency.code);
  };

  const handleCurrencyCardClick = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsActionModalOpen(true);
  };

  const handlePinCurrency = () => {
    if (!selectedCurrency) return;

    // Add to beginning of pinned list (most recent = top)
    const newPinned = [selectedCurrency.code, ...pinnedCurrencies.filter(code => code !== selectedCurrency.code)];
    savePinnedCurrencies(newPinned);
    setIsActionModalOpen(false);
  };

  const handleUnpinCurrency = () => {
    if (!selectedCurrency) return;

    const newPinned = pinnedCurrencies.filter(code => code !== selectedCurrency.code);
    savePinnedCurrencies(newPinned);
    setIsActionModalOpen(false);
  };

  return (
    <div className="currency-page">
      {baseCurrencyData && (
        <CurrencyHeader
          baseCurrency={baseCurrencyData}
          onSwapClick={() => setIsPickerOpen(true)}
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          error={error}
        />
      )}

      {baseCurrencyData && (
        <CurrencyInput
          currency={baseCurrencyData}
          value={amount}
          onChange={setAmount}
        />
      )}

      <div className="currency-search">
        <input
          type="text"
          className="currency-search-input"
          placeholder="Search currency (code, name...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="currency-list">
        {sortedCurrencies.map((currency) => {
          const rate = getConvertedRate(currency.code);
          const convertedValue = numericAmount * rate;
          const isPinned = pinnedCurrencies.includes(currency.code);

          return (
            <CurrencyCard
              key={currency.code}
              currency={currency}
              value={convertedValue}
              onClick={() => handleCurrencyCardClick(currency)}
              isPinned={isPinned}
            />
          );
        })}
      </div>

      <CurrencyPicker
        isOpen={isPickerOpen}
        currentBaseCurrency={baseCurrency}
        onSelect={handleBaseCurrencyChange}
        onClose={() => setIsPickerOpen(false)}
      />

      <CurrencyActionModal
        isOpen={isActionModalOpen}
        currency={selectedCurrency}
        isPinned={selectedCurrency ? pinnedCurrencies.includes(selectedCurrency.code) : false}
        onPin={handlePinCurrency}
        onUnpin={handleUnpinCurrency}
        onClose={() => setIsActionModalOpen(false)}
      />
    </div>
  );
}
