import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Warning3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="warnShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#78350F" floodOpacity="0.3" />
        </filter>
        {/* Triangle 3D Face */}
        <linearGradient id="warnFace" x1="32" y1="8" x2="32" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        {/* Triangle Bevel */}
        <linearGradient id="warnBevel" x1="10" y1="12" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        {/* Exclamation 3D */}
        <linearGradient id="exclGrad" x1="32" y1="22" x2="32" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
      </defs>

      <g filter="url(#warnShadow)">
        {/* 3D Extrusion Shadow (Lower Base) */}
        <path
          d="M32 9 L56 50 C57.5 52.8 55.5 56 52.3 56 H11.7 C8.5 56 6.5 52.8 8 50 L32 9 Z"
          fill="#78350F"
          transform="translate(0, 3)"
        />

        {/* Front 3D Triangle */}
        <path
          d="M32 9 L56 50 C57.5 52.8 55.5 56 52.3 56 H11.7 C8.5 56 6.5 52.8 8 50 L32 9 Z"
          fill="url(#warnFace)"
          stroke="url(#warnBevel)"
          strokeWidth="1.5"
        />

        {/* Gloss Diagonal Highlight */}
        <path
          d="M32 11 L12 49 C11.5 50 12 51 13 51 L28 20 Z"
          fill="#FFFFFF"
          opacity="0.35"
        />

        {/* Exclamation Mark Stem */}
        <path
          d="M32 23 V36"
          stroke="url(#exclGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M32 23 V36"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
          transform="translate(-0.8, -0.5)"
        />

        {/* Exclamation Dot */}
        <circle cx="32" cy="44" r="2.8" fill="url(#exclGrad)" />
        <circle cx="31.2" cy="43.2" r="1" fill="#FFFFFF" opacity="0.8" />
      </g>
    </svg>
  );
};

