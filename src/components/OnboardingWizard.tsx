"use client";

import { useState } from "react";
import type { Category, DaySchedule, ScheduleBlock } from "@/lib/schedule-data";

interface Activity {
  id: string;
  name: string;
  duration: number;
  category: Category;
  description: string;
  enabled: boolean;
  keepOnLowDay: boolean;
}

const SUGGESTED: Activity[] = [
  { id: "exercise", name: "Exercise / Movement", duration: 30, category: "health", description: "Walk, stretch, or workout. Non-negotiable for recovery.", enabled: true, keepOnLowDay: true },
  { id: "coding", name: "LeetCode / Coding practice", duration: 90, category: "lc", description: "Algorithm practice — do this when your brain is sharpest.", enabled: true, keepOnLowDay: true },
  { id: "jobs", name: "Job search / Applications", duration: 90, category: "jobs", description: "Targeted applications and recruiter outreach.", enabled: true, keepOnLowDay: false },
  { id: "learning", name: "Learning / Study", duration: 60, category: "learn", description: "New skills, system design, or technical reading.", enabled: true, keepOnLowDay: false },
  { id: "mock", name: "Interview prep", duration: 30, category: "jobs", description: "Out-loud behavioral and technical practice.", enabled: false, keepOnLowDay: false },
  { id: "content", name: "Content / Twitter", duration: 20, category: "learn", description: "Post what you learned. Compounds over time.", enabled: false, keepOnLowDay: false },
  { id: "project", name: "Project work", duration: 90, category: "flex", description: "Personal projects, portfolio, or contract work.", enabled: false, keepOnLowDay: false },
  { id: "admin", name: "Admin / Emails", duration: 30, category: "buffer", description: "Follow-ups, scheduling, miscellaneous tasks.", enabled: true, keepOnLowDay: false },
  { id: "personal", name: "Personal / Free time", duration: 120, category: "rest", description: "Protected non-productive time. Not optional.", enabled: true, keepOnLowDay: true },
];

const DURATIONS = [15, 20, 30, 45, 60, 90, 120, 150, 180];

const CATEGORY_LABELS: Record<Category, string> = {
  health: "Health", lc: "Coding", jobs: "Jobs", learn: "Learn", flex: "Flex", buffer: "Buffer", rest: "Personal",
};

const CATEGORIES: Category[] = ["health", "lc", "jobs", "learn", "flex", "buffer", "rest"];

interface Props {
  onComplete: (schedules: DaySchedule[]) => void;
}

