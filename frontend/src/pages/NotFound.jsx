import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="p-4 bg-rose-950/60 border border-rose-800/50 rounded-full text-rose-400 mb-4">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-bold font-mono text-slate-100 mb-2">404</h1>
      <h2 className="text-lg font-semibold text-slate-200 mb-2">Page Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        The requested route does not exist within the ContainerShield application.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" size="md" icon={Home}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
