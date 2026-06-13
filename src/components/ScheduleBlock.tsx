"use client";

import { useState, useRef, useEffect } from "react";
import type { ScheduleBlock as BlockType, Category } from "@/lib/schedule-data";
import { getShiftedTimeLabel, shiftTime } from "@/lib/time";

const BORDER_COLORS: Record<Category, string> = {
  jobs: "border-l-[#c084fc]",
  lc: "border-l-[#fb923c]",
  learn: "border-l-[#34d399]",
  health: "border-l-[#f472b6]",
  flex: "border-l-[#60a5fa]",
  buffer: "border-l-[#a78bfa]",
  rest: "border-l-[#3d3a4a]",
};

const TAG_STYLES: Record<Category, string> = {
  jobs: "bg-[#2d1a45] text-[#c084fc]",
  lc: "bg-[#3d1f0a] text-[#fb923c]",
  learn: "bg-[#0d2d20] text-[#34d399]",
  health: "bg-[#3d0f25] text-[#f472b6]",
  flex: "bg-[#0d1f3d] text-[#60a5fa]",
  buffer: "bg-[#1e1535] text-[#a78bfa]",
  rest: "bg-[#1a1a22] text-[#6b6880]",
};

interface Props {
  block: BlockType;
  shiftMinutes: number;
  isNow: boolean;
  isAdjusted: boolean;
  onEdit?: (block: BlockType) => void;
  onAdjustTime?: (blockId: string, h: number, m: number) => void;
}

export default function ScheduleBlockComponent({ block, shiftMinutes, isNow, isAdjusted, onEdit, onAdjustTime }: Props) {
  const [editingTime, setEditingTime] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const timeLabel = block.time
    ? getShiftedTimeLabel(block.time, shiftMinutes)
    : block.timeLabel || "";

  const isRest = block.category === "rest";
  const borderClass = BORDER_COLORS[block.category];
  const tagClass = TAG_STYLES[block.category];

  useEffect(() => {
    if (editingTime && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingTime]);

  function handleTimeClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (block.time && onAdjustTime) {
      setEditingTime(true);
    }
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const [h, m] = e.target.value.split(":").map(Number);
    onAdjustTime?.(block.id, h, m);
    setEditingTime(false);
  }

  function handleTimeBlur() {
    setEditingTime(false);
  }

  const shifted = block.time ? shiftTime(block.time[0], block.time[1], shiftMinutes) : null;
  const timeInputValue = shifted
    ? `${String(shifted.h).padStart(2, "0")}:${String(shifted.m).padStart(2, "0")}`
    : "";

  return (
    <div
      className={`grid grid-cols-[62px_1fr] gap-x-2.5 sm:grid-cols-[76px_1fr] sm:gap-x-3.5 lg:grid-cols-[88px_1fr] lg:gap-x-[18px] mb-[3px] relative
        before:content-[''] before:absolute before:left-[62px] sm:before:left-[76px] lg:before:left-[88px] before:top-0 before:bottom-0 before:w-px before:bg-border`}
    >
      <div
        className={`py-3 pr-2.5 sm:pr-3.5 lg:pr-4 text-right font-mono text-[10px] sm:text-[11px] lg:text-xs tracking-[0.04em] whitespace-nowrap leading-[1.4]
          ${isNow ? "text-accent-buffer font-medium" : isAdjusted ? "text-accent-lc" : "text-muted"}
          ${block.time && onAdjustTime ? "cursor-pointer active:opacity-60" : ""}`}
        onClick={handleTimeClick}
      >
        {editingTime ? (
          <input
            ref={inputRef}
            type="time"
            value={timeInputValue}
            onChange={handleTimeChange}
            onBlur={handleTimeBlur}
            className="bg-bg border border-accent-lc rounded px-1 py-0.5 text-text font-mono text-[10px] sm:text-[11px] w-full text-right outline-none [color-scheme:dark]"
            autoFocus
          />
        ) : (
          <>
            {timeLabel}
            {isAdjusted && !isNow && <span className="text-[8px] ml-0.5">~</span>}
          </>
        )}
        {isNow && (
          <div className="w-1.5 h-1.5 rounded-full bg-accent-buffer ml-auto mt-0.5 shadow-[0_0_6px_var(--color-accent-buffer)]" />
        )}
      </div>

      <div
        className={`py-[11px] px-3 sm:py-[13px] sm:px-[14px_14px_13px_18px] lg:py-[15px] lg:px-[18px_18px_15px_22px]
          rounded-r-[10px] lg:rounded-r-xl my-[3px] border-l-[3px]
          ${borderClass}
          ${isRest ? "bg-transparent" : "bg-surface"}
          ${isNow ? "ring-1 ring-accent-buffer/25" : ""}
          ${onEdit ? "cursor-pointer hover:ring-1 hover:ring-border transition-shadow" : ""}`}
        onClick={() => onEdit?.(block)}
      >
        <span className={`inline-block font-mono text-[9px] sm:text-[10px] tracking-[0.06em] px-2 py-0.5 rounded-[10px] mb-1 ${tagClass}`}>
          {block.tag}
        </span>
        <div className="text-[13px] sm:text-sm lg:text-[15px] font-medium text-text mb-1">
          {block.title}
        </div>
        <div className="text-[11.5px] sm:text-[12.5px] lg:text-[13px] text-muted leading-[1.55] lg:leading-[1.6]">
          {block.description}
        </div>
      </div>
    </div>
  );
}
