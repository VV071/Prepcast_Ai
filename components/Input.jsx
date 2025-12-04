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
        className="text-sm font-semibold text-text-primary"
      >
        {label}
      </label>
      <div className="relative group">
        <input
          id={inputId}
          className={`
            w-full px-4 py-3 rounded-lg border bg-white
            transition-colors duration-200
            placeholder:text-text-placeholder
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${error
              ? 'border-status-error focus:border-status-error focus:ring-status-error/20'
              : 'border-neutral-border focus:border-primary focus:ring-primary/20 hover:border-gray-400'
            }
            ${icon ? 'pl-11' : ''}
          `}
          {...props}
        />
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1 text-sm text-status-error animate-fadeIn">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};