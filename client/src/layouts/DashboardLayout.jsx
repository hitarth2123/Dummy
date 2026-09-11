import React from 'react';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Navbar from '@components/layout/Navbar';
import Sidebar from '@components/layout/Sidebar';
import Footer from '@components/layout/Footer';
import PageWrapper from '@components/layout/PageWrapper';

/**
 * DashboardLayout — shared shell for all authenticated role dashboards.
 * Sidebar + Topbar + main content area.
 * To be fully built out in EPIC-03.
 */
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <PageWrapper>
          <Outlet />
        </PageWrapper>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
