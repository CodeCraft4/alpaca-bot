import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Shield3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="shieldShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Shield Outer Rim */}
        <linearGradient id="shieldRim" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCE7F3" />
          <stop offset="40%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
        {/* Shield Body (Left Face) */}
        <linearGradient id="shieldLeft" x1="14" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DB2777" />
          <stop offset="60%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
        {/* Shield Body (Right Face - Darker for 3D bevel) */}
        <linearGradient id="shieldRight" x1="32" y1="12" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9D174D" />
          <stop offset="60%" stopColor="#701339" />
          <stop offset="100%" stopColor="#4A0420" />
        </linearGradient>
      </defs>

      <g filter="url(#shieldShadow)">
        {/* Outer Rim Plate */}
        <path
          d="M32 8L49 14V30C49 42 41 51 32 56C23 51 15 42 15 30V14L32 8Z"
          fill="url(#shieldRim)"
        />

        {/* Inner Left Facet */}
        <path
          d="M32 11L18 16V30C18 40.5 24.5 48.5 32 52.8V11Z"
          fill="url(#shieldLeft)"
        />

        {/* Inner Right Facet */}
        <path
          d="M32 11L46 16V30C46 40.5 39.5 48.5 32 52.8V11Z"
          fill="url(#shieldRight)"
        />

        {/* Center Emblem / Keyhole / Star */}
        <circle cx="32" cy="28" r="5" fill="#FDE047" />
        <path d="M32 30V37" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />

        {/* Specular Highlight Sweep */}
        <path
          d="M20 18L32 13V22L20 28V18Z"
          fill="#FFFFFF"
          fillOpacity="0.3"
        />
      </g>
    </svg>
  );
};

