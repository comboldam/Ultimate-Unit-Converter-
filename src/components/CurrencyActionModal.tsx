import type { Currency } from '../data/currencies';

interface CurrencyActionModalProps {
  isOpen: boolean;
  currency: Currency | null;
  isPinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
  onClose: () => void;
}

export function CurrencyActionModal({
  isOpen,
  currency,
  isPinned,
  onPin,
  onUnpin,
  onClose,
}: CurrencyActionModalProps) {
  if (!isOpen || !currency) return null;

  return (
    <div className="currency-action-overlay" onClick={onClose}>
      <div className="currency-action-modal" onClick={(e) => e.stopPropagation()}>
        <div className="currency-action-header">
          <div className="currency-action-title">
            <span className="currency-flag-large">{currency.flag}</span>
            <div>
              <h3>{currency.name}</h3>
              <p>{currency.code}</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="currency-action-buttons">
          {isPinned ? (
            <button className="action-button unpin-button" onClick={onUnpin}>
              📌 Unpin from top
            </button>
          ) : (
            <button className="action-button pin-button" onClick={onPin}>
              📌 Pin to top
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
