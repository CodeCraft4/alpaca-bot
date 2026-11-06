import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Target3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="targetShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#831843" floodOpacity="0.3" />
        </filter>
        <linearGradient id="tOuter" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="50%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
        <linearGradient id="tMid" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF7FA" />
          <stop offset="100%" stopColor="#FCE7F3" />
        </linearGradient>
        <linearGradient id="tBull" x1="24" y1="24" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="50%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#9F1239" />
        </linearGradient>
        <linearGradient id="dartGrad" x1="38" y1="8" x2="56" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>
      </defs>

      <g filter="url(#targetShadow)">
        {/* 3D Base Thickness */}
        <circle cx="32" cy="35" r="23" fill="#500724" />

        {/* Outer Ring */}
        <circle cx="32" cy="32" r="23" fill="url(#tOuter)" stroke="#FCE7F3" strokeWidth="1" />

        {/* Middle Ring */}
        <circle cx="32" cy="32" r="16" fill="url(#tMid)" stroke="#FBCFE8" strokeWidth="1" />

        {/* Inner Bullseye */}
        <circle cx="32" cy="32" r="9" fill="url(#tBull)" stroke="#FDA4AF" strokeWidth="0.75" />

        {/* Center Point */}
        <circle cx="32" cy="32" r="3" fill="#FFFFFF" />

        {/* Top Specular Gloss */}
        <ellipse cx="28" cy="18" rx="14" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(-15 28 18)" />

        {/* 3D Arrow / Dart striking center */}
        <g transform="rotate(-35 32 32)">
          {/* Shaft */}
          <line x1="32" y1="12" x2="32" y2="32" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          {/* Flights */}
          <polygon points="32,10 27,16 32,14" fill="url(#dartGrad)" />
          <polygon points="32,10 37,16 32,14" fill="url(#dartGrad)" />
        </g>
      </g>
    </svg>
  );
};

