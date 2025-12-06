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
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src="/logo.jpg"
        alt="PrepCast AI"
        className={`${finalImgClass} object-contain rounded-lg`}
      />
    </div>
  );
};