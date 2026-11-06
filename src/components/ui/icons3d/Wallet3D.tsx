import React from 'react';

export interface Icon3DProps {
  size?: number;
  className?: string;
}

export const Wallet3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        {/* Ambient Drop Shadow */}
        <filter id="walletShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#831843" floodOpacity="0.25" />
        </filter>
        {/* Wallet Body Gradient: Deep Pink / Maroon with rich leather specular */}
        <linearGradient id="walletBody" x1="8" y1="14" x2="56" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="45%" stopColor="#9D174D" />
          <stop offset="100%" stopColor="#701339" />
        </linearGradient>
        {/* Bevel Highlight */}
        <linearGradient id="walletBevel" x1="8" y1="14" x2="8" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
        {/* Gold Card 1 Gradient */}
        <linearGradient id="goldCard" x1="16" y1="8" x2="48" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        {/* Silver/Cyan Card 2 Gradient */}
        <linearGradient id="silverCard" x1="12" y1="12" x2="44" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDF2F8" />
          <stop offset="100%" stopColor="#FCE7F3" />
        </linearGradient>
        {/* Flap Gradient */}
        <linearGradient id="walletFlap" x1="32" y1="26" x2="58" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DB2777" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
        {/* Gold Clasp Gradient */}
        <linearGradient id="goldClasp" x1="48" y1="32" x2="56" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>
      </defs>

      <g filter="url(#walletShadow)">
        {/* Background Card 1 (Silver / White) */}
        <rect
          x="14"
          y="8"
          width="32"
          height="22"
          rx="4"
          transform="rotate(-5 14 8)"
          fill="url(#silverCard)"
          stroke="#FBCFE8"
          strokeWidth="0.75"
        />
        {/* Background Card 2 (Gold VIP Card) */}
        <rect
          x="20"
          y="10"
          width="32"
          height="22"
          rx="4"
          transform="rotate(6 20 10)"
          fill="url(#goldCard)"
          stroke="#FEF08A"
          strokeWidth="0.75"
        />

        {/* Back thickness / shadow */}
        <rect x="8" y="20" width="48" height="34" rx="9" fill="#500724" />

        {/* Wallet Main Body */}
        <rect x="8" y="18" width="48" height="34" rx="9" fill="url(#walletBody)" stroke="url(#walletBevel)" strokeWidth="1" />

        {/* Top Rim Specular Light */}
        <path
          d="M17 19.5 C 24 19, 40 19, 47 19.5"
          stroke="#F472B6"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Inner stitch line */}
        <rect
          x="11"
          y="21"
          width="42"
          height="28"
          rx="6"
          fill="none"
          stroke="#FBCFE8"
          strokeWidth="0.75"
          strokeDasharray="2 2"
          opacity="0.4"
        />

        {/* Wallet Flap / Strap */}
        <path
          d="M32 28 H52 C55.3 28 58 30.7 58 34 V38 C58 41.3 55.3 44 52 44 H32 V28 Z"
          fill="url(#walletFlap)"
          stroke="#F472B6"
          strokeWidth="0.75"
        />

        {/* Metallic Golden Clasp with Bevel & Jewel */}
        <circle cx="50" cy="36" r="4.5" fill="url(#goldClasp)" stroke="#FEF08A" strokeWidth="0.75" />
        <circle cx="50" cy="36" r="2" fill="#78350F" opacity="0.6" />
        <circle cx="49" cy="35" r="1" fill="#FFFFFF" opacity="0.9" />

        {/* Front Bottom Ambient Glow */}
        <path
          d="M14 47 C 24 50, 40 50, 50 47"
          stroke="#9D174D"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>
    </svg>
  );
};

