import React from 'react';
import type { Icon3DProps } from './Wallet3D';

/** Big red 3D disc with a padlock: "market closed". */
export const MarketClosed3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-xl ${className}`}
      role="img"
      aria-label="Market closed"
    >
      <defs>
        <filter id="mcShadow" x="-15%" y="-15%" width="135%" height="145%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#7F1D1D" floodOpacity="0.45" />
        </filter>
        <radialGradient id="mcDisc" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="30%" stopColor="#EF4444" />
          <stop offset="72%" stopColor="#B91C1C" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </radialGradient>
        <linearGradient id="mcRing" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEE2E2" />
          <stop offset="50%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id="mcLock" x1="22" y1="26" x2="42" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FECACA" />
        </linearGradient>
      </defs>

      <g filter="url(#mcShadow)">
        <circle cx="32" cy="32" r="27" fill="url(#mcRing)" />
        <circle cx="32" cy="32" r="23.5" fill="url(#mcDisc)" />
        {/* glossy highlight */}
        <ellipse cx="25" cy="18" rx="13" ry="6" fill="#FFFFFF" opacity="0.28" />
        {/* padlock */}
        <path d="M24.5 29v-4.5a7.5 7.5 0 0 1 15 0V29" stroke="url(#mcLock)" strokeWidth="3.6" strokeLinecap="round" fill="none" />
        <rect x="20.5" y="29" width="23" height="16.5" rx="3.5" fill="url(#mcLock)" />
        <circle cx="32" cy="36.2" r="2.4" fill="#B91C1C" />
        <rect x="31" y="37" width="2" height="4.6" rx="1" fill="#B91C1C" />
      </g>
    </svg>
  );
};
