import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Calendar3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="calShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Binder Header Gradient */}
        <linearGradient id="calHeader" x1="12" y1="12" x2="52" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DB2777" />
          <stop offset="50%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
        {/* Calendar Page Gradient */}
        <linearGradient id="calPage" x1="12" y1="24" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFF1F5" />
        </linearGradient>
        {/* Metal Binder Rings */}
        <linearGradient id="metalRing" x1="0" y1="6" x2="0" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>

      <g filter="url(#calShadow)">
        {/* Paper Base Page */}
        <rect
          x="12"
          y="18"
          width="40"
          height="36"
          rx="6"
          fill="url(#calPage)"
          stroke="#FCE7F3"
          strokeWidth="1"
        />

        {/* Top Header Plate */}
        <path
          d="M12 24C12 20.6863 14.6863 18 18 18H46C49.3137 18 52 20.6863 52 24V28H12V24Z"
          fill="url(#calHeader)"
        />

        {/* Metallic Spiral Binders */}
        <rect x="18" y="10" width="4" height="12" rx="2" fill="url(#metalRing)" stroke="#FFFFFF" strokeWidth="0.5" />
        <rect x="30" y="10" width="4" height="12" rx="2" fill="url(#metalRing)" stroke="#FFFFFF" strokeWidth="0.5" />
        <rect x="42" y="10" width="4" height="12" rx="2" fill="url(#metalRing)" stroke="#FFFFFF" strokeWidth="0.5" />

        {/* Calendar Grid Dots / Days */}
        <circle cx="21" cy="35" r="2" fill="#F472B6" />
        <circle cx="28" cy="35" r="2" fill="#F472B6" />
        <circle cx="35" cy="35" r="2" fill="#BE185D" />
        <circle cx="42" cy="35" r="2.5" fill="#16A34A" />

        <circle cx="21" cy="43" r="2" fill="#CBD5E1" />
        <circle cx="28" cy="43" r="2.5" fill="#DB2777" />
        <circle cx="35" cy="43" r="2" fill="#CBD5E1" />
        <circle cx="42" cy="43" r="2" fill="#CBD5E1" />

        {/* Big Highlighted Day 3 Pill (For 3-Day holding review) */}
        <rect x="29" y="32" width="12" height="6" rx="3" fill="#BE185D" fillOpacity="0.15" stroke="#BE185D" strokeWidth="0.75" />
      </g>
    </svg>
  );
};

