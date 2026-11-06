import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const History3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="histShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        <radialGradient id="clockDial" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFF7FA" />
          <stop offset="100%" stopColor="#FCE7F3" />
        </radialGradient>
        <linearGradient id="clockRim" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
        <linearGradient id="goldHands" x1="28" y1="20" x2="42" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>
      </defs>

      <g filter="url(#histShadow)">
        {/* 3D Base Thickness */}
        <circle cx="32" cy="35" r="23" fill="#500724" />

        {/* Outer Beveled Rim */}
        <circle cx="32" cy="32" r="23" fill="url(#clockRim)" stroke="#FBCFE8" strokeWidth="1" />

        {/* Inner Dial Face */}
        <circle cx="32" cy="32" r="18" fill="url(#clockDial)" stroke="#FCE7F3" strokeWidth="0.75" />

        {/* Hour Markers */}
        <circle cx="32" cy="18" r="1.5" fill="#BE185D" />
        <circle cx="46" cy="32" r="1.5" fill="#BE185D" />
        <circle cx="32" cy="46" r="1.5" fill="#BE185D" />
        <circle cx="18" cy="32" r="1.5" fill="#BE185D" />

        {/* Top Gloss Reflection */}
        <path
          d="M18 24 A 18 18 0 0 1 46 24 Q 32 30 18 24 Z"
          fill="#FFFFFF"
          opacity="0.5"
        />

        {/* 3D Golden Clock Hands (Showing 2:40) */}
        {/* Hour Hand */}
        <line x1="32" y1="32" x2="40" y2="28" stroke="url(#goldHands)" strokeWidth="3" strokeLinecap="round" />
        {/* Minute Hand */}
        <line x1="32" y1="32" x2="32" y2="20" stroke="url(#goldHands)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Center Cap Nut */}
        <circle cx="32" cy="32" r="3" fill="#A16207" />
        <circle cx="32" cy="32" r="2" fill="#FEF08A" />
      </g>
    </svg>
  );
};

