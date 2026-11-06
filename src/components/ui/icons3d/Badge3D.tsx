import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Badge3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="badgeShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#831843" floodOpacity="0.3" />
        </filter>
        {/* Shield Outer Gold Gradient */}
        <linearGradient id="shieldGold" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#854D0E" />
        </linearGradient>
        {/* Shield Inner Dark Pink Gradient */}
        <linearGradient id="shieldPink" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="50%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#701339" />
        </linearGradient>
        {/* Star Gold Gradient */}
        <linearGradient id="starGold" x1="24" y1="20" x2="40" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
      </defs>

      <g filter="url(#badgeShadow)">
        {/* 3D Extrusion Shadow */}
        <path
          d="M32 7 L52 14 V32 C52 44.5 43.5 53.5 32 57 C20.5 53.5 12 44.5 12 32 V14 L32 7 Z"
          fill="#500724"
          transform="translate(0, 3)"
        />

        {/* Outer Golden Shield Rim */}
        <path
          d="M32 7 L52 14 V32 C52 44.5 43.5 53.5 32 57 C20.5 53.5 12 44.5 12 32 V14 L32 7 Z"
          fill="url(#shieldGold)"
          stroke="#FEF9C3"
          strokeWidth="1"
        />

        {/* Inner Pink Enamel Shield */}
        <path
          d="M32 11 L48 16.5 V32 C48 42 41 49.5 32 52.5 C23 49.5 16 42 16 32 V16.5 L32 11 Z"
          fill="url(#shieldPink)"
          stroke="#FCE7F3"
          strokeWidth="0.75"
        />

        {/* Shield Specular Highlight */}
        <path
          d="M32 12 L46 17 V32 C46 36 44 40 40 43 L32 12 Z"
          fill="#FFFFFF"
          opacity="0.25"
        />

        {/* 3D Gold Star Emblem */}
        <polygon
          points="32,20 35.5,27.5 43.5,28.5 37.5,34 39,42 32,38 25,42 26.5,34 20.5,28.5 28.5,27.5"
          fill="url(#starGold)"
          stroke="#FEF9C3"
          strokeWidth="0.75"
        />

        {/* Star Specular Glint */}
        <circle cx="32" cy="27" r="1.5" fill="#FFFFFF" opacity="0.9" />
      </g>
    </svg>
  );
};

