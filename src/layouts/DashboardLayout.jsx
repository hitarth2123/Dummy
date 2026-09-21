import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * DashboardLayout — shared shell for all authenticated role dashboards.
 * Sidebar + Topbar + main content area.
 * To be fully built out in EPIC-03.
 */
const DashboardLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar — implemented in EPIC-03 */}
      <aside style={{ width: 240, background: 'var(--color-surface)' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar — implemented in EPIC-03 */}
        <header style={{ height: 64, background: 'var(--color-surface-2)' }} />

        <main style={{ flex: 1, padding: 'var(--space-6)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
