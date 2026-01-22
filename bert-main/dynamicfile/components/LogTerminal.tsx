import React, { useEffect, useRef } from 'react';
import { Terminal, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { LogEntry } from '../types';

interface LogTerminalProps {
  logs: LogEntry[];
}

const LogTerminal: React.FC<LogTerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'WARN': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getColor = (level: string) => {
     switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-amber-400';
      case 'SUCCESS': return 'text-emerald-400';
      default: return 'text-blue-300';
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-mono text-slate-300">System Logs</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 bg-slate-950/50">
        {logs.length === 0 && (
          <div className="text-slate-600 text-center mt-10 italic">Waiting for incoming data stream...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 hover:bg-slate-900/50 p-1 rounded transition-colors group">
            <span className="text-slate-600 shrink-0 min-w-[70px]">
              {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <div className={`shrink-0 flex items-center gap-1 w-24 ${getColor(log.level)}`}>
              {getIcon(log.level)}
              <span className="font-bold">{log.module}</span>
            </div>
            <span className="text-slate-300 group-hover:text-white transition-colors">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogTerminal;