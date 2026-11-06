import React from 'react';
import { ArrowRight, Info } from 'lucide-react';
import {
  Calendar3D,
  Layers3D,
  Bell3D,
  Completed3D,
  History3D,
} from '../ui/icons3d';

export const PositionReviewRules: React.FC = () => {
  const steps = [
    {
      step: '1',
      title: 'Position Opens',
      desc: 'User manually executes an ABNB buy order in paper mode.',
      renderIcon: () => <Layers3D size={22} />,
    },
    {
      step: '2',
      title: '3-Day Interval Reached',
      desc: 'Holding duration timer clocks 72 hours of open market exposure.',
      renderIcon: () => <Calendar3D size={22} />,
    },
    {
      step: '3',
      title: 'Review Prompt Sent',
      desc: 'User receives notification asking for a holding decision.',
      renderIcon: () => <Bell3D size={22} />,
    },
    {
      step: '4',
      title: 'User Decision',
      desc: 'Choose between "Sell Now" or "Wait Another 3 Days".',
      renderIcon: () => <Completed3D size={22} />,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-card p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-brand-border">
          <Calendar3D size={32} />
          <div>
            <h2 className="text-base font-bold text-brand-text">Position Review Rules</h2>
            <p className="text-xs text-brand-muted">
              Visual workflow of the timed position review architecture.
            </p>
          </div>
        </div>

        {/* Visual Workflow Steps */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
          {steps.map((item, idx) => (
            <div
              key={item.step}
              className="p-3.5 rounded-xl bg-brand-bg/50 border border-brand-border flex flex-col justify-between relative group hover:border-pink-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-pink-100 text-brand-primary flex items-center justify-center font-bold text-xs">
                      {item.step}
                    </span>
                    <span className="shrink-0">{item.renderIcon()}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-brand-muted hidden lg:block -mr-1" />
                  )}
                </div>
                <h3 className="text-xs font-bold text-brand-text mb-1">
                  {item.title}
                </h3>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Cycle Repeat Rule Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-pink-50/50 border border-pink-200/60 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <History3D size={24} />
          </div>
          <div className="text-xs">
            <span className="font-bold text-brand-text block mb-0.5">
              Cycle Reset Behavior (Step 5)
            </span>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              If <strong className="text-brand-text">"Wait Another 3 Days"</strong> is selected, the holding timer resets and initiates a fresh 3-day review cycle.
            </p>
          </div>
        </div>
      </div>

      {/* Critical Information Note */}
      <div className="mt-5 pt-3 border-t border-brand-border/60 flex items-start gap-2 text-[11px] text-brand-muted leading-relaxed">
        <Info className="w-4 h-4 shrink-0 text-brand-primary mt-0.5" />
        <span>
          <strong>Important:</strong> Reaching the review date does not automatically close a position. The position remains open until the user makes a decision or an exit condition (Target or Stop Loss) is triggered.
        </span>
      </div>
    </div>
  );
};
