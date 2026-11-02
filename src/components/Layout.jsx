import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';

export default function Layout() {
  const { pathname } = useLocation();
  // Hide bottom nav during an active workout session for focus
  const inSession = pathname === '/workout' || pathname === '/summary' || pathname.startsWith('/workout/');
  const isTabRoute = ['/', '/plan', '/progress', '/history', '/profile'].includes(pathname);

  return (
    <div className="min-h-full">
      <main
        key={pathname}
        className={`mx-auto max-w-[620px] min-h-screen ${
          inSession ? '' : 'pb-[calc(var(--dock-height)+1.25rem)]'
        }`}
        style={{ viewTransitionName: isTabRoute ? 'tab-content' : 'none' }}
      >
        <Outlet />
      </main>
      {!inSession && <BottomNav />}
    </div>
  );
}
