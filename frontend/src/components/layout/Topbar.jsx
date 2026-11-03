import React from 'react';
import { Menu, RefreshCw, ChevronRight, Terminal, Sun, Moon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Button from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';

export default function Topbar({
  title,
  breadcrumbs = [],
  healthStatus,
  onRefresh,
  onOpenMobileNav,
  isRefreshing = false,
}) {
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <header className="h-16 bg-white/90 dark:bg-dark-900/90 backdrop-blur border-b border-slate-200 dark:border-dark-700/60 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand Sidebar (Open Menu)' : 'Collapse Sidebar (Close Menu)'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Page Title & Breadcrumbs */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>ContainerShield</span>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className={idx === breadcrumbs.length - 1 ? 'text-slate-700 dark:text-slate-300 font-medium' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h2>
        </div>
      </div>

      {/* Topbar Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-dark-700/60 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400">
          <Terminal className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>http://localhost:8080</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-dark-850 hover:bg-slate-200 dark:hover:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium font-mono"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">Dark</span>
            </>
          )}
        </button>

        {onRefresh && (
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            isLoading={isRefreshing}
            onClick={onRefresh}
            title="Refresh current view"
          >
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}
      </div>
    </header>
  );
}
