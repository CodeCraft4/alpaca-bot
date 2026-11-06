import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Bell3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="bellShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Shiny Gold/Rose Bell Body */}
        <linearGradient id="bellBody" x1="16" y1="12" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="25%" stopColor="#F59E0B" />
          <stop offset="60%" stopColor="#DB2777" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
        {/* Bell Lip Gradient */}
        <linearGradient id="bellLip" x1="12" y1="46" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#9D174D" />
        </linearGradient>
        {/* Top Loop Handle */}
        <linearGradient id="bellLoop" x1="28" y1="6" x2="36" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        {/* Clapper Gradient */}
        <linearGradient id="bellClapper" x1="28" y1="50" x2="36" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="50%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#500724" />
        </linearGradient>
        {/* Specular Highlight */}
        <linearGradient id="bellSpecular" x1="22" y1="16" x2="30" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g filter="url(#bellShadow)">
        {/* Clapper under bell */}
        <ellipse cx="32" cy="53" rx="6" ry="5" fill="url(#bellClapper)" />
        <ellipse cx="32" cy="54" rx="3.5" ry="2.5" fill="#500724" />

        {/* Top Loop Ring */}
        <circle cx="32" cy="11" r="5" stroke="url(#bellLoop)" strokeWidth="3" fill="none" />

        {/* Bell Main Body with 3D Flared Curve */}
        <path
          d="M32 14C23 14 18 20 18 32C18 38 15 44 14 46C13.5 47 14 48 15.5 48H48.5C50 48 50.5 47 50 46C49 44 46 38 46 32C46 20 41 14 32 14Z"
          fill="url(#bellBody)"
        />

        {/* Bell Flared Rim / Lip */}
        <ellipse cx="32" cy="47.5" rx="19" ry="4.5" fill="url(#bellLip)" />
        <ellipse cx="32" cy="48" rx="16" ry="2.5" fill="#831843" fillOpacity="0.3" />

        {/* Specular 3D Reflection Sweep */}
        <path
          d="M24 18C21 24 20 34 22 43C20 42 19 38 20 32C20 25 22 20 24 18Z"
          fill="url(#bellSpecular)"
        />
        <circle cx="28" cy="22" r="3" fill="#FFFFFF" fillOpacity="0.4" />

        {/* Notification Sound / Alert Wave Beads */}
        <circle cx="53" cy="19" r="2" fill="#EC4899" fillOpacity="0.9" />
        <circle cx="58" cy="25" r="1.5" fill="#F472B6" fillOpacity="0.8" />
      </g>
    </svg>
  );
};

