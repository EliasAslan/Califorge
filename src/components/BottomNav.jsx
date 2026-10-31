import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, TrendingUp, CalendarDays, Settings2, History as HistoryIcon } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/plan', label: 'Plan', icon: CalendarDays },
  { to: '/profile', label: 'Settings', icon: Settings2 },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="mx-auto max-w-[620px] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/40">
          <div className="grid grid-cols-5">
            {ITEMS.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2.5 transition-colors ${
                    isActive ? 'text-brand' : 'text-muted-foreground hover:text-foreground/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      {isActive && (
                        <span className="absolute -inset-2 rounded-full blur-sm" style={{ background: 'var(--brand)', opacity: 0.14 }} />
                      )}
                      <Icon
                        size={20}
                        strokeWidth={isActive ? 2.4 : 2}
                        className="relative"
                      />
                    </span>
                    <span className={`text-[10px] tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}>
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