import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Error3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="errShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#7F1D1D" floodOpacity="0.35" />
        </filter>
        {/* Sphere 3D Body Gradient */}
        <radialGradient id="errSphere" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="35%" stopColor="#EF4444" />
          <stop offset="75%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </radialGradient>
        {/* Inner Ring Gradient */}
        <linearGradient id="errRing" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FECACA" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        {/* Cross 3D Gradient */}
        <linearGradient id="crossGrad" x1="22" y1="22" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FEE2E2" />
        </linearGradient>
      </defs>

      <g filter="url(#errShadow)">
        {/* 3D Base Outer Bevel */}
        <circle cx="32" cy="34" r="24" fill="#450A0A" />

        {/* Sphere Body */}
        <circle cx="32" cy="32" r="24" fill="url(#errSphere)" stroke="url(#errRing)" strokeWidth="1.5" />

        {/* Gloss Highlight Ellipse */}
        <ellipse cx="28" cy="18" rx="14" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(-15 28 18)" />

        {/* Embossed Cross Shadow */}
        <path
          d="M24 24 L40 40 M40 24 L24 40"
          stroke="#450A0A"
          strokeWidth="5.5"
          strokeLinecap="round"
          opacity="0.4"
          transform="translate(0, 1.5)"
        />

        {/* Embossed 3D Cross */}
        <path
          d="M24 24 L40 40 M40 24 L24 40"
          stroke="url(#crossGrad)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Crisp Specular Core */}
        <path
          d="M24 24 L40 40 M40 24 L24 40"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Micro Light Glint */}
        <circle cx="21" cy="20" r="2" fill="#FFFFFF" opacity="0.9" />
      </g>
    </svg>
  );
};