export default function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [activities, setActivities] = useState<Activity[]>(SUGGESTED.map(a => ({ ...a })));
  const [customName, setCustomName] = useState("");
  const [customDuration, setCustomDuration] = useState(60);
  const [customCategory, setCustomCategory] = useState<Category>("flex");

  function toggleActivity(id: string) {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  }

  function setDuration(id: string, duration: number) {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, duration } : a));
  }

  function toggleLowDay(id: string) {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, keepOnLowDay: !a.keepOnLowDay } : a));
  }

  function addCustom() {
    if (!customName.trim()) return;
    const id = `custom-${Date.now()}`;
    setActivities(prev => [...prev, {
      id, name: customName.trim(), duration: customDuration, category: customCategory,
      description: "", enabled: true, keepOnLowDay: false,
    }]);
    setCustomName("");
  }

  function removeActivity(id: string) {
    setActivities(prev => prev.filter(a => a.id !== id));
  }

  function generateAndSave() {
    const enabled = activities.filter(a => a.enabled);
    const lowDayActivities = enabled.filter(a => a.keepOnLowDay);

    const standard = buildSchedule("standard", "Standard", enabled);
    const lowEnergy = buildLowEnergySchedule(lowDayActivities);

    const schedules: DaySchedule[] = [
      standard,
      {
        id: "interview", label: "Interview", icon: "🎯", showNotes: false,
        blocks: [
          block([7, 30], "health", "HEALTH", "Slow wake — water, movement, real breakfast", "Protein breakfast. No skipping."),
          block([8, 30], "flex", "PREP", "Focused prep — 60–90 min", "Company research, behavioral runs. Sharpen what you know."),
          block([10, 0], "buffer", "BUFFER", "Calm before interview", "No new information. Walk, stretch, music."),
          block(null, "flex", "INTERVIEW", "The interview", "Trust what you've built.", "varies"),
          block(null, "health", "RECOVERY", "Post-interview decompression", "Eat. Walk. Don't replay. Write one takeaway.", "after"),
        ],
      },
      lowEnergy,
    ];

    onComplete(schedules);
  }

  let blockCounter = 0;

  function block(time: [number, number] | null, category: Category, tag: string, title: string, desc: string, timeLabel?: string): ScheduleBlock {
    return { id: `onb-${blockCounter++}`, time, timeLabel, category, tag, title, description: desc };
  }

  function buildSchedule(id: string, label: string, acts: Activity[]): DaySchedule {
    const blocks: ScheduleBlock[] = [];
    let min = 7 * 60 + 30;

    blocks.push(block([7, 30], "health", "HEALTH", "Wake up — ease into the day", "Water first. No phone for 20 min."));
    min += 20;

    const sorted = [...acts].sort((a, b) => {
      const order: Record<Category, number> = { lc: 0, jobs: 1, learn: 2, flex: 3, buffer: 4, health: 5, rest: 6 };
      return (order[a.category] ?? 5) - (order[b.category] ?? 5);
    });

    const lunchTarget = min + 240;
    let lunchDone = false;

    for (const act of sorted) {
      if (act.category === "health" || act.category === "rest") continue;

      if (!lunchDone && min >= lunchTarget) {
        blocks.push(block([Math.floor(min / 60) % 24, min % 60], "health", "BREAK", "Lunch — real break", "Eat. Step outside. No screens."));
        min += 60;
        lunchDone = true;
      }

      const tag = act.category === "lc" ? "LEETCODE" : act.category === "jobs" ? "JOBS" : act.category.toUpperCase();
      blocks.push(block([Math.floor(min / 60) % 24, min % 60], act.category, tag, act.name, act.description));
      min += act.duration;
    }

    if (!lunchDone) {
      blocks.push(block([Math.floor(min / 60) % 24, min % 60], "health", "BREAK", "Lunch — real break", "Eat. Step outside. No screens."));
      min += 60;
    }

    const exercise = acts.find(a => a.category === "health" && a.enabled);
    if (exercise) {
      blocks.push(block([Math.floor(min / 60) % 24, min % 60], "health", "HEALTH", exercise.name, exercise.description));
      min += exercise.duration;
    }

    const personal = acts.find(a => a.category === "rest" && a.enabled);
    if (personal) {
      blocks.push(block([Math.floor(min / 60) % 24, min % 60], "rest", "PERSONAL", personal.name, personal.description));
      min += personal.duration;
    }

    blocks.push(block([Math.floor(min / 60) % 24, min % 60], "health", "HEALTH", "Dinner + wind-down", "Eat properly. No new tasks after this."));
    min += 180;

    blocks.push(block([Math.floor(min / 60) % 24, min % 60], "buffer", "WIND-DOWN", "Screen off, sleep prep", "Consistent sleep timing is the biggest lever for recovery."));

    return { id, label, icon: "☀️", showNotes: true, blocks };
  }

  function buildLowEnergySchedule(acts: Activity[]): DaySchedule {
    const blocks: ScheduleBlock[] = [];

    blocks.push(block(null, "health", "HEALTH", "Slow start — no guilt about the clock", "Some days your body needs a different pace. Start when you can.", "whenever"));

    for (const act of acts) {
      if (act.category === "health" || act.category === "rest") continue;
      const tag = act.category === "lc" ? "LEETCODE" : act.category === "jobs" ? "JOBS" : act.category.toUpperCase();
      const reducedDuration = Math.max(15, Math.round(act.duration * 0.6));
      blocks.push(block(null, act.category, tag, act.name, `Reduced to ~${reducedDuration} min. Minimum viable effort.`, "when ready"));
    }

    const personal = acts.find(a => a.category === "rest");
    blocks.push(block(null, "health", "REST", personal?.name || "Rest — actual rest", "Not productivity guilt. Your system needs non-productive time to repair.", "rest of day"));

    blocks.push(block(null, "buffer", "NOTE", "A low day is not a lost day", "Maintaining the system so it doesn't collapse is the work.", "reminder"));

    return { id: "low", label: "Low Energy", icon: "🌙", showNotes: false, blocks };
  }

  const enabledCount = activities.filter(a => a.enabled).length;

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:max-w-[680px] lg:mx-auto">
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.14em] text-muted uppercase mb-1.5">
          build your schedule
        </div>
        <h1 className="font-serif text-[26px] sm:text-[32px] font-normal leading-[1.15] mb-2">
          Daily <em className="italic text-accent-buffer">OS</em>
        </h1>
        <div className="flex gap-2 mt-4">
          {["Activities", "Low Days", "Done"].map((label, i) => (
            <div key={label} className={`flex-1 h-1 rounded-full ${i <= step ? "bg-accent-buffer" : "bg-border"}`} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div>
          <h2 className="font-serif text-lg mb-1">What fills your day?</h2>
          <p className="text-muted text-[13px] mb-5 leading-[1.5]">
            Toggle on the things you do daily and set how long each takes. We&apos;ll arrange them into a schedule.
          </p>

          <div className="flex flex-col gap-2">
            {activities.map(act => (
              <div key={act.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${act.enabled ? "bg-surface border-border" : "bg-transparent border-border/50 opacity-60"}`}>
                <button onClick={() => toggleActivity(act.id)} className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center text-[10px] cursor-pointer ${act.enabled ? "border-accent-buffer bg-accent-buffer text-bg" : "border-dot bg-transparent"}`}>
                  {act.enabled && "✓"}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{act.name}</div>
                  <div className="text-[11px] text-muted truncate">{act.description}</div>
                </div>
                <select
                  value={act.duration}
                  onChange={e => setDuration(act.id, Number(e.target.value))}
                  className="bg-bg border border-border rounded-lg px-2 py-1 text-text font-mono text-[11px] outline-none [color-scheme:dark] shrink-0"
                >
                  {DURATIONS.map(d => <option key={d} value={d}>{d >= 60 ? `${d / 60}h` : `${d}m`}</option>)}
                </select>
                {act.id.startsWith("custom-") && (
                  <button onClick={() => removeActivity(act.id)} className="text-dot text-xs cursor-pointer bg-transparent border-none">✕</button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Add custom activity..."
              className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-text text-[13px] outline-none focus:border-accent-buffer placeholder:text-dot"
              onKeyDown={e => e.key === "Enter" && addCustom()}
            />
            <select value={customCategory} onChange={e => setCustomCategory(e.target.value as Category)} className="bg-bg border border-border rounded-lg px-2 py-2 text-text font-mono text-[11px] [color-scheme:dark]">
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <select value={customDuration} onChange={e => setCustomDuration(Number(e.target.value))} className="bg-bg border border-border rounded-lg px-2 py-2 text-text font-mono text-[11px] [color-scheme:dark]">
              {DURATIONS.map(d => <option key={d} value={d}>{d >= 60 ? `${d / 60}h` : `${d}m`}</option>)}
            </select>
            <button onClick={addCustom} className="px-3 py-2 bg-accent-buffer text-bg text-xs font-semibold rounded-lg cursor-pointer shrink-0">+</button>
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={enabledCount === 0}
            className="w-full mt-6 py-3.5 bg-accent-buffer text-bg font-semibold text-sm rounded-xl cursor-pointer disabled:opacity-40 active:opacity-80"
          >
            Next — Low energy days
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="font-serif text-lg mb-1">What about low energy days?</h2>
          <p className="text-muted text-[13px] mb-5 leading-[1.5]">
            When your recovery is low, which activities do you still want to do? Everything else gets dropped for that day.
          </p>

          <div className="flex flex-col gap-2">
            {activities.filter(a => a.enabled).map(act => (
              <div key={act.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${act.keepOnLowDay ? "bg-surface border-border" : "bg-transparent border-border/50 opacity-60"}`}>
                <button onClick={() => toggleLowDay(act.id)} className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center text-[10px] cursor-pointer ${act.keepOnLowDay ? "border-accent-health bg-accent-health text-bg" : "border-dot bg-transparent"}`}>
                  {act.keepOnLowDay && "✓"}
                </button>
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{act.name}</div>
                  <div className="text-[11px] text-muted">{act.duration >= 60 ? `${act.duration / 60}h` : `${act.duration}m`} → reduced to ~{Math.max(15, Math.round(act.duration * 0.6))}m on low days</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(0)} className="flex-1 py-3 border border-border text-muted text-sm rounded-xl bg-transparent cursor-pointer">
              Back
            </button>
            <button onClick={() => { generateAndSave(); setStep(2); }} className="flex-1 py-3.5 bg-accent-buffer text-bg font-semibold text-sm rounded-xl cursor-pointer active:opacity-80">
              Generate schedule
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <div className="text-4xl">✓</div>
          <h2 className="font-serif text-xl">Your schedule is ready</h2>
          <p className="text-muted text-[13px] max-w-[360px] leading-[1.5]">
            We built a Standard and Low Energy schedule from your activities. You can tap any block&apos;s time to adjust it, or use edit mode to add and remove blocks.
          </p>
        </div>
      )}
    </div>
  );
}
