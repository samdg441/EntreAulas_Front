// components/Badge.tsx
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary';
}

export default function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors';
  
  const variantClasses = {
    default: 'border-transparent bg-red-600 text-white',
    outline: 'text-gray-700 border-gray-300',
    secondary: 'border-transparent bg-gray-200 text-gray-900'
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props} />
  );
}