"use client";

import type { DaySchedule } from "@/lib/schedule-data";

interface Props {
  schedules: DaySchedule[];
  activeId: string;
  autoModeId?: string;
  onSelect: (id: string) => void;
}

export default function TabBar({ schedules, activeId, autoModeId, onSelect }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[calc(72px+env(safe-area-inset-bottom,0px))] bg-bg/92 backdrop-blur-[20px] border-t border-border flex items-start pt-2 pb-[env(safe-area-inset-bottom,0px)] z-50 lg:justify-center lg:gap-0">
      {schedules.map((s) => {
        const isActive = s.id === activeId;
        const isAuto = s.id === autoModeId;

        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`relative flex-1 lg:flex-none lg:w-40 flex flex-col items-center gap-1 py-1.5 px-1 min-h-[52px] border-none bg-transparent transition-colors
              ${isActive ? "text-accent-buffer" : "text-muted"}
              active:opacity-70`}
          >
            {isAuto && (
              <div className="absolute top-1 right-[calc(50%-14px)] w-[5px] h-[5px] rounded-full bg-accent-buffer" />
            )}
            <span className={`text-xl lg:text-[22px] leading-none ${isActive ? "drop-shadow-[0_0_6px_var(--color-accent-buffer)]" : ""}`}>
              {s.icon}
            </span>
            <span className="font-mono text-[8px] sm:text-[9px] lg:text-[10px] tracking-[0.06em] lg:tracking-[0.08em] uppercase text-center leading-[1.2]">
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
