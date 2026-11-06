import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Chart3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="chartShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.22" />
        </filter>
        {/* Pedestal Gradient */}
        <linearGradient id="pedestalGrad" x1="8" y1="48" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCE7F3" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
        {/* Bar 1 (Short - Pink Subtle) */}
        <linearGradient id="bar1Grad" x1="12" y1="34" x2="22" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        {/* Bar 2 (Medium - Brand Primary) */}
        <linearGradient id="bar2Grad" x1="26" y1="24" x2="36" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
        {/* Bar 3 (Tall - Emerald / Success Peak) */}
        <linearGradient id="bar3Grad" x1="40" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        {/* Arrow Gradient */}
        <linearGradient id="arrowGrad" x1="14" y1="36" x2="52" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      <g filter="url(#chartShadow)">
        {/* 3D Platform Base */}
        <ellipse cx="32" cy="52" rx="24" ry="7" fill="#831843" opacity="0.3" />
        <ellipse cx="32" cy="50" rx="24" ry="7" fill="url(#pedestalGrad)" stroke="#FFFFFF" strokeWidth="1" />
        <ellipse cx="32" cy="49" rx="21" ry="5.5" fill="#FFF7FA" opacity="0.9" />

        {/* Bar 1 (Left) */}
        <g>
          {/* Side shadow */}
          <rect x="13" y="36" width="9" height="14" rx="2.5" fill="#9D174D" />
          {/* Front */}
          <rect x="12" y="34" width="9" height="15" rx="2.5" fill="url(#bar1Grad)" stroke="#FDF2F8" strokeWidth="0.5" />
          {/* Top 3D Cap */}
          <ellipse cx="16.5" cy="34" rx="4.5" ry="2" fill="#FBCFE8" />
        </g>

        {/* Bar 2 (Middle) */}
        <g>
          {/* Side shadow */}
          <rect x="27" y="26" width="9" height="24" rx="2.5" fill="#701339" />
          {/* Front */}
          <rect x="26" y="24" width="9" height="25" rx="2.5" fill="url(#bar2Grad)" stroke="#FCE7F3" strokeWidth="0.5" />
          {/* Top 3D Cap */}
          <ellipse cx="30.5" cy="24" rx="4.5" ry="2" fill="#F472B6" />
        </g>

        {/* Bar 3 (Right - Highest) */}
        <g>
          {/* Side shadow */}
          <rect x="41" y="16" width="9" height="34" rx="2.5" fill="#064E3B" />
          {/* Front */}
          <rect x="40" y="14" width="9" height="35" rx="2.5" fill="url(#bar3Grad)" stroke="#A7F3D0" strokeWidth="0.5" />
          {/* Top 3D Cap */}
          <ellipse cx="44.5" cy="14" rx="4.5" ry="2" fill="#6EE7B7" />
        </g>

        {/* 3D Dynamic Trend Line with Glowing Arrowhead */}
        <path
          d="M14 36 C 22 30, 30 24, 46 12"
          stroke="url(#arrowGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glow Line */}
        <path
          d="M14 36 C 22 30, 30 24, 46 12"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* 3D Arrowhead */}
        <polygon points="44,8 54,12 48,20" fill="#10B981" stroke="#ECFDF5" strokeWidth="0.75" />
        <circle cx="53" cy="12" r="1.5" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

