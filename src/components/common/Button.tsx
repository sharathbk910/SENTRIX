import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-xs',
    lg: 'px-5 py-2.5 text-sm'
  };

  const variantClasses = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent shadow-sm',
    secondary: 'bg-[#121317] hover:bg-[#17181F] text-[#C7C9D1] hover:text-white border-[#1C1D22] hover:border-[#2E3038]',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white border-transparent shadow-sm',
    ghost: 'bg-transparent hover:bg-[#121317] text-[#9194A1] hover:text-white border-transparent',
    outline: 'bg-transparent hover:bg-[#121317] text-[#C7C9D1] hover:text-white border-[#1C1D22] hover:border-[#2E3038]',
    gold: 'bg-[#CC9166] hover:bg-[#b88055] text-[#08080A] font-semibold border-transparent shadow-sm'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`rounded-[6px] border font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
