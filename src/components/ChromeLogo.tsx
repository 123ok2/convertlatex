import React from 'react';

export const ChromeLogo: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="12" r="10" fill="#ffffff" />
    <path
      d="M12 2C6.48 2 2 6.48 2 12C2 13.06 2.16 14.08 2.47 15.04L7.86 5.71C8.94 3.47 11.23 2 13.82 2H12Z"
      fill="#EA4335"
    />
    <path
      d="M12 22C16.89 22 20.97 18.47 21.82 13.82H10.96L5.67 21.05C7.45 21.66 9.66 22 12 22Z"
      fill="#34A853"
    />
    <path
      d="M21.82 13.82C21.94 13.23 22 12.62 22 12C22 7.03 18.36 2.91 13.61 2.11L18.91 11.29C19.78 12.8 20.17 14.54 20.04 16.27L21.82 13.82Z"
      fill="#FBBC05"
    />
    <circle cx="12" cy="12" r="4.5" fill="#FFFFFF" />
    <circle cx="12" cy="12" r="3.5" fill="#1A73E8" />
  </svg>
);
