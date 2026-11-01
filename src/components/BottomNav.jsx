import React, { useEffect, useState, useRef } from 'react';
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
  const lastYRef = useRef(0);
  const rafIdRef = useRef(null);
  const stopTimerRef = useRef(null);

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const onScroll = () => {
      if (rafIdRef.current) return;

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const currentY = window.scrollY;
        const delta = currentY - lastYRef.current;

        // Instantly expand if near top of the page
        if (currentY < 30) {
          setIsCompact(false);
          lastYRef.current = currentY;
          return;
        }

        // Fast response: compact quickly on scroll down (> 8px)
        if (delta > 8) {
          setIsCompact(true);
        }
        // Expand immediately when scrolling up (< -5px)
        else if (delta < -5) {
          setIsCompact(false);
        }

        lastYRef.current = currentY;

        // Snappy idle return: restore full size 350ms after scroll ceases
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        stopTimerRef.current = setTimeout(() => {
          setIsCompact(false);
        }, 380);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
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
      <div className="mx-auto max-w-[620px] w-full px-3.5 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <div
          className={`pointer-events-auto rounded-3xl border border-border/85 bg-card/90 backdrop-blur-2xl shadow-2xl shadow-black/60 dock-transition ${
            isCompact ? 'py-1 shadow-lg' : 'py-1.5'
          }`}
        >
          <div className="grid grid-cols-5 items-center px-1">
            {ITEMS.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                onClick={triggerHaptic}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center rounded-2xl transition-all duration-150 active:scale-95 select-none ${
                    isCompact ? 'h-[50px]' : 'h-[64px]'
                  } ${isActive ? 'text-brand' : 'text-muted-foreground hover:text-foreground'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Pill Indicator with subtle brand accent fill */}
                    {isActive && (
                      <span
                        className={`absolute inset-x-1 rounded-2xl transition-all duration-150 pointer-events-none ${
                          isCompact ? 'inset-y-0.5' : 'inset-y-1'
                        }`}
                        style={{
                          background: 'color-mix(in srgb, var(--brand) 14%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--brand) 30%, transparent)',
                          borderWidth: '1px',
                        }}
                      />
                    )}

                    {/* Icon */}
                    <span className="relative flex items-center justify-center z-10 transition-transform duration-150">
                      {isActive && (
                        <span
                          className="absolute -inset-2 rounded-full blur-md pointer-events-none"
                          style={{ background: 'var(--brand)', opacity: 0.25 }}
                        />
                      )}
                      <Icon
                        size={isCompact ? 23 : 25}
                        strokeWidth={isActive ? 2.6 : 2.1}
                        className="relative transition-all duration-150"
                      />
                    </span>

                    {/* Label */}
                    <span
                      className={`relative z-10 text-xs tracking-tight transition-all duration-150 overflow-hidden leading-tight ${
                        isActive ? 'font-bold' : 'font-semibold'
                      } ${
                        isCompact
                          ? 'max-h-0 opacity-0 -translate-y-1 mt-0'
                          : 'max-h-5 opacity-100 translate-y-0 mt-1'
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
