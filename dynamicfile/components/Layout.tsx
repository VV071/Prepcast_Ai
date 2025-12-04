import React, { ReactNode } from 'react';
import { ShieldCheck, Activity, Database, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  apiKeySelected: boolean;
  onSelectKey: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, apiKeySelected, onSelectKey }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-primary-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">DataSentinel</h1>
              <p className="text-xs text-slate-400 font-mono mt-1">AI-POWERED DYNAMIC CLEANER</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {!apiKeySelected && (
              <button 
                onClick={onSelectKey}
                className="px-4 py-2 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/50 rounded hover:bg-red-500/20 transition-colors animate-pulse"
              >
                ⚠ SELECT API KEY
              </button>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Operational
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;