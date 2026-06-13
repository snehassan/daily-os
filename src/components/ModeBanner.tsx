"use client";

interface Props {
  score: number;
  zone: "green" | "yellow" | "red";
}

const ZONE_CONFIG = {
  green: {
    bg: "bg-[#0d2d20]",
    border: "border-[#1a5c3a]",
    text: "text-green",
    icon: "🟢",
    title: "green recovery — standard day",
    message: (score: number) => `Recovery at ${score}%. Full schedule active. You have the capacity — use it well.`,
  },
  yellow: {
    bg: "bg-[#2d2a0d]",
    border: "border-[#5c4e1a]",
    text: "text-yellow",
    icon: "🟡",
    title: "yellow recovery — standard day (flagged)",
    message: (score: number) =>
      `Recovery at ${score}%. Running standard schedule, but your body is working harder than usual. Watch for fatigue — drop to low energy if you hit a wall.`,
  },
  red: {
    bg: "bg-[#2d0d0d]",
    border: "border-[#5c1a1a]",
    text: "text-red",
    icon: "🔴",
    title: "red recovery — low energy day",
    message: (score: number) =>
      `Recovery at ${score}%. Auto-switched to low energy schedule. This is your body protecting itself. Minimum viable day — it still counts.`,
  },
};

export default function ModeBanner({ score, zone }: Props) {
  const config = ZONE_CONFIG[zone];

  return (
    <div className={`rounded-[10px] lg:rounded-xl p-[14px_16px] lg:p-[16px_20px] text-[13px] leading-[1.6] mb-4 flex items-start gap-2.5 border ${config.bg} ${config.border} ${config.text}`}>
      <span className="text-lg shrink-0 mt-px">{config.icon}</span>
      <div>
        <strong className="block font-mono text-[10px] tracking-[0.1em] uppercase mb-1">
          {config.title}
        </strong>
        <span>{config.message(score)}</span>
      </div>
    </div>
  );
}
