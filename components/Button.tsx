
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    outline: 'border border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700',
    ghost: 'hover:bg-slate-100 text-slate-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
};
