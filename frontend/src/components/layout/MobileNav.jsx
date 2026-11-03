import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  X,
  LayoutDashboard,
  Box,
  Search,
  History,
  Code2,
  Bot,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import DockerIcon from '../common/DockerIcon';
import { useTheme } from '../../context/ThemeContext';

export default function MobileNav({ isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Containers', path: '/containers', icon: Box },
    { label: 'Images', path: '/images', icon: DockerIcon },
    { label: 'Scan Image', path: '/scans/new', icon: Search },
    { label: 'Scan History', path: '/scans/history', icon: History },
    { label: 'Source Scanner', path: '/source-scan', icon: Code2 },
    { label: 'Security Assistant', path: '/assistant', icon: Bot },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Nav Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-dark-950 border-r border-slate-200 dark:border-dark-700/80 flex flex-col z-10"
          >
            <div className="p-5 border-b border-slate-200 dark:border-dark-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-600/10 dark:bg-brand-600/20 border border-brand-500/30 rounded-lg text-brand-600 dark:text-brand-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h1 className="font-bold text-slate-900 dark:text-slate-100 text-base tracking-tight">ContainerShield</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-850'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
