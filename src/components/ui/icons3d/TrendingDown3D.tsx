import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const TrendingDown3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="trendDownShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#7F1D1D" floodOpacity="0.3" />
        </filter>
        <linearGradient id="downRed" x1="12" y1="16" x2="52" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="50%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
      </defs>

      <g filter="url(#trendDownShadow)">
        {/* Soft 3D Ground Circle */}
        <ellipse cx="32" cy="52" rx="20" ry="6" fill="#7F1D1D" opacity="0.2" />

        {/* 3D Dynamic Ribbon Shadow */}
        <path
          d="M14 18 L26 32 L36 24 L52 46"
          stroke="#450A0A"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0, 3)"
        />

        {/* Front Ribbon */}
        <path
          d="M14 18 L26 32 L36 24 L52 46"
          stroke="url(#downRed)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Specular Core */}
        <path
          d="M14 18 L26 32 L36 24 L52 46"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />

        {/* 3D Arrowhead Head */}
        <polygon points="42,46 54,46 54,34" fill="#DC2626" stroke="#FEE2E2" strokeWidth="1" />
        <circle cx="53" cy="45" r="1.5" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

