import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, colorClass = "text-white" }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <p className={`text-2xl font-bold ${colorClass} font-mono`}>{value}</p>
      </div>
    </div>
  );
};