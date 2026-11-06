import React from 'react';
import type { UserProfileData } from '../../types/trading';

export interface UserProfileProps {
  user: UserProfileData;
  variant?: 'sidebar' | 'header';
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  variant = 'sidebar',
  className = '',
}) => {
  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-brand-subtle border border-brand-border text-brand-primary flex items-center justify-center text-xs font-semibold shadow-sm">
            {user.initials}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-brand-card rounded-full" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-semibold text-brand-text leading-tight">{user.name}</p>
          <p className="text-[10px] text-brand-muted leading-tight">{user.role}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black/15 hover:bg-black/25 transition-colors cursor-pointer border border-white/10 ${className}`}
      title={`${user.name} (${user.email})`}
    >
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center text-xs font-bold shadow-inner">
          {user.initials}
        </div>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-brand-sidebar rounded-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate leading-tight">{user.name}</p>
        <p className="text-[11px] text-pink-200/80 truncate leading-tight mt-0.5">{user.email}</p>
      </div>
    </div>
  );
};
