import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Input = ({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-slate-300"
      >
        {label}
      </label>
      <div className="relative group">
        <input
          id={inputId}
          className={`
            w-full px-4 py-3 rounded-lg border bg-black/20 text-white
            transition-colors duration-200
            placeholder:text-slate-600
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-white/10 focus:border-blue-500 focus:ring-blue-500/20 hover:border-white/20'
            }
            ${icon ? 'pl-11' : ''}
          `}
          {...props}
        />
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1 text-sm text-red-400 animate-fade-in">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};