import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Radio3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="radioShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Antenna Pole & Base */}
        <linearGradient id="radioBase" x1="24" y1="36" x2="40" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#701339" />
        </linearGradient>
        {/* Glowing Emitter Beacon */}
        <radialGradient id="radioBeacon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#DB2777" />
        </radialGradient>
      </defs>

      <g filter="url(#radioShadow)">
        {/* Tripod Base */}
        <path d="M22 52L30 38H34L42 52" stroke="url(#radioBase)" strokeWidth="3" strokeLinecap="round" />
        <line x1="26" y1="46" x2="38" y2="46" stroke="#BE185D" strokeWidth="2" />

        {/* Central Mast */}
        <line x1="32" y1="20" x2="32" y2="40" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" />

        {/* Satellite Dish Bowl */}
        <ellipse cx="32" cy="24" rx="14" ry="7" fill="url(#radioBase)" stroke="#FCE7F3" strokeWidth="1" />

        {/* Glowing Top Sphere */}
        <circle cx="32" cy="15" r="4.5" fill="url(#radioBeacon)" />
        <circle cx="32" cy="15" r="2" fill="#FFFFFF" />

        {/* Broadcasting Radial Signal Waves */}
        <path
          d="M20 9C23.5 5.5 40.5 5.5 44 9"
          stroke="#F472B6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1 1"
        />
        <path
          d="M14 4C21 -1.5 43 -1.5 50 4"
          stroke="#EC4899"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

