import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, TrendingUp, CalendarDays, Settings2, History as HistoryIcon } from 'lucide-react';
import ActiveWorkoutBanner from '@/components/ActiveWorkoutBanner';

const ITEMS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/plan', label: 'Plan', icon: CalendarDays },
  { to: '/profile', label: 'Settings', icon: Settings2 },
];

export default function BottomNav() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let stopTimer = null;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;

      // Always expand at the top of the page
      if (currentY < 36) {
        setIsCompact(false);
        lastY = currentY;
        return;
      }

      // Compact when scrolling down (> 16px delta)
      if (delta > 16) {
        setIsCompact(true);
      }
      // Expand when scrolling up (< -10px delta)
      else if (delta < -10) {
        setIsCompact(false);
      }

      lastY = currentY;

      // Smoothly expand when scroll stays idle
      if (stopTimer) clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        setIsCompact(false);
      }, 950);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (stopTimer) clearTimeout(stopTimer);
    };
  }, []);

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(8);
      }
    } catch {
      // silent fallback
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pointer-events-none flex flex-col justify-end">
      <ActiveWorkoutBanner />
      <div className="mx-auto max-w-[620px] w-full px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div
          className={`pointer-events-auto rounded-2xl border border-border/80 bg-card/85 backdrop-blur-2xl shadow-2xl shadow-black/50 dock-transition ${
            isCompact ? 'py-1 shadow-lg' : 'py-1.5'
          }`}
        >
          <div className="grid grid-cols-5 items-center">
            {ITEMS.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                onClick={triggerHaptic}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center rounded-xl transition-all duration-150 active:scale-90 select-none ${
                    isCompact ? 'h-11' : 'h-[54px]'
                  } ${isActive ? 'text-brand' : 'text-muted-foreground hover:text-foreground/90'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Pill Capsule Indicator */}
                    {isActive && (
                      <span
                        className={`absolute inset-x-1 rounded-xl transition-all duration-200 pointer-events-none ${
                          isCompact ? 'inset-y-0.5' : 'inset-y-1'
                        }`}
                        style={{
                          background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--brand) 28%, transparent)',
                          borderWidth: '1px',
                        }}
                      />
                    )}

                    {/* Icon */}
                    <span className="relative flex items-center justify-center z-10 transition-transform duration-200">
                      {isActive && (
                        <span
                          className="absolute -inset-1.5 rounded-full blur-sm pointer-events-none"
                          style={{ background: 'var(--brand)', opacity: 0.2 }}
                        />
                      )}
                      <Icon
                        size={isCompact ? 21 : 22}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="relative transition-transform duration-200"
                      />
                    </span>

                    {/* Label - smoothly collapses in compact mode */}
                    <span
                      className={`relative z-10 text-[11px] tracking-wide transition-all duration-200 overflow-hidden leading-tight ${
                        isActive ? 'font-bold' : 'font-medium'
                      } ${
                        isCompact
                          ? 'max-h-0 opacity-0 -translate-y-1 mt-0'
                          : 'max-h-4 opacity-100 translate-y-0 mt-1'
                      }`}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
