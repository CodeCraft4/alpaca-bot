import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const TrendingUp3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="trendUpShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#065F46" floodOpacity="0.3" />
        </filter>
        <linearGradient id="upGreen" x1="12" y1="46" x2="52" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      <g filter="url(#trendUpShadow)">
        {/* Soft 3D Ground Circle */}
        <ellipse cx="32" cy="48" rx="20" ry="6" fill="#065F46" opacity="0.2" />

        {/* 3D Dynamic Ribbon / Arrow */}
        {/* Shadow Ribbon */}
        <path
          d="M14 44 L26 32 L36 40 L52 18"
          stroke="#064E3B"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0, 3)"
        />

        {/* Front Ribbon */}
        <path
          d="M14 44 L26 32 L36 40 L52 18"
          stroke="url(#upGreen)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Specular Core */}
        <path
          d="M14 44 L26 32 L36 40 L52 18"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />

        {/* 3D Arrowhead Head */}
        <polygon points="42,16 54,16 54,28" fill="#10B981" stroke="#ECFDF5" strokeWidth="1" />
        <circle cx="53" cy="17" r="1.5" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

