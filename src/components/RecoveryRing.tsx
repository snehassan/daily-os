"use client";

import { getRecoveryZone } from "@/lib/whoop";
import { formatTime } from "@/lib/time";

interface Props {
  score: number;
  hrv: number;
  rhr: number;
  wakeTime: { h: number; m: number } | null;
  shiftMinutes: number;
}

const ZONE_COLORS = {
  green: "#34d399",
  yellow: "#fbbf24",
  red: "#f87171",
};

export default function RecoveryRing({ score, hrv, rhr, wakeTime, shiftMinutes }: Props) {
  const zone = getRecoveryZone(score);
  const color = ZONE_COLORS[zone];
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;
  const shiftSign = shiftMinutes >= 0 ? "+" : "";

  return (
    <div className="flex items-center gap-5 bg-surface border border-border rounded-[14px] p-[18px_20px] mb-4 md:p-[22px_28px] md:gap-7 lg:p-[24px_32px] lg:gap-8 lg:rounded-2xl">
      <div className="relative w-[90px] h-[90px] shrink-0 md:w-[100px] md:h-[100px] lg:w-[110px] lg:h-[110px]">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#222228" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-[26px] lg:text-[30px] leading-none" style={{ color }}>
            {score}%
          </span>
          <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-muted mt-0.5">
            recovery
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1.5">
        <Stat label="HRV" value={hrv ? `${Math.round(hrv)} ms` : "--"} />
        <Stat label="Resting HR" value={rhr ? `${rhr} bpm` : "--"} />
        <Stat label="Wake time" value={wakeTime ? formatTime(wakeTime.h, wakeTime.m) : "--"} />
        <Stat label="Time shift" value={`${shiftSign}${shiftMinutes} min`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="font-mono text-[10px] tracking-[0.06em] uppercase text-muted">{label}</span>
      <span className="font-mono text-[13px] font-medium lg:text-sm">{value}</span>
    </div>
  );
}
