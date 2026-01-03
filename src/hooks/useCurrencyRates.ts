import { useState, useEffect } from 'react';
import { updateCurrencies } from '../data/currencies';

const CACHE_KEY = 'currency_rates_cache';
const API_URL = 'https://open.er-api.com/v6/latest/USD';

interface CacheData {
  base: string;
  rates: Record<string, number>;
  lastUpdated: number;
}

interface UseCurrencyRatesResult {
  baseCurrency: string;
  amount: string;
  setAmount: (value: string) => void;
  rates: Record<string, number>;
  setBaseCurrency: (code: string) => void;
  lastUpdated: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useCurrencyRates(initialBase: string = 'USD'): UseCurrencyRatesResult {
  const [baseCurrency, setBaseCurrencyState] = useState(initialBase);
  const [amount, setAmount] = useState('1');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cached rates from localStorage
  const loadCachedRates = (): CacheData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Failed to load cached rates:', err);
    }
    return null;
  };

  // Save rates to localStorage
  const saveCachedRates = (data: CacheData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save cached rates:', err);
    }
  };

  // Fetch rates from API (always USD base)
  const fetchRates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      const newRates = data.rates;
      const timestamp = Date.now();

      updateCurrencies(newRates);
      setRates(newRates);
      setLastUpdated(timestamp);

      // Cache the data
      saveCachedRates({
        base: 'USD',
        rates: newRates,
        lastUpdated: timestamp,
      });

      setIsLoading(false);
    } catch (err) {
      console.error('API fetch failed, loading cached rates:', err);

      // Try to load cached rates
      const cached = loadCachedRates();
      if (cached) {
        updateCurrencies(cached.rates);
        setRates(cached.rates);
        setLastUpdated(cached.lastUpdated);
        setError('Using cached data (offline)');
      } else {
        setError('Failed to fetch rates and no cache available');
      }

      setIsLoading(false);
    }
  };

  // Initialize: load cached rates first, then fetch fresh data
  useEffect(() => {
    const cached = loadCachedRates();
    if (cached) {
      updateCurrencies(cached.rates);
      setRates(cached.rates);
      setLastUpdated(cached.lastUpdated);
      setIsLoading(false);
    }

    // Fetch fresh data in background
    fetchRates();
  }, []);

  // Handle base currency change (pure math, no refetch)
  const setBaseCurrency = (newBase: string) => {
    if (newBase === baseCurrency) return;
    setBaseCurrencyState(newBase);
  };

  return {
    baseCurrency,
    amount,
    setAmount,
    rates,
    setBaseCurrency,
    lastUpdated,
    isLoading,
    error,
  };
}
