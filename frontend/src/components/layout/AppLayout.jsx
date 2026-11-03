import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import { checkHealth } from '../../services/healthService';

export default function AppLayout({ onRefreshPage, isRefreshing = false }) {
  const [healthStatus, setHealthStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const fetchHealth = async () => {
    try {
      setHealthStatus('checking');
      await checkHealth();
      setHealthStatus('online');
    } catch (err) {
      setHealthStatus('offline');
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Determine topbar title & breadcrumbs from pathname
  const getPageMeta = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return { title: 'Security Dashboard', breadcrumbs: ['Dashboard'] };
    if (path === '/containers') return { title: 'Docker Containers', breadcrumbs: ['Containers'] };
    if (path.startsWith('/containers/')) return { title: 'Container Details', breadcrumbs: ['Containers', 'Details'] };
    if (path === '/images') return { title: 'Docker Images', breadcrumbs: ['Images'] };
    if (path.startsWith('/images/')) return { title: 'Image Details', breadcrumbs: ['Images', 'Details'] };
    if (path === '/scans/new') return { title: 'Scan Docker Image', breadcrumbs: ['Scans', 'New Scan'] };
    if (path === '/scans/history') return { title: 'Scan History', breadcrumbs: ['Scans', 'History'] };
    if (path.startsWith('/scans/')) return { title: 'Scan Analysis Details', breadcrumbs: ['Scans', 'Analysis'] };
    if (path === '/source-scan') return { title: 'Source Code Scanner', breadcrumbs: ['Semgrep', 'Scan'] };
    if (path.startsWith('/source-scan/')) return { title: 'Semgrep Scan Details', breadcrumbs: ['Semgrep', 'Details'] };
    if (path === '/runtime-security') {return { title: 'Runtime Security Analysis', breadcrumbs: ['Security', 'Runtime Analysis']};}
    if (path === '/assistant') return { title: 'Security Assistant', breadcrumbs: ['AI Assistant'] };
    if (path === '/settings') return { title: 'Platform Settings', breadcrumbs: ['Settings'] };
    if (path === '/runtime-security') {return { title: 'Runtime Security Analysis', breadcrumbs: ['Security', 'Runtime Analysis']};}
    if (path === '/security-analysis') {return { title: 'Security Analysis', breadcrumbs: ['Security', 'Analysis']};}
    return { title: 'Page Not Found', breadcrumbs: ['404'] };
  };

  const meta = getPageMeta();

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-dark-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar healthStatus={healthStatus} className="hidden lg:flex" />

      {/* Mobile Slide-over Nav */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={meta.title}
          breadcrumbs={meta.breadcrumbs}
          healthStatus={healthStatus}
          onRefresh={onRefreshPage}
          isRefreshing={isRefreshing}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-dark-700/60 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-400">ContainerShield</span> — Docker Security & Vulnerability Intelligence Platform
          </div>
          <div className="font-mono text-[11px]">
            Spring Boot + Trivy + Semgrep + Ollama
          </div>
        </footer>
      </div>
    </div>
  );
}
