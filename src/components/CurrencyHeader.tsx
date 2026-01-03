import type { Currency } from '../data/currencies';

interface CurrencyHeaderProps {
  baseCurrency: Currency;
  onSwapClick: () => void;
  lastUpdated: number | null;
  isLoading: boolean;
  error: string | null;
}

export function CurrencyHeader({
  baseCurrency,
  onSwapClick,
  lastUpdated,
  isLoading,
  error,
}: CurrencyHeaderProps) {
  const getUpdateStatus = () => {
    if (isLoading) return 'Updating rates...';
    if (error) return error;
    if (lastUpdated) {
      const minutesAgo = Math.floor((Date.now() - lastUpdated) / 60000);
      if (minutesAgo < 1) return 'Just updated';
      if (minutesAgo < 60) return `Updated ${minutesAgo}m ago`;
      const hoursAgo = Math.floor(minutesAgo / 60);
      return `Updated ${hoursAgo}h ago`;
    }
    return '';
  };

  return (
    <header className="converter-header">
      <div className="converter-header-content">
        <h1>Currency Converter</h1>
        <p className="category-headline">LIVE EXCHANGE RATES</p>
      </div>
      <div className="currency-header-info">
        <div className="base-currency-display">
          <span className="base-currency-flag">{baseCurrency.flag}</span>
          <span className="base-currency-code">{baseCurrency.code}</span>
          <button className="swap-button" onClick={onSwapClick} title="Change base currency">
            🔄
          </button>
        </div>
        {getUpdateStatus() && (
          <p className="update-status">{getUpdateStatus()}</p>
        )}
      </div>
    </header>
  );
}
