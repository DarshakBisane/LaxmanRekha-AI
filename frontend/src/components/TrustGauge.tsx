import React from 'react';
import { RiskLevel } from '../types/api';

interface TrustGaugeProps {
  score: number;
  riskLevel?: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
}

export const TrustGauge: React.FC<TrustGaugeProps> = ({ score, riskLevel, size = 'md' }) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  let color = '#047857'; // Emerald
  let bgFill = '#d1fae5';
  let badgeText = 'LOW RISK';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (normalizedScore < 60 || riskLevel === 'HIGH_RISK') {
    color = '#be123c'; // Rose / Coral
    bgFill = '#ffe4e6';
    badgeText = 'HIGH RISK';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
  } else if (normalizedScore < 80 || riskLevel === 'MEDIUM_RISK') {
    color = '#b45309'; // Amber
    bgFill = '#fef3c7';
    badgeText = 'MEDIUM RISK';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  const radius = size === 'lg' ? 58 : size === 'md' ? 44 : 30;
  const strokeWidth = size === 'lg' ? 10 : size === 'md' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const svgSize = (radius + strokeWidth) * 2;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="#cbd5e1"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-extrabold text-[#0f172a] ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-sm'}`}>
            {normalizedScore}
          </span>
          <span className={`text-[#64748b] uppercase tracking-wider font-semibold ${size === 'lg' ? 'text-[10px]' : 'text-[8px]'}`}>
            / 100
          </span>
        </div>
      </div>

      {/* Risk Badge */}
      <div className={`mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wider uppercase ${badgeColor}`}>
        {badgeText}
      </div>
    </div>
  );
};
