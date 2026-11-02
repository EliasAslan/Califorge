import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, CalendarDays, Settings2, History as HistoryIcon } from 'lucide-react';
import ActiveWorkoutBanner from '@/components/ActiveWorkoutBanner';
import { triggerFeedback } from '@/lib/workoutFeedback';
import { withViewTransition } from '@/lib/viewTransition';

// Today → plan → progress → history → settings.
const ITEMS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/plan', label: 'Plan', icon: CalendarDays },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/profile', label: 'Settings', icon: Settings2 },
];

export default function BottomNav() {
  const navRef = useRef(null);
  const publishRef = useRef(() => {});
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentIndex = ITEMS.findIndex((item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to),
  );

  // Publish the live dock height so Layout can reserve exactly the right space.
  // The strip can appear after this mounts (session load), so watch the nav's
  // subtree as well as its box. ResizeObserver is the fast path; the mutation
  // and pathname fallbacks cover browsers/background tabs that throttle it.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return undefined;

    let frame = 0;
    let timer = 0;
    const publish = () => {
      const rect = el.getBoundingClientRect();
      const height = Math.max(0, window.innerHeight - rect.top);
      document.documentElement.style.setProperty('--dock-height', `${Math.round(height)}px`);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      publish();
      frame = requestAnimationFrame(publish);
      timer = setTimeout(publish, 80);
    };

    publishRef.current = schedule;
    schedule();

    const resize = new ResizeObserver(schedule);
    resize.observe(el);
    const mutation = new MutationObserver(schedule);
    mutation.observe(el, { childList: true, subtree: true });
    window.addEventListener('califorge:session-changed', schedule);
    window.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      resize.disconnect();
      mutation.disconnect();
      window.removeEventListener('califorge:session-changed', schedule);
      window.removeEventListener('resize', schedule);
      document.documentElement.style.removeProperty('--dock-height');
    };
  }, []);

  // A route change can add or remove the session strip in the same commit.
  useEffect(() => {
    const timer = setTimeout(() => publishRef.current(), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className="fixed inset-x-0 bottom-[max(0.875rem,env(safe-area-inset-bottom))] z-40 px-3.5"
    >
      <div className="mx-auto w-full max-w-[620px] overflow-hidden rounded-[22px] border border-border bg-background/95 shadow-xl shadow-black/20 backdrop-blur-md">
        <ActiveWorkoutBanner />
        <div className="grid grid-cols-5">
          {ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={(event) => {
                event.preventDefault();
                triggerFeedback('selection');
                const targetIndex = ITEMS.findIndex((item) => item.to === to);
                const direction =
                  targetIndex > currentIndex ? 'forward' : targetIndex < currentIndex ? 'backward' : null;
                withViewTransition(() => navigate(to), 'tab', direction);
              }}
              className={({ isActive }) =>
                `relative flex h-[74px] flex-col items-center justify-center gap-2 outline-none transition-colors duration-150 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)] ${
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-5 top-0 h-[2px] origin-center rounded-full bg-[var(--brand)] transition-[opacity,transform] duration-150 ${
                      isActive ? 'scale-x-100 opacity-100' : 'scale-x-75 opacity-0'
                    }`}
                  />
                  <Icon size={24} strokeWidth={isActive ? 2.2 : 1.9} aria-hidden="true" />
                  <span
                    className={`text-[12px] leading-none tracking-[-0.01em] ${
                      isActive ? 'font-semibold' : 'font-medium'
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
    </nav>
  );
}
