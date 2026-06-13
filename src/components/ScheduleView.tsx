"use client";

import { useMemo } from "react";
import type { DaySchedule } from "@/lib/schedule-data";
import { NOTES } from "@/lib/schedule-data";
import { getBlockMinutes, getDayCompression, getBlockEffectiveShift } from "@/lib/time";
import ScheduleBlockComponent from "./ScheduleBlock";
import type { ScheduleBlock } from "@/lib/schedule-data";

interface Props {
  schedule: DaySchedule;
  shiftMinutes: number;
  blockAdjustments: Record<string, number>;
  onEditBlock?: (block: ScheduleBlock) => void;
  onAdjustBlockTime?: (blockId: string, h: number, m: number) => void;
}

export default function ScheduleView({ schedule, shiftMinutes, blockAdjustments, onEditBlock, onAdjustBlockTime }: Props) {
  const nowMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const compression = useMemo(() => getDayCompression(shiftMinutes), [shiftMinutes]);

  function blockShift(block: ScheduleBlock): number {
    const base = block.time
      ? getBlockEffectiveShift(block.time, shiftMinutes, compression)
      : shiftMinutes;
    return base + (blockAdjustments[block.id] || 0);
  }

  return (
    <div>
      {schedule.blocks.map((block, i) => {
        const effectiveShift = blockShift(block);
        let isNow = false;
        if (block.time) {
          const blockMin = getBlockMinutes(block.time, effectiveShift);
          const nextBlock = schedule.blocks[i + 1];
          if (nextBlock?.time) {
            const nextMin = getBlockMinutes(nextBlock.time, blockShift(nextBlock));
            isNow = nowMinutes >= blockMin && nowMinutes < nextMin;
          } else if (i === schedule.blocks.length - 1) {
            isNow = nowMinutes >= blockMin;
          }
        }

        return (
          <ScheduleBlockComponent
            key={block.id}
            block={block}
            shiftMinutes={effectiveShift}
            isNow={isNow}
            isAdjusted={!!blockAdjustments[block.id]}
            onEdit={onEditBlock}
            onAdjustTime={onAdjustBlockTime}
          />
        );
      })}

      {schedule.showNotes && (
        <div className="mt-9 pt-6 border-t border-border">
          <h3 className="font-serif text-xl lg:text-[22px] font-normal mb-3.5 lg:mb-[18px]">
            Operating rules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3.5">
            {NOTES.map((note) => (
              <div key={note.title} className="bg-surface border border-border rounded-[10px] lg:rounded-xl p-3.5 lg:p-[18px]">
                <h4 className="text-[10px] font-mono tracking-[0.08em] text-muted uppercase mb-2.5">
                  {note.title}
                </h4>
                <ul className="list-none">
                  {note.items.map((item) => (
                    <li key={item} className="text-[12.5px] lg:text-[13px] text-[#b0adc0] py-[5px] border-b border-border last:border-b-0 leading-[1.5]">
                      <span className="text-dot">— </span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
