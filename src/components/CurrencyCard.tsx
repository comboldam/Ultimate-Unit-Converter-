import { formatCurrencyValue } from '../data/currencies';
import type { Currency } from '../data/currencies';

interface CurrencyCardProps {
  currency: Currency;
  value: number;
  onClick: () => void;
  isPinned?: boolean;
}

export function CurrencyCard({ currency, value, onClick, isPinned = false }: CurrencyCardProps) {
  const formattedValue = formatCurrencyValue(value);

  return (
    <div className={`currency-card ${isPinned ? 'pinned' : ''}`} onClick={onClick}>
      <div className="currency-card-left">
        <span className="currency-flag">{currency.flag}</span>
        <div className="currency-details">
          <span className="currency-name">{currency.name}</span>
          <span className="currency-code">{currency.code}</span>
        </div>
      </div>
      <div className="currency-card-right">
        <span className="currency-value">
          {currency.symbol} {formattedValue}
        </span>
        {isPinned && <span className="pin-indicator">📌</span>}
      </div>
    </div>
  );
}
