import React from 'react';

export const Logo = ({
  className = '',
  imgClassName = 'h-10 w-auto',
  iconClassName, // Backwards compatibility
  variant = 'dark'
}) => {
  // Use iconClassName if provided, otherwise default to imgClassName or default h-10
  const finalImgClass = iconClassName || imgClassName;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative">
        <img
          src="/logo.jpg"
          alt="PrepCast-AI"
          className={`${finalImgClass} object-contain rounded-xl shadow-aura-violet`}
        />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-violet-500/20 to-teal-400/20 pointer-events-none" />
      </div>
      <span className="text-xl font-black aura-text-gradient tracking-tighter uppercase">PrepCast-AI</span>
    </div>
  );
};