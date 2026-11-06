import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Cancel3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="cancelShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#4B5563" floodOpacity="0.3" />
        </filter>
        <radialGradient id="cancelDisc" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="35%" stopColor="#6B7280" />
          <stop offset="75%" stopColor="#4B5563" />
          <stop offset="100%" stopColor="#1F2937" />
        </radialGradient>
        <linearGradient id="cancelRing" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <linearGradient id="slashGrad" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
      </defs>

      <g filter="url(#cancelShadow)">
        {/* 3D Base Thickness */}
        <circle cx="32" cy="34" r="24" fill="#111827" />

        {/* 3D Metallic Disc */}
        <circle cx="32" cy="32" r="24" fill="url(#cancelDisc)" stroke="url(#cancelRing)" strokeWidth="1.5" />

        {/* Inner Ring Recess */}
        <circle cx="32" cy="32" r="18" fill="#1F2937" opacity="0.6" stroke="#9CA3AF" strokeWidth="1" />

        {/* Top Gloss */}
        <ellipse cx="28" cy="18" rx="14" ry="7" fill="#FFFFFF" opacity="0.3" transform="rotate(-15 28 18)" />

        {/* Red Prohibited Circle Ring */}
        <circle cx="32" cy="32" r="14" fill="none" stroke="url(#slashGrad)" strokeWidth="4" />
        {/* Diagonal Slash */}
        <line x1="22" y1="22" x2="42" y2="42" stroke="url(#slashGrad)" strokeWidth="4" strokeLinecap="round" />

        {/* Specular highlights on the slash */}
        <line x1="22" y1="22" x2="42" y2="42" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
};

