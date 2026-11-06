import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Mail3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="mailShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Envelope Back Interior */}
        <linearGradient id="envelopeInterior" x1="12" y1="20" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
        {/* Paper Letter Gradient */}
        <linearGradient id="paperLetter" x1="18" y1="12" x2="46" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFF0F5" />
        </linearGradient>
        {/* Envelope Outer Flaps */}
        <linearGradient id="envelopeFlap" x1="10" y1="26" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#701339" />
        </linearGradient>
        {/* Wax Stamp */}
        <linearGradient id="waxStamp" x1="26" y1="36" x2="38" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>
      </defs>

      <g filter="url(#mailShadow)">
        {/* Envelope Back Panel */}
        <rect x="10" y="24" width="44" height="28" rx="5" fill="url(#envelopeInterior)" />

        {/* Emerging Paper Note / Email Content */}
        <rect
          x="16"
          y="12"
          width="32"
          height="24"
          rx="3"
          fill="url(#paperLetter)"
          stroke="#FCE7F3"
          strokeWidth="0.8"
        />
        {/* Simulated Text Lines on Paper */}
        <line x1="20" y1="17" x2="36" y2="17" stroke="#DB2777" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="22" x2="44" y2="22" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="20" y1="26" x2="38" y2="26" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />

        {/* Envelope Front Wings & Bottom Flap */}
        <path
          d="M10 28L32 42L54 28V47C54 49.7614 51.7614 52 49 52H15C12.2386 52 10 49.7614 10 47V28Z"
          fill="url(#envelopeFlap)"
          stroke="#F472B6"
          strokeWidth="0.8"
        />

        {/* 3D Wax Seal Clasp */}
        <circle cx="32" cy="42" r="5.5" fill="url(#waxStamp)" />
        <circle cx="32" cy="42" r="3.5" fill="#831843" fillOpacity="0.4" />
        <circle cx="32" cy="42" r="2" fill="#FEF08A" />
      </g>
    </svg>
  );
};

