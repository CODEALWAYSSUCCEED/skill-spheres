import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass';
  padding?: 'normal' | 'large';
}

export default function Card({ children, className = '', variant = 'default', padding = 'normal' }: CardProps) {
  const baseClasses = 'rounded-2xl shadow-xl';

  const variantClasses = {
    default: 'bg-white/90 backdrop-blur-sm border-2 border-amber-200',
    glass: 'bg-blue-900/60 backdrop-blur-md border-3 border-amber-400/60',
  };

  const paddingClasses = {
    normal: 'padding-card',
    large: 'padding-section',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}
