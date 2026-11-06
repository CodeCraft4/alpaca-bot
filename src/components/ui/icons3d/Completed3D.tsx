import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Completed3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="compShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#065F46" floodOpacity="0.3" />
        </filter>
        {/* Sphere 3D Body Gradient */}
        <radialGradient id="compSphere" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="35%" stopColor="#10B981" />
          <stop offset="75%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </radialGradient>
        {/* Inner Ring Gradient */}
        <linearGradient id="compRing" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        {/* Checkmark 3D Gradient */}
        <linearGradient id="checkGrad" x1="20" y1="24" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D1FAE5" />
        </linearGradient>
      </defs>

      <g filter="url(#compShadow)">
        {/* 3D Base Outer Bevel */}
        <circle cx="32" cy="34" r="24" fill="#064E3B" />

        {/* Sphere Body */}
        <circle cx="32" cy="32" r="24" fill="url(#compSphere)" stroke="url(#compRing)" strokeWidth="1.5" />

        {/* Gloss Highlight Ellipse at Top */}
        <ellipse cx="28" cy="18" rx="14" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(-15 28 18)" />

        {/* Embossed Checkmark Shadow */}
        <path
          d="M20 33 L28 41 L44 24"
          stroke="#064E3B"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />

        {/* Embossed 3D Checkmark */}
        <path
          d="M20 31.5 L28 39.5 L44 22.5"
          stroke="url(#checkGrad)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Crisp Checkmark Specular Core */}
        <path
          d="M20 31.5 L28 39.5 L44 22.5"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Micro Light Glint */}
        <circle cx="21" cy="20" r="2" fill="#FFFFFF" opacity="0.9" />
      </g>
    </svg>
  );
};

