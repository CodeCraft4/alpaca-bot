import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Layers3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="layerShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Layer 1 (Bottom) */}
        <linearGradient id="layerBottom" x1="12" y1="42" x2="52" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#831843" />
          <stop offset="100%" stopColor="#701339" />
        </linearGradient>
        {/* Layer 2 (Middle) */}
        <linearGradient id="layerMid" x1="12" y1="30" x2="52" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#9D174D" />
        </linearGradient>
        {/* Layer 3 (Top) */}
        <linearGradient id="layerTop" x1="12" y1="18" x2="52" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
      </defs>

      <g filter="url(#layerShadow)">
        {/* Layer 1 (Bottom Plate) */}
        <g transform="translate(0, 16)">
          <path d="M32 30 L52 20 L32 10 L12 20 Z" fill="#500724" transform="translate(0, 3)" />
          <path d="M32 30 L52 20 L32 10 L12 20 Z" fill="url(#layerBottom)" stroke="#9D174D" strokeWidth="0.75" />
        </g>

        {/* Layer 2 (Middle Plate) */}
        <g transform="translate(0, 8)">
          <path d="M32 30 L52 20 L32 10 L12 20 Z" fill="#701339" transform="translate(0, 3)" />
          <path d="M32 30 L52 20 L32 10 L12 20 Z" fill="url(#layerMid)" stroke="#F472B6" strokeWidth="0.75" />
        </g>

        {/* Layer 3 (Top Plate) */}
        <g>
          <path d="M32 30 L52 20 L32 10 L12 20 Z" fill="#9D174D" transform="translate(0, 3)" />
          <path d="M32 30 L52 20 L32 10 L12 20 Z" fill="url(#layerTop)" stroke="#FCE7F3" strokeWidth="1" />
          {/* Top Plate Gloss */}
          <polygon points="32,11 48,19 32,27 16,19" fill="#FFFFFF" opacity="0.3" />
          <line x1="16" y1="19" x2="32" y2="27" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
          <line x1="32" y1="27" x2="48" y2="19" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
};

