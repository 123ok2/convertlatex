import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | string;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  let variantClasses = '';
  switch (variant) {
    case 'ghost':
      variantClasses = 'bg-transparent hover:bg-slate-100 text-slate-700 active:bg-slate-200 shadow-none border-transparent';
      break;
    case 'secondary':
      variantClasses = 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200';
      break;
    case 'outline':
      variantClasses = 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm';
      break;
    case 'destructive':
      variantClasses = 'bg-red-600 hover:bg-red-700 text-white active:bg-red-800';
      break;
    case 'primary':
    default:
      variantClasses = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm';
      break;
  }

  return (
    <button
      className={`px-4 py-2 font-medium rounded-xl transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 text-sm ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
