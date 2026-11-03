import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  LayoutDashboard,
  Box,
  Search,
  History,
  Code2,
  Bot,
  Settings,
  Activity,
  Network,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import DockerIcon from '../common/DockerIcon';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';

export default function Sidebar({ healthStatus, className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Containers', path: '/containers', icon: Box },
    { label: 'Runtime Security', path: '/runtime-security', icon: ShieldCheck },
    { label: 'Images', path: '/images', icon: DockerIcon },
    { label: 'Scan Image', path: '/scans/new', icon: Search },
    { label: 'Scan History', path: '/scans/history', icon: History },
    { label: 'Source Scanner', path: '/source-scan', icon: Code2 },
    { label: 'Security Analysis', path: '/security-analysis', icon: Network },
    { label: 'Security Assistant', path: '/assistant', icon: Bot },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white dark:bg-dark-950 border-r border-slate-200 dark:border-dark-700/60 flex flex-col h-screen sticky top-0 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${className}`}
    >
      {/* Brand Header */}
      <div className={`p-4 border-b border-slate-200 dark:border-dark-700/60 flex items-center justify-between ${isCollapsed ? 'flex-col gap-3 justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-600/10 dark:bg-brand-600/20 border border-brand-500/30 rounded-lg text-brand-600 dark:text-brand-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight truncate">
                ContainerShield
              </h1>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">v1.0.0 • SecOps</p>
            </div>
          )}
        </div>

        {/* Sidebar Toggle Button */}
        <div className="flex items-center gap-1">
          {!isCollapsed && (
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          )}

          <button
            onClick={toggleSidebar}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand Sidebar (Open Menu)' : 'Collapse Sidebar (Close Menu)'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 uppercase font-mono">
            Security Platform
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isCollapsed ? 'justify-center px-0 py-3' : ''
                } ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-600/15 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-850'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapsed Theme Toggle if collapsed */}
      {isCollapsed && (
        <div className="p-2 border-t border-slate-200 dark:border-dark-700/60 flex justify-center">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      )}

      {/* Footer / Connection Status */}
      <div className="p-3 border-t border-slate-200 dark:border-dark-700/60 bg-slate-50 dark:bg-dark-900/40">
        <div className={`flex items-center text-xs text-slate-600 dark:text-slate-400 ${isCollapsed ? 'justify-center' : 'justify-between px-1 py-1'}`}>
          {!isCollapsed && (
            <span className="flex items-center gap-2 font-medium">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              Backend API
            </span>
          )}
          <span
            title={isCollapsed ? `Backend API: ${healthStatus}` : undefined}
            className={`inline-flex items-center rounded-full text-[10px] font-medium ${
              isCollapsed ? 'p-1.5' : 'px-2 py-0.5'
            } ${
              healthStatus === 'online'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50'
                : healthStatus === 'checking'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-800/50'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 dark:border-rose-800/50'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${!isCollapsed ? 'mr-1.5' : ''} ${
                healthStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {!isCollapsed && (healthStatus === 'online' ? 'Connected' : healthStatus === 'checking' ? 'Checking...' : 'Offline')}
          </span>
        </div>
      </div>
    </aside>
  );
}
