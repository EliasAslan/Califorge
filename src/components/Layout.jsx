import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';

export default function Layout() {
  const { pathname } = useLocation();
  // Hide bottom nav during an active workout session for focus
  const inSession = pathname === '/workout' || pathname === '/summary' || pathname.startsWith('/workout/');

  return (
    <div className="min-h-full">
      <main
        key={pathname}
        className={`mx-auto max-w-[620px] min-h-screen animate-fade-in ${
          inSession ? '' : 'pb-[calc(var(--dock-height)+1.25rem)]'
        }`}
      >
        <Outlet />
      </main>
      {!inSession && <BottomNav />}
    </div>
  );
}
