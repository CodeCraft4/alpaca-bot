import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTradingContext } from '../../context/TradingContext';
import type { OrderSide, OrderType } from '../../types/trading';
import { fmtQty } from '../../lib/format';

export interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (orderId: string) => void;
}

const LAST_KEY = 'abnb_last_amount';
const lastAmount = () => {
  try {
    return localStorage.getItem(LAST_KEY) || '10';
  } catch {
    return '10';
  }
};

/**
 * Compact order ticket: fits on screen without scrolling, and "Place order" sends the order immediately
 * and closes the window at once. The result arrives as a toast (see TradingContext).
 */
export const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose }) => {
  const { currentPrice, availableCash, settings, createNewOrder, priceSource, openPositions } = useTradingContext();

  const [side, setSide] = useState<OrderSide>('Buy');
  const [orderType, setOrderType] = useState<OrderType>('Market');
  const [inputMode, setInputMode] = useState<'dollar' | 'shares'>('dollar');
  const [amount, setAmount] = useState<string>(lastAmount);
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [targetPct, setTargetPct] = useState<number>(settings.profitTargetPct || 3);
  const [errorMessage, setErrorMessage] = useState('');

  const isBuy = side === 'Buy';
  const price = orderType === 'Limit' && limitPrice > 0 ? limitPrice : currentPrice;
  const num = parseFloat(amount) || 0;
  const dollars = inputMode === 'dollar' ? num : num * price;
  const shares = inputMode === 'shares' ? num : price > 0 ? num / price : 0;
  const heldShares = openPositions.reduce((a, p) => a + p.quantity, 0);
  const targetPrice = price * (1 + (targetPct || 0) / 100);
  const profitIfHit = dollars * ((targetPct || 0) / 100);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (currentPrice > 0) setLimitPrice(currentPrice);
      setTargetPct(settings.profitTargetPct || 3);
    }
    // only when the window opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (num <= 0) return setErrorMessage('Enter an amount.');
    if (isBuy && dollars > availableCash + 0.005) return setErrorMessage(`Not enough cash ($${availableCash.toFixed(2)} available).`);
    if (!isBuy && shares > heldShares + 1e-6) return setErrorMessage(`You only hold ${fmtQty(heldShares)} shares.`);
    try {
      localStorage.setItem(LAST_KEY, String(num));
    } catch {
      /* ignore */
    }
    // Fire and close immediately: no loading state, no waiting. The toast reports the result.
    void createNewOrder({
      symbol: 'ABNB',
      side,
      type: orderType,
      dollarAmount: inputMode === 'dollar' ? num : undefined,
      quantity: inputMode === 'shares' ? num : undefined,
      limitPrice: orderType === 'Limit' ? limitPrice : undefined,
      targetPct,
      stopLossPct: 0,
    });
    onClose();
  };

  const box = 'w-full px-3 py-2 rounded-xl border border-brand-border bg-white text-brand-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-order-modal-title"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl border border-brand-border shadow-2xl p-4 space-y-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 id="new-order-modal-title" className="text-base font-bold text-brand-text leading-tight">
              Trade ABNB
            </h2>
            <p className="text-[11px] text-brand-muted">
              Live <span className="font-mono font-bold text-brand-primary">${currentPrice.toFixed(2)}</span> · {priceSource === 'finnhub' ? 'Finnhub' : 'Alpaca'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:bg-brand-bg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buy / Sell */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide('Buy')}
            className={`py-2 rounded-xl text-sm font-bold border transition-colors ${isBuy ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide('Sell')}
            className={`py-2 rounded-xl text-sm font-bold border transition-colors ${!isBuy ? 'bg-brand-primary text-white border-brand-primary' : 'bg-pink-50 text-brand-primary border-pink-100'}`}
          >
            SELL
          </button>
        </div>

        {/* Type + unit */}
        <div className="grid grid-cols-2 gap-2">
          <select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)} className={`${box} text-xs font-sans font-semibold`}>
            <option value="Market">Market (instant)</option>
            <option value="Limit">Limit (at my price)</option>
          </select>
          <div className="grid grid-cols-2 rounded-xl border border-brand-border overflow-hidden text-xs font-bold">
            {(['dollar', 'shares'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  // convert the typed number so the money stays the same when switching unit
                  if (m !== inputMode && price > 0 && num > 0) setAmount(m === 'shares' ? (num / price).toFixed(4) : (num * price).toFixed(2));
                  setInputMode(m);
                }}
                className={`py-2 ${inputMode === m ? 'bg-brand-primary text-white' : 'bg-white text-brand-muted'}`}
              >
                {m === 'dollar' ? 'Dollars $' : 'Shares'}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="relative">
            {inputMode === 'dollar' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted font-mono">$</span>}
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              step={inputMode === 'dollar' ? '0.01' : '0.0001'}
              min="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMessage('');
              }}
              className={`${box} text-lg font-bold ${inputMode === 'dollar' ? 'pl-7' : ''}`}
              placeholder={inputMode === 'dollar' ? '20.00' : '0.1000'}
            />
          </div>
          <p className="text-[11px] text-brand-muted mt-1 font-mono">
            {inputMode === 'dollar' ? `≈ ${shares.toFixed(4)} shares` : `≈ $${dollars.toFixed(2)}`} at ${price.toFixed(2)}
          </p>
        </div>

        {orderType === 'Limit' && (
          <div>
            <label className="block text-[11px] font-semibold text-brand-muted mb-0.5">Limit price ($)</label>
            <input type="number" step="0.01" min="1" value={limitPrice || ''} onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)} className={box} />
          </div>
        )}

        {/* Target (buy only) */}
        {isBuy && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-brand-text">Profit target</label>
              <div className="relative w-28">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={targetPct}
                  onChange={(e) => setTargetPct(parseFloat(e.target.value) || 0)}
                  className={`${box} py-1.5 pr-7 text-right`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted">%</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <div className="text-brand-muted">Live price</div>
                <div className="font-mono font-bold text-brand-text">${currentPrice.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-brand-muted">Sells at</div>
                <div className="font-mono font-bold text-emerald-700">${targetPrice.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-brand-muted">Profit</div>
                <div className="font-mono font-bold text-emerald-700">+${profitIfHit.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Summary line */}
        <div className="flex items-center justify-between text-[11px] font-mono text-brand-muted px-1">
          {isBuy ? (
            <>
              <span>Cash ${availableCash.toFixed(2)}</span>
              <span className="text-brand-primary font-bold">Cost ${dollars.toFixed(2)}</span>
              <span className={availableCash - dollars < 0 ? 'text-brand-danger' : 'text-emerald-700'}>Left ${(availableCash - dollars).toFixed(2)}</span>
            </>
          ) : (
            <>
              <span>You hold {fmtQty(heldShares)} sh</span>
              <span className="text-brand-primary font-bold">Selling ≈ ${dollars.toFixed(2)}</span>
            </>
          )}
        </div>

        {errorMessage && <p className="text-xs font-semibold text-brand-danger px-1">{errorMessage}</p>}

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button type="button" onClick={onClose} className="py-2.5 rounded-xl text-sm font-semibold text-brand-muted hover:bg-brand-bg">
            Cancel
          </button>
          <button
            type="submit"
            className={`col-span-2 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm active:scale-[0.98] transition-transform ${isBuy ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-brand-primary hover:bg-brand-sidebar'}`}
          >
            Place {side.toUpperCase()} Order (${dollars.toFixed(2)})
          </button>
        </div>
      </form>
    </div>
  );
};
