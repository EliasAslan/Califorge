import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import ConsoleSheet from '@/components/workout/ConsoleSheet';
import { haptic } from '@/lib/workoutFeedback';

const ITEM_H = 44;
const VISIBLE_ROWS = 5;
const PAD = ((VISIBLE_ROWS - 1) / 2) * ITEM_H;

const roundTo = (value, step, min, max) => {
  const n = Math.min(max, Math.max(min, Number(value) || 0));
  return Number((Math.round((n - min) / step) * step + min).toFixed(3));
};

const formatNumber = (value) => {
  if (value == null || Number.isNaN(value)) return '—';
  return String(Number(Number(value).toFixed(2)));
};

export default function WheelSheet({
  open,
  onOpenChange,
  title,
  description,
  unit = '',
  value,
  seed,
  min = 0,
  max = 100,
  step = 1,
  presets = [],
  stepOptions = [],
  onStepChange,
  onCommit,
}) {
  const wheelId = useId().replace(/:/g, '');
  const scrollRef = useRef(null);
  const settleRef = useRef(null);
  const draftRef = useRef(value ?? seed ?? min);
  const lastIndexRef = useRef(-1);
  const previousStepRef = useRef(step);

  const [draft, setDraft] = useState(value ?? seed ?? min);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');

  draftRef.current = draft;

  const values = useMemo(() => {
    const list = [];
    const count = Math.floor((max - min) / step + 0.0001);
    for (let index = 0; index <= count; index += 1) {
      list.push(Number((min + index * step).toFixed(3)));
    }
    return list;
  }, [min, max, step]);

  const indexFor = (candidate) => {
    const index = Math.round((Number(candidate) - min) / step);
    return Math.max(0, Math.min(values.length - 1, index));
  };

  const scrollToIndex = (index, behavior = 'auto') => {
    const element = scrollRef.current;
    if (!element) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    element.scrollTo({
      top: Math.max(0, index) * ITEM_H,
      behavior: reduce ? 'auto' : behavior,
    });
  };

  // Opening resets the wheel to the current value, or to the target/last value.
  // Vaul mounts the portal a frame later, so retry until the wheel ref exists.
  useEffect(() => {
    if (!open) return undefined;
    const initial = roundTo(value ?? seed ?? min, step, min, max);
    setDraft(initial);
    setTyping(false);
    lastIndexRef.current = indexFor(initial);
    let cancelled = false;
    let timer = 0;
    const centre = (attempt) => {
      if (cancelled) return;
      const element = scrollRef.current;
      if (element) {
        element.scrollTop = indexFor(initial) * ITEM_H;
        return;
      }
      if (attempt < 10) timer = setTimeout(() => centre(attempt + 1), 40);
    };
    centre(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Changing the step keeps the current value and re-centres the wheel.
  useEffect(() => {
    if (previousStepRef.current === step) return;
    previousStepRef.current = step;
    const rounded = roundTo(draftRef.current, step, min, max);
    setDraft(rounded);
    const frame = requestAnimationFrame(() => scrollToIndex(indexFor(rounded), 'auto'));
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, min, max]);

  useEffect(() => () => {
    if (settleRef.current) clearTimeout(settleRef.current);
  }, []);

  const handleScroll = () => {
    if (settleRef.current) clearTimeout(settleRef.current);
    const element = scrollRef.current;
    if (element && values.length > 0) {
      const index = Math.max(0, Math.min(values.length - 1, Math.round(element.scrollTop / ITEM_H)));
      const next = values[index];
      if (next !== draftRef.current) {
        setDraft(next);
        if (index !== lastIndexRef.current) {
          lastIndexRef.current = index;
          haptic('tick');
        }
      }
    }
    settleRef.current = setTimeout(() => {
      const element = scrollRef.current;
      if (!element) return;
      const index = Math.max(0, Math.min(values.length - 1, Math.round(element.scrollTop / ITEM_H)));
      const next = values[index];
      element.scrollTo({ top: index * ITEM_H, behavior: 'auto' });
      setDraft(next);
    }, 55);
  };

  const chooseValue = (candidate) => {
    const rounded = roundTo(candidate, step, min, max);
    setDraft(rounded);
    // Jump instead of smooth-scrolling so the committed value can never lag
    // behind the wheel when the user taps "Use" immediately afterwards.
    const element = scrollRef.current;
    if (element) element.scrollTop = indexFor(rounded) * ITEM_H;
  };

  const commitTyped = (commit = false) => {
    const parsed = Number(String(typed).replace(',', '.'));
    if (Number.isFinite(parsed)) {
      const rounded = roundTo(parsed, step, min, max);
      if (commit) {
        setDraft(rounded);
        setTyping(false);
        onCommit?.(rounded);
        onOpenChange(false);
        return;
      }
      chooseValue(parsed);
    }
    setTyping(false);
  };

  const handleKeyDown = (event) => {
    const index = indexFor(draftRef.current);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      chooseValue(values[Math.min(values.length - 1, index + 1)]);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      chooseValue(values[Math.max(0, index - 1)]);
    } else if (event.key === 'PageDown') {
      event.preventDefault();
      chooseValue(values[Math.min(values.length - 1, index + 5)]);
    } else if (event.key === 'PageUp') {
      event.preventDefault();
      chooseValue(values[Math.max(0, index - 5)]);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onCommit?.(currentValue());
      onOpenChange(false);
    }
  };

  const selectedIndex = indexFor(draft);
  const usablePresets = presets.filter((preset) => preset && Number.isFinite(preset.value));

  // Read the wheel position directly so a fast flick + tap can't commit the
  // value from one row ago while the debounce is still settling.
  function currentValue() {
    const element = scrollRef.current;
    if (!element) return draftRef.current;
    const index = Math.max(0, Math.min(values.length - 1, Math.round(element.scrollTop / ITEM_H)));
    return values[index];
  }

  const commit = () => {
    onCommit?.(currentValue());
    onOpenChange(false);
  };

  return (
    <ConsoleSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="console-sheet-wheel"
      onOverlayClick={commit}
      footer={
        <div className="console-wheel-footer">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="console-secondary-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={commit}
            className="console-primary"
          >
            Confirm {formatNumber(draft)}{unit ? ` ${unit}` : ''}
          </button>
        </div>
      }
    >
      <div className="flex items-end justify-between gap-3 pb-1">
        {typing ? (
          <input
            autoFocus
            inputMode="decimal"
            aria-label={`${title} exact value`}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            onBlur={() => commitTyped(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitTyped(true);
              }
              if (event.key === 'Escape') setTyping(false);
            }}
            className="w-[5ch] border-b border-[var(--console-chalk)] bg-transparent text-[44px] font-extrabold tabular-nums leading-none tracking-[-0.05em] text-[var(--console-chalk)] outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTyped(formatNumber(draft));
              setTyping(true);
            }}
            className="text-left text-[44px] font-extrabold tabular-nums leading-none tracking-[-0.05em] text-[var(--console-chalk)]"
          >
            {formatNumber(draft)}
            {unit && <span className="ml-1 text-[15px] font-semibold tracking-normal text-[var(--console-steel)]">{unit}</span>}
          </button>
        )}
        <span className="pb-1 text-[11px] font-medium text-[var(--console-steel)]">
          {typing ? 'Enter to set' : 'Swipe or tap a value'}
        </span>
      </div>

      {usablePresets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-3 pt-2">
          {usablePresets.map((preset) => (
            <button
              key={`${preset.label}-${preset.value}`}
              type="button"
              onClick={() => chooseValue(preset.value)}
              className={`console-chip ${roundTo(preset.value, step, min, max) === draft ? 'is-on' : ''}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <div className="console-wheel-wrap" data-vaul-no-drag>
        <div
          ref={scrollRef}
          className="console-wheel"
          role="listbox"
          aria-label={title}
          aria-activedescendant={`${wheelId}-${selectedIndex}`}
          tabIndex={0}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
        >
          <div style={{ height: PAD }} aria-hidden="true" />
          {values.map((option, index) => (
            <div
              key={option}
              id={`${wheelId}-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={`console-wheel-item ${index === selectedIndex ? 'is-selected' : ''}`}
              onClick={() => chooseValue(option)}
            >
              {formatNumber(option)}
            </div>
          ))}
          <div style={{ height: PAD }} aria-hidden="true" />
        </div>
        <div className="console-wheel-band" aria-hidden="true" />
      </div>

      {stepOptions.length > 0 && onStepChange && (
        <div className="flex items-center gap-2 border-t border-[var(--console-line)] pt-3">
          <span className="mr-auto text-[11px] font-semibold text-[var(--console-steel)]">
            Step{unit ? ` (${unit})` : ''}
          </span>
          {stepOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onStepChange(option)}
              aria-pressed={option === step}
              className={`console-chip min-w-[44px] ${option === step ? 'is-on' : ''}`}
            >
              {formatNumber(option)}
            </button>
          ))}
        </div>
      )}
    </ConsoleSheet>
  );
}
