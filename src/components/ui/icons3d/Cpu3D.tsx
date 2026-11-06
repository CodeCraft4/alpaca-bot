import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Cpu3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="cpuShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Chip Body Gradient */}
        <linearGradient id="chipBody" x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="50%" stopColor="#831843" />
          <stop offset="100%" stopColor="#4A0420" />
        </linearGradient>
        {/* Gold Connector Pins */}
        <linearGradient id="goldPin" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        {/* Center Silicon Die (Pink Neon Circuit) */}
        <linearGradient id="siliconDie" x1="22" y1="22" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
      </defs>

      <g filter="url(#cpuShadow)">
        {/* Gold Peripheral Pins */}
        {/* Top Pins */}
        <rect x="20" y="8" width="3" height="6" rx="1" fill="url(#goldPin)" />
        <rect x="26" y="8" width="3" height="6" rx="1" fill="url(#goldPin)" />
        <rect x="35" y="8" width="3" height="6" rx="1" fill="url(#goldPin)" />
        <rect x="41" y="8" width="3" height="6" rx="1" fill="url(#goldPin)" />

        {/* Bottom Pins */}
        <rect x="20" y="50" width="3" height="6" rx="1" fill="url(#goldPin)" />
        <rect x="26" y="50" width="3" height="6" rx="1" fill="url(#goldPin)" />
        <rect x="35" y="50" width="3" height="6" rx="1" fill="url(#goldPin)" />
        <rect x="41" y="50" width="3" height="6" rx="1" fill="url(#goldPin)" />

        {/* Left Pins */}
        <rect x="8" y="20" width="6" height="3" rx="1" fill="url(#goldPin)" />
        <rect x="8" y="26" width="6" height="3" rx="1" fill="url(#goldPin)" />
        <rect x="8" y="35" width="6" height="3" rx="1" fill="url(#goldPin)" />
        <rect x="8" y="41" width="6" height="3" rx="1" fill="url(#goldPin)" />

        {/* Right Pins */}
        <rect x="50" y="20" width="6" height="3" rx="1" fill="url(#goldPin)" />
        <rect x="50" y="26" width="6" height="3" rx="1" fill="url(#goldPin)" />
        <rect x="50" y="35" width="6" height="3" rx="1" fill="url(#goldPin)" />
        <rect x="50" y="41" width="6" height="3" rx="1" fill="url(#goldPin)" />

        {/* Main Ceramic Substrate Package */}
        <rect
          x="13"
          y="13"
          width="38"
          height="38"
          rx="7"
          fill="url(#chipBody)"
          stroke="#F472B6"
          strokeWidth="1.2"
        />

        {/* Center Silicon Die with Metallic Bevel */}
        <rect
          x="22"
          y="22"
          width="20"
          height="20"
          rx="4"
          fill="url(#siliconDie)"
          stroke="#FCE7F3"
          strokeWidth="0.8"
        />

        {/* AI Circuit Micro-Traces */}
        <path d="M25 25H31V28" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M39 39H33V36" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="32" cy="32" r="3" fill="#FDE047" />
        <circle cx="32" cy="32" r="1.5" fill="#BE185D" />

        {/* Specular Reflection Highlight */}
        <path
          d="M16 16L32 16C24 24 16 32 16 32V16Z"
          fill="#FFFFFF"
          fillOpacity="0.15"
        />
      </g>
    </svg>
  );
};

