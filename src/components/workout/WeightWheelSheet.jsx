import React, { useEffect, useRef, useState } from 'react';
import ConsoleSheet from '@/components/workout/ConsoleSheet';
import { haptic } from '@/lib/workoutFeedback';

const ITEM_H = 44;
const PAD = ITEM_H * 2;
const DECIMALS = Array.from({ length: 10 }, (_, index) => index);

function WheelColumn({ label, values, value, onChange, min = 0 }) {
  const ref = useRef(null);
  const settle = useRef(null);
  const index = Math.max(0, values.indexOf(value));

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = index * ITEM_H;
  }, [index, values]);

  useEffect(() => () => clearTimeout(settle.current), []);

  const handleScroll = () => {
    clearTimeout(settle.current);
    const element = ref.current;
    if (!element) return;
    const nextIndex = Math.max(0, Math.min(values.length - 1, Math.round(element.scrollTop / ITEM_H)));
    if (values[nextIndex] !== value) {
      onChange(values[nextIndex]);
      haptic('tick');
    }
    settle.current = setTimeout(() => {
      const settled = Math.max(0, Math.min(values.length - 1, Math.round(element.scrollTop / ITEM_H)));
      element.scrollTo({ top: settled * ITEM_H, behavior: 'auto' });
      onChange(values[settled]);
    }, 60);
  };

  const choose = (next) => {
    const nextIndex = values.indexOf(next);
    if (nextIndex < 0) return;
    if (ref.current) ref.current.scrollTop = nextIndex * ITEM_H;
    onChange(next);
    haptic('selection');
  };

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--console-steel)]">{label}</p>
      <div className="console-wheel-wrap h-[220px]">
        <div ref={ref} className="console-wheel" onScroll={handleScroll} role="listbox" aria-label={label} tabIndex={0}>
          <div style={{ height: PAD }} aria-hidden="true" />
          {values.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              className={`console-wheel-item w-full ${option === value ? 'is-selected' : ''}`}
              onClick={() => choose(option)}
            >
              {String(option).padStart(label === 'Decimal' ? 1 : 2, '0')}
            </button>
          ))}
          <div style={{ height: PAD }} aria-hidden="true" />
        </div>
        <div className="console-wheel-band" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function WeightWheelSheet({ open, onOpenChange, value, unit = 'kg', onCommit }) {
  const minWhole = unit === 'lb' ? 55 : 25;
  const maxWhole = unit === 'lb' ? 550 : 250;
  const wholeValues = Array.from({ length: maxWhole - minWhole + 1 }, (_, index) => minWhole + index);
  const initial = Number.isFinite(Number(value)) ? Number(value) : (unit === 'lb' ? 154 : 70);
  const [whole, setWhole] = useState(Math.floor(initial));
  const [decimal, setDecimal] = useState(Math.round((initial - Math.floor(initial)) * 10) % 10);

  useEffect(() => {
    if (!open) return;
    const next = Number.isFinite(Number(value)) ? Number(value) : (unit === 'lb' ? 154 : 70);
    setWhole(Math.min(maxWhole, Math.max(minWhole, Math.floor(next))));
    setDecimal(Math.round((next - Math.floor(next)) * 10) % 10);
  }, [open, value, minWhole, maxWhole, unit]);

  const current = Number(`${whole}.${decimal}`);
  const confirm = () => {
    onCommit?.(current);
    onOpenChange(false);
  };

  return (
    <ConsoleSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Log bodyweight"
      description="Choose your bodyweight using the two wheels."
      className="console-sheet-wheel"
      footer={
        <div className="console-wheel-footer">
          <button type="button" onClick={() => onOpenChange(false)} className="console-secondary-button">Cancel</button>
          <button type="button" onClick={confirm} className="console-primary">Save {current.toFixed(1)} {unit}</button>
        </div>
      }
    >
      <div className="mb-3 flex items-baseline justify-center gap-1 text-[42px] font-extrabold leading-none tracking-[-0.05em] text-[var(--console-chalk)] tabular-nums">
        {whole}<span className="text-[var(--console-steel)]">.</span>{decimal}
        <span className="ml-1 text-[14px] font-semibold tracking-normal text-[var(--console-steel)]">{unit}</span>
      </div>
      <div className="relative flex gap-3" data-vaul-no-drag>
        <WheelColumn label="Whole" values={wholeValues} value={whole} onChange={setWhole} />
        <span className="mt-[104px] text-xl font-bold text-[var(--console-steel)]">.</span>
        <WheelColumn label="Decimal" values={DECIMALS} value={decimal} onChange={setDecimal} />
      </div>
      <p className="mt-3 text-center text-[10px] text-[var(--console-steel)]">Swipe each column separately · 0.1 {unit} steps</p>
    </ConsoleSheet>
  );
}
