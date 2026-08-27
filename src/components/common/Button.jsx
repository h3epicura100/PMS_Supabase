import React from 'react';

export function Button({
  children,
  variant = 'default', // 'default' | 'primary' | 'ghost' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  block = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pms-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer gap-2';

  const variants = {
    default: 'bg-white border border-pms-border text-pms-text hover:border-pms-text hover:bg-slate-50 shadow-sm',
    primary: 'bg-pms-primary text-white hover:bg-pms-primary-hover border border-transparent shadow-sm',
    ghost: 'bg-transparent text-pms-muted hover:bg-slate-100 hover:text-pms-text',
    danger: 'bg-white text-pms-danger border border-red-200 hover:bg-red-50 hover:border-red-300',
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  };

  const widthClass = block ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
