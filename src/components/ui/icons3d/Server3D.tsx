import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Server3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="serverShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Upper Server Unit */}
        <linearGradient id="serverUnitTop" x1="10" y1="12" x2="54" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="40%" stopColor="#831843" />
          <stop offset="100%" stopColor="#500724" />
        </linearGradient>
        {/* Lower Server Unit */}
        <linearGradient id="serverUnitBottom" x1="10" y1="34" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9D174D" />
          <stop offset="40%" stopColor="#701339" />
          <stop offset="100%" stopColor="#3B0318" />
        </linearGradient>
        {/* Drive Bay Tray Gradient */}
        <linearGradient id="driveTray" x1="14" y1="16" x2="40" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      <g filter="url(#serverShadow)">
        {/* Top Server Unit (Blade 1) */}
        <rect
          x="10"
          y="13"
          width="44"
          height="17"
          rx="4"
          fill="url(#serverUnitTop)"
          stroke="#F472B6"
          strokeWidth="0.8"
        />
        {/* Drive Slots */}
        <rect x="14" y="18" width="22" height="7" rx="1.5" fill="url(#driveTray)" stroke="#475569" strokeWidth="0.5" />
        <line x1="18" y1="21.5" x2="32" y2="21.5" stroke="#64748B" strokeWidth="1" strokeLinecap="round" />
        {/* LEDs */}
        <circle cx="41" cy="21.5" r="2" fill="#10B981" />
        <circle cx="47" cy="21.5" r="1.5" fill="#34D399" />

        {/* Bottom Server Unit (Blade 2) */}
        <rect
          x="10"
          y="34"
          width="44"
          height="17"
          rx="4"
          fill="url(#serverUnitBottom)"
          stroke="#DB2777"
          strokeWidth="0.8"
        />
        {/* Drive Slots */}
        <rect x="14" y="39" width="22" height="7" rx="1.5" fill="url(#driveTray)" stroke="#475569" strokeWidth="0.5" />
        <line x1="18" y1="42.5" x2="32" y2="42.5" stroke="#64748B" strokeWidth="1" strokeLinecap="round" />
        {/* LEDs */}
        <circle cx="41" cy="42.5" r="2" fill="#3B82F6" />
        <circle cx="47" cy="42.5" r="1.5" fill="#60A5FA" />

        {/* Inter-rack Metal Connectors */}
        <rect x="16" y="30" width="3" height="4" fill="#64748B" />
        <rect x="45" y="30" width="3" height="4" fill="#64748B" />
      </g>
    </svg>
  );
};

