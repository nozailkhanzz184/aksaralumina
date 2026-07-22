import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  isDark?: boolean;
}

export const AppLogo = ({ size = 28, className = "", isDark = false }: LogoProps) => {
  const color = isDark ? "white" : "currentColor";
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Document Base */}
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      
      {/* Text Lines */}
      <path d="M8 8h4" />
      <path d="M8 11h2" />
      
      {/* AI Star Sparkle */}
      <path 
        d="M 12 11 L 13.2 13.8 L 16 15 L 13.2 16.2 L 12 19 L 10.8 16.2 L 8 15 L 10.8 13.8 Z" 
        fill={isDark ? "white" : "currentColor"} 
      />
    </svg>
  );
};
