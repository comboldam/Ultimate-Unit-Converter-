import type { Currency } from '../data/currencies';

interface CurrencyInputProps {
  currency: Currency;
  value: string;
  onChange: (value: string) => void;
}

export function CurrencyInput({ currency, value, onChange }: CurrencyInputProps) {
  return (
    <div className="currency-input-card">
      <div className="currency-input-header">
        <span className="currency-flag">{currency.flag}</span>
        <div className="currency-details">
          <span className="currency-name">{currency.name}</span>
          <span className="currency-code">{currency.code}</span>
        </div>
      </div>
      <input
        type="number"
        inputMode="decimal"
        pattern="[0-9]*"
        className="currency-amount-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        autoFocus
      />
    </div>
  );
}
