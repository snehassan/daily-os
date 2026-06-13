"use client";

import { useState, useEffect } from "react";

export interface UserPreferences {
  wakeWindowStart: number;
  wakeWindowEnd: number;
  defaultWakeHour: number;
  defaultWakeMinute: number;
}

const DEFAULT_PREFS: UserPreferences = {
  wakeWindowStart: 7,
  wakeWindowEnd: 12,
  defaultWakeHour: 7,
  defaultWakeMinute: 30,
};

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const saved = localStorage.getItem("daily_os_prefs");
    return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: UserPreferences) {
  localStorage.setItem("daily_os_prefs", JSON.stringify(prefs));
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (prefs: UserPreferences) => void;
}

export default function PreferencesModal({ open, onClose, onSave }: Props) {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    if (open) setPrefs(loadPreferences());
  }, [open]);

  if (!open) return null;

  function handleSave() {
    savePreferences(prefs);
    onSave(prefs);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-surface border border-border rounded-[14px] p-6 w-full max-w-[420px]" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-mono text-[11px] tracking-[0.1em] uppercase text-accent-buffer mb-5">
          schedule preferences
        </h3>

        <div className="mb-5">
          <label className="text-xs text-muted block mb-3">Typical wake window</label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-dot block mb-1">Earliest</label>
              <select
                value={prefs.wakeWindowStart}
                onChange={(e) => setPrefs({ ...prefs, wakeWindowStart: parseInt(e.target.value) })}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text font-mono text-xs outline-none focus:border-accent-buffer"
              >
                {Array.from({ length: 18 }, (_, i) => i + 4).map((h) => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
            <span className="text-muted mt-4">to</span>
            <div className="flex-1">
              <label className="text-[10px] text-dot block mb-1">Latest</label>
              <select
                value={prefs.wakeWindowEnd}
                onChange={(e) => setPrefs({ ...prefs, wakeWindowEnd: parseInt(e.target.value) })}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-text font-mono text-xs outline-none focus:border-accent-buffer"
              >
                {Array.from({ length: 18 }, (_, i) => i + 4).map((h) => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[10px] text-dot mt-2 leading-[1.4]">
            Used when Whoop data isn't available. Schedule times shift relative to this.
          </p>
        </div>

        <div className="mb-5">
          <label className="text-xs text-muted block mb-3">Default wake time (no Whoop)</label>
          <div className="flex items-center gap-2">
            <select
              value={prefs.defaultWakeHour}
              onChange={(e) => setPrefs({ ...prefs, defaultWakeHour: parseInt(e.target.value) })}
              className="flex-1 bg-bg border border-border rounded-lg px-3 py-2.5 text-text font-mono text-xs outline-none focus:border-accent-buffer"
            >
              {Array.from({ length: 18 }, (_, i) => i + 4).map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
            <span className="text-muted">:</span>
            <select
              value={prefs.defaultWakeMinute}
              onChange={(e) => setPrefs({ ...prefs, defaultWakeMinute: parseInt(e.target.value) })}
              className="w-20 bg-bg border border-border rounded-lg px-3 py-2.5 text-text font-mono text-xs outline-none focus:border-accent-buffer"
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-transparent border border-border text-muted text-[13px] cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg bg-accent-buffer text-bg font-semibold text-[13px] cursor-pointer">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}
