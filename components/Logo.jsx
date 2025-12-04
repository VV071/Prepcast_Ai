import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Logo = ({
  className = '',
  iconClassName = 'w-8 h-8',
  textClassName = 'text-2xl',
  variant = 'dark'
}) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-primary';
  const iconColor = variant === 'light' ? 'text-secondary' : 'text-primary';

  return (
    <div className={`flex items-center gap-2 font-bold ${className}`}>
      <div className={`flex items-center justify-center p-1.5 rounded-lg ${variant === 'light' ? 'bg-white/10' : 'bg-primary/10'}`}>
        <ShieldCheck className={`${iconClassName} ${iconColor}`} />
      </div>
      <span className={`${textClassName} ${textColor} tracking-tight`}>
        PrepCast<span className={variant === 'light' ? 'text-blue-200' : 'text-secondary'}>AI</span>
      </span>
    </div>
  );
};