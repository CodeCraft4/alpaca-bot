import React from 'react';
import type { Icon3DProps } from './Wallet3D';

export const Cash3D: React.FC<Icon3DProps> = ({ size = 32, className = '' }) => {
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
        <filter id="cashShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#064E3B" floodOpacity="0.25" />
        </filter>
        {/* Bill 1 (Back) */}
        <linearGradient id="billBack" x1="10" y1="18" x2="52" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        {/* Bill 2 (Front) */}
        <linearGradient id="billFront" x1="12" y1="24" x2="54" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="40%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>
        {/* Gold Coin 3D Gradient */}
        <linearGradient id="coinGrad" x1="34" y1="32" x2="56" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        {/* Gold Coin Rim */}
        <linearGradient id="coinRim" x1="34" y1="32" x2="56" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>

      <g filter="url(#cashShadow)">
        {/* Back Stacked Bill (Tilted) */}
        <g transform="rotate(-7 28 26)">
          <rect x="8" y="14" width="44" height="24" rx="5" fill="#064E3B" />
          <rect x="8" y="13" width="44" height="24" rx="5" fill="url(#billBack)" stroke="#A7F3D0" strokeWidth="0.75" />
          <circle cx="30" cy="25" r="5" stroke="#A7F3D0" strokeWidth="1" opacity="0.6" fill="none" />
        </g>

        {/* Front Bill (Perspective) */}
        <g transform="rotate(3 30 32)">
          {/* Bill extrusion shadow */}
          <rect x="10" y="22" width="44" height="24" rx="5" fill="#064E3B" />
          {/* Bill front face */}
          <rect x="10" y="20" width="44" height="24" rx="5" fill="url(#billFront)" stroke="#D1FAE5" strokeWidth="1" />

          {/* Border Pattern */}
          <rect x="13" y="23" width="38" height="18" rx="3.5" fill="none" stroke="#D1FAE5" strokeWidth="0.75" strokeDasharray="1.5 1.5" opacity="0.7" />

          {/* Bill Center Seal */}
          <circle cx="32" cy="32" r="6" fill="#047857" opacity="0.8" />
          <circle cx="32" cy="32" r="4.5" fill="none" stroke="#A7F3D0" strokeWidth="0.75" />
          <text x="32" y="35" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="sans-serif">$</text>

          {/* Corner Digits */}
          <text x="14" y="28" fill="#ECFDF5" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif">$</text>
          <text x="50" y="39" fill="#ECFDF5" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif">$</text>

          {/* Gloss Line */}
          <path d="M15 21.5 Q 32 21 49 21.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* Overlapping 3D Gold Coin */}
        <g>
          {/* Coin 3D Side Depth */}
          <ellipse cx="46" cy="45" rx="10" ry="10" fill="#78350F" />
          {/* Coin Front Face */}
          <circle cx="45" cy="43" r="10" fill="url(#coinGrad)" stroke="url(#coinRim)" strokeWidth="1.2" />
          {/* Inner Coin Ring */}
          <circle cx="45" cy="43" r="7.5" fill="none" stroke="#FEF3C7" strokeWidth="0.75" strokeDasharray="1 1" opacity="0.8" />
          {/* Embossed Dollar Sign */}
          <text x="45" y="47.5" textAnchor="middle" fill="#78350F" fontSize="11" fontWeight="900" fontFamily="sans-serif" opacity="0.4">
            $
          </text>
          <text x="44.5" y="46.8" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900" fontFamily="sans-serif">
            $
          </text>
          {/* Coin Top Specular Glint */}
          <circle cx="41.5" cy="37.5" r="1.5" fill="#FFFFFF" opacity="0.9" />
        </g>
      </g>
    </svg>
  );
};

