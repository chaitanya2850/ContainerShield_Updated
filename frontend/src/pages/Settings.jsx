import React from 'react';
import { Sun, Moon, Server, Shield, Cpu, Database } from 'lucide-react';
import Card from '../components/common/Card';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Theme Preference Card */}
      <Card title="Visual Theme Preference" subtitle="Switch between Dark mode and Light mode UI">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              Active Appearance: <span className="text-brand-600 dark:text-brand-400 uppercase">{theme} Mode</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Customize the ContainerShield interface for daytime developer work or dark SOC security monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              Light Mode
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-dark-800 text-white shadow-xs border border-dark-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              Dark Mode
            </button>
          </div>
        </div>
      </Card>

      {/* System Architecture Tech Stack */}
      <Card title="Platform Architecture & Services" subtitle="Integrated components powering ContainerShield">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold">
              <Server className="w-4 h-4" /> Spring Boot REST Backend
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">Java 17, Spring Data JPA, REST controllers handling Docker CLI & scanner process execution.</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
              <Shield className="w-4 h-4" /> Trivy Scanner v0.74.0
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">Container vulnerability analysis engine running as a Docker Compose service.</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
              <Cpu className="w-4 h-4" /> Semgrep Source Scanner
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">Static code analysis using Java rulesets (p/java) for detecting SQLi and code defects.</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
              <Database className="w-4 h-4" /> PostgreSQL & Ollama AI
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">PostgreSQL scan history storage & local Ollama (qwen2.5-coder:7b) security LLM.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
