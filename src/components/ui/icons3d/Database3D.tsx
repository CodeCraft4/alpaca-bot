import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Database3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-md ${className}`}
    >
      <defs>
        <filter id="dbShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Top Disc Cap */}
        <linearGradient id="dbTopCap" x1="16" y1="12" x2="48" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCE7F3" />
          <stop offset="50%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
        {/* Disc Sides */}
        <linearGradient id="dbSide" x1="14" y1="18" x2="50" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="50%" stopColor="#831843" />
          <stop offset="100%" stopColor="#500724" />
        </linearGradient>
      </defs>

      <g filter="url(#dbShadow)">
        {/* Layer 3 (Bottom Disc) */}
        <path d="M14 38C14 43 22 47 32 47C42 47 50 43 50 38V46C50 51 42 55 32 55C22 55 14 51 14 46V38Z" fill="url(#dbSide)" stroke="#9D174D" strokeWidth="0.8" />
        <ellipse cx="32" cy="38" rx="18" ry="6" fill="#701339" stroke="#F472B6" strokeWidth="0.5" />

        {/* Layer 2 (Middle Disc) */}
        <path d="M14 26C14 31 22 35 32 35C42 35 50 31 50 26V34C50 39 42 43 32 43C22 43 14 39 14 34V26Z" fill="url(#dbSide)" stroke="#BE185D" strokeWidth="0.8" />
        <ellipse cx="32" cy="26" rx="18" ry="6" fill="#831843" stroke="#F472B6" strokeWidth="0.5" />

        {/* Layer 1 (Top Disc Body) */}
        <path d="M14 14C14 19 22 23 32 23C42 23 50 19 50 14V22C50 27 42 31 32 31C22 31 14 27 14 22V14Z" fill="url(#dbSide)" stroke="#DB2777" strokeWidth="0.8" />
        {/* Top Disc Cap */}
        <ellipse cx="32" cy="14" rx="18" ry="6.5" fill="url(#dbTopCap)" stroke="#FFFFFF" strokeWidth="0.8" />

        {/* Front Data Rings / LEDs */}
        <circle cx="20" cy="22" r="1.5" fill="#34D399" />
        <circle cx="20" cy="34" r="1.5" fill="#FDE047" />
        <circle cx="20" cy="46" r="1.5" fill="#60A5FA" />
      </g>
    </svg>
  );
};

