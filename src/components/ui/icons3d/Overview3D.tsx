import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Overview3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="overviewShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Top Face Gradient */}
        <linearGradient id="cubeTop" x1="16" y1="12" x2="48" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCE7F3" />
          <stop offset="60%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        {/* Left Face Gradient */}
        <linearGradient id="cubeLeft" x1="12" y1="28" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#701339" />
        </linearGradient>
        {/* Right Face Gradient */}
        <linearGradient id="cubeRight" x1="32" y1="28" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9D174D" />
          <stop offset="100%" stopColor="#500724" />
        </linearGradient>
        {/* Screen Glow */}
        <linearGradient id="panelGlow" x1="20" y1="16" x2="44" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <g filter="url(#overviewShadow)">
        {/* Left Isometric Panel */}
        <path d="M12 26L32 38V54L12 42V26Z" fill="url(#cubeLeft)" stroke="#9D174D" strokeWidth="0.8" />
        
        {/* Left Panel Chart Bars */}
        <path d="M16 38L20 40.5V47L16 44.5V38Z" fill="#F472B6" />
        <path d="M22 35L26 37.5V49L22 46.5V35Z" fill="#FBCFE8" />

        {/* Right Isometric Panel */}
        <path d="M32 38L52 26V42L32 54V38Z" fill="url(#cubeRight)" stroke="#701339" strokeWidth="0.8" />

        {/* Right Panel Line Indicator */}
        <path d="M36 43L41 37L46 40L49 34" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Top Isometric Dashboard Surface */}
        <path d="M32 10L52 22L32 34L12 22L32 10Z" fill="url(#cubeTop)" stroke="#FBCFE8" strokeWidth="1" />

        {/* Top Screen Elements (Interactive 3D Grid & Widgets) */}
        <path d="M22 19L32 14L42 19L32 24L22 19Z" fill="url(#panelGlow)" />
        <circle cx="32" cy="19" r="2.5" fill="#BE185D" />

        {/* Glass Edge Highlights */}
        <path d="M32 10L52 22" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M12 22L32 34L52 22" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.6" />
      </g>
    </svg>
  );
};

