import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Settings3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="gearShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Main Cog Face */}
        <linearGradient id="mainCogFace" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="35%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#701339" />
        </linearGradient>
        {/* Secondary Cog Face (Metallic Platinum / Gold) */}
        <linearGradient id="secCogFace" x1="36" y1="36" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        {/* Bevel Rim */}
        <linearGradient id="cogBevel" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCE7F3" />
          <stop offset="100%" stopColor="#500724" />
        </linearGradient>
        {/* Inner Hole Gradient */}
        <linearGradient id="cogHole" x1="26" y1="26" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#500724" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
      </defs>

      <g filter="url(#gearShadow)">
        {/* Secondary Smaller Cog (Bottom-Right) */}
        <g transform="translate(42, 42)">
          <path
            d="M-4 -14H4L5 -11L8 -10L11 -12L14 -9L12 -6L13 -3L16 -2V2L13 3L12 6L14 9L11 12L8 10L5 11L4 14H-4L-5 11L-8 10L-11 12L-14 9L-12 6L-13 3L-16 2V-2L-13 -3L-12 -6L-14 -9L-11 -12L-8 -10L-5 -11Z"
            fill="url(#secCogFace)"
            stroke="#FEF08A"
            strokeWidth="0.8"
          />
          <circle cx="0" cy="0" r="4.5" fill="#78350F" />
          <circle cx="0" cy="0" r="3" fill="#D97706" fillOpacity="0.4" />
        </g>

        {/* Main Cog (Top-Left 3D Body) */}
        <g transform="translate(28, 28)">
          {/* Beveled 3D extrusion under-shadow */}
          <circle cx="0" cy="2" r="21" fill="#500724" />

          {/* 8-Tooth Industrial Gear Geometry */}
          <path
            d="M-5 -21H5L6.5 -17L10.5 -15.5L14.5 -18.5L18.5 -14.5L15.5 -10.5L17 -6.5L21 -5V5L17 6.5L15.5 10.5L18.5 14.5L14.5 18.5L10.5 15.5L6.5 17L5 21H-5L-6.5 17L-10.5 15.5L-14.5 18.5L-18.5 14.5L-15.5 10.5L-17 6.5L-21 5V-5L-17 -6.5L-15.5 -10.5L-18.5 -14.5L-14.5 -18.5L-10.5 -15.5L-6.5 -17Z"
            fill="url(#mainCogFace)"
            stroke="url(#cogBevel)"
            strokeWidth="1.2"
          />

          {/* Recessed Center Ring */}
          <circle cx="0" cy="0" r="11" fill="url(#cogHole)" stroke="#F472B6" strokeWidth="0.75" />

          {/* Center Axle / Nut */}
          <circle cx="0" cy="0" r="6" fill="#FCE7F3" />
          <circle cx="0" cy="0" r="4.5" fill="#BE185D" />

          {/* Specular Tooth Reflections */}
          <path
            d="M-4 -20H4L5 -17.5L8.5 -16L12 -18L14.5 -15L12 -12L13.5 -8.5L16 -7.5V-4"
            stroke="#FFFFFF"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeOpacity="0.6"
            fill="none"
          />
        </g>
      </g>
    </svg>
  );
};

