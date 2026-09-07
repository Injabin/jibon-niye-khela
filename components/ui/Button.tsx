import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  const styles =
    variant === 'primary'
      ? 'bg-primary text-white hover:opacity-90'
      : variant === 'secondary'
        ? 'border border-border bg-surface text-text hover:bg-surface-raised'
        : 'border border-danger/40 bg-transparent text-danger hover:bg-danger/10';

  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}