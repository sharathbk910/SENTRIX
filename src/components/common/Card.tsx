import React, { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'subtle' | 'danger' | 'warning' | 'success';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#121317] border-[#1C1D22]',
    subtle: 'bg-[#040406] border-[#1C1D22]',
    danger: 'bg-rose-500/[0.04] border-rose-500/25',
    warning: 'bg-amber-500/[0.04] border-amber-500/25',
    success: 'bg-emerald-500/[0.04] border-emerald-500/25'
  };

  return (
    <div
      className={`rounded-[10px] border p-5 shadow-sm transition-all ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
