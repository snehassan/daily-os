"use client";

import { useState } from "react";
import type { ScheduleBlock, Category } from "@/lib/schedule-data";

interface Props {
  block: ScheduleBlock | null;
  onSave: (block: ScheduleBlock) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: "jobs", label: "Jobs", color: "#c084fc" },
  { value: "lc", label: "LeetCode", color: "#fb923c" },
  { value: "learn", label: "Learn", color: "#34d399" },
  { value: "health", label: "Health", color: "#f472b6" },
  { value: "flex", label: "Flex", color: "#60a5fa" },
  { value: "buffer", label: "Buffer", color: "#a78bfa" },
  { value: "rest", label: "Rest", color: "#6b6880" },
];

export default function BlockEditor({ block, onSave, onDelete, onClose }: Props) {
  const isNew = !block;
  const [category, setCategory] = useState<Category>(block?.category || "health");
  const [tag, setTag] = useState(block?.tag || "");
  const [title, setTitle] = useState(block?.title || "");
  const [description, setDescription] = useState(block?.description || "");
  const [hasTime, setHasTime] = useState(block ? !!block.time : true);
  const [hours, setHours] = useState(block?.time?.[0]?.toString() || "9");
  const [minutes, setMinutes] = useState(block?.time?.[1]?.toString().padStart(2, "0") || "00");
  const [timeLabel, setTimeLabel] = useState(block?.timeLabel || "");

  function handleSave() {
    if (!title.trim()) return;

    const saved: ScheduleBlock = {
      id: block?.id || `block-${Date.now()}`,
      time: hasTime ? [parseInt(hours), parseInt(minutes)] : null,
      timeLabel: hasTime ? undefined : timeLabel || undefined,
      category,
      tag: tag.toUpperCase() || category.toUpperCase(),
      title: title.trim(),
      description: description.trim(),
    };

    onSave(saved);
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-5" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-[14px] p-6 w-full max-w-[440px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-mono text-[11px] tracking-[0.1em] uppercase text-accent-buffer mb-5">
          {isNew ? "add block" : "edit block"}
        </h3>

        <label className="block text-xs text-muted mb-1.5">Category</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                category === cat.value
                  ? "border-accent-buffer bg-accent-buffer/10 text-text"
                  : "border-border text-muted hover:border-muted"
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: cat.color }} />
              {cat.label}
            </button>
          ))}
        </div>

        <label className="block text-xs text-muted mb-1.5">Tag label</label>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder={category.toUpperCase()}
          className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text font-mono text-xs mb-4 outline-none focus:border-accent-buffer placeholder:text-dot"
        />

        <div className="flex items-center gap-3 mb-3">
          <label className="text-xs text-muted">Fixed time?</label>
          <button
            onClick={() => setHasTime(!hasTime)}
            className={`w-10 h-5 rounded-full transition-colors ${hasTime ? "bg-accent-buffer" : "bg-border"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${hasTime ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {hasTime ? (
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-muted mb-1">Hour (0-23)</label>
              <input
                type="number" min="0" max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text font-mono text-xs outline-none focus:border-accent-buffer"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted mb-1">Minutes</label>
              <input
                type="number" min="0" max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value.padStart(2, "0"))}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text font-mono text-xs outline-none focus:border-accent-buffer"
              />
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-xs text-muted mb-1">Time label</label>
            <input
              value={timeLabel}
              onChange={(e) => setTimeLabel(e.target.value)}
              placeholder='e.g. "morning", "whenever"'
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text font-mono text-xs outline-none focus:border-accent-buffer placeholder:text-dot"
            />
          </div>
        )}

        <label className="block text-xs text-muted mb-1.5">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Block title"
          className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text text-sm mb-4 outline-none focus:border-accent-buffer placeholder:text-dot"
        />

        <label className="block text-xs text-muted mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What to do and why"
          rows={3}
          className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text text-xs mb-5 outline-none focus:border-accent-buffer placeholder:text-dot resize-none leading-[1.6]"
        />

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-transparent border border-border text-muted text-[13px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg bg-accent-buffer text-bg font-semibold text-[13px] cursor-pointer"
          >
            {isNew ? "Add" : "Save"}
          </button>
        </div>

        {!isNew && onDelete && (
          <button
            onClick={() => onDelete(block.id)}
            className="mt-3 w-full py-2 rounded-lg bg-transparent border border-red/30 text-red text-xs cursor-pointer"
          >
            Delete block
          </button>
        )}
      </div>
    </div>
  );
}
