import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Refined Enterprise Sentinel Shield Emblem */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Solid Shield Base */}
          <path
            d="M24 4L40 10V22C40 32.5 33.2 41.8 24 44C14.8 41.8 8 32.5 8 22V10L24 4Z"
            fill="#1e293b"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Inner Security Core */}
          <path
            d="M24 12L34 16.5V23C34 29.5 29.7 35.5 24 37C18.3 35.5 14 29.5 14 23V16.5L24 12Z"
            fill="#0f172a"
            stroke="#60a5fa"
            strokeWidth="1.5"
          />
          {/* Sentinel Center Focal Node */}
          <circle cx="24" cy="24" r="4" fill="#3b82f6" />
          <circle cx="24" cy="24" r="1.5" fill="#ffffff" />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1 leading-none">
            <span
              className={`font-sans tracking-wide text-white ${textSizes[size]}`}
            >
              SENTRIX
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase mt-0.5">
            Security Gateway
          </span>
        </div>
      )}
    </div>
  );
};
