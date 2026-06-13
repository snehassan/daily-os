export type Category = "jobs" | "lc" | "learn" | "health" | "flex" | "buffer" | "rest";

export interface ScheduleBlock {
  id: string;
  time: [number, number] | null;
  timeLabel?: string;
  category: Category;
  tag: string;
  title: string;
  description: string;
}

export interface DaySchedule {
  id: string;
  label: string;
  icon: string;
  blocks: ScheduleBlock[];
  showNotes: boolean;
}

let blockId = 0;
function b(
  time: [number, number] | null,
  category: Category,
  tag: string,
  title: string,
  description: string,
  timeLabel?: string
): ScheduleBlock {
  return {
    id: `block-${++blockId}`,
    time,
    timeLabel,
    category,
    tag,
    title,
    description,
  };
}

export const DEFAULT_SCHEDULES: DaySchedule[] = [
  {
    id: "standard",
    label: "Standard",
    icon: "☀️",
    showNotes: true,
    blocks: [
      b([7, 30], "health", "HEALTH", "Wake up — no phone for 20 min", "Drink water first. Let your nervous system come online slowly. Stress spikes on standing — give your body a gentle transition."),
      b([7, 50], "health", "HEALTH", "Morning movement + get ready", "Walk, stretch, or a short run if energy allows. Breakfast. This is not optional — skipping this tanks your afternoon cognition."),
      b([9, 0], "lc", "LEETCODE", "2–3 LeetCode problems", "Do this first while your brain is sharpest. Hint-guided approach. One medium, one easy, one medium-hard. Track patterns not just solutions. Cap at 90 minutes."),
      b([10, 30], "jobs", "JOBS", "Applications + outreach", "5–8 targeted applications max. Run Job Scout if needed. Write 2–3 connection messages to hiring managers. Quality over spray."),
      b([12, 0], "health", "BREAK", "Lunch — real break, away from screen", "Eat. Step outside if possible. Cortisol peaks mid-morning — this break resets it. No emails, no LinkedIn during this window."),
      b([13, 0], "learn", "LEARN", "Learn something new — 60–75 min", "AI engineering, agentic tools, raw API projects, system design. No frameworks before fundamentals. This feeds your daily tweet."),
      b([14, 15], "learn", "TWEET", "Write and post on Twitter", "One thing you learned, a mini breakdown, a question you're sitting with. 15–20 min max. It compounds over time."),
      b([14, 30], "buffer", "BUFFER", "Afternoon buffer — admin, follow-ups, misc", "Recruiter emails, application status, small tasks. If nothing pending, use as second learning or rest window."),
      b([15, 30], "health", "HEALTH", "Movement break or walk", "Even 20 minutes. Physiological stress reset. Non-negotiable on standard days."),
      b([16, 0], "jobs", "MOCK PREP", "Out-loud interview practice — 30 min", 'Record yourself. One behavioral story, one system design concept, or one "tell me about yourself." Your gap is communication under pressure — this fixes it.'),
      b([16, 30], "rest", "PERSONAL", "Free time — painting, Minecraft, calls", "Protected time. Not optional recovery. Your nervous system needs actual non-productive time to repair."),
      b([18, 30], "health", "HEALTH", "Dinner + wind-down begins", "Eat properly. Start dimming screens. No new tasks or job applications after this — it spikes cortisol before bed."),
      b([21, 30], "buffer", "WIND-DOWN", "Screen off, sleep prep", "Read fiction, no work-adjacent content. Target sleep by 10:30–11pm. Consistent sleep timing is the single biggest lever for your HRV recovery."),
    ],
  },
  {
    id: "interview",
    label: "Interview",
    icon: "🎯",
    showNotes: false,
    blocks: [
      b([7, 30], "health", "HEALTH", "Slow wake — water, movement, real breakfast", "Protein breakfast. No skipping. Your focus in the interview depends on this."),
      b([8, 30], "flex", "PREP", "Focused prep — 60–90 min", 'Company research, 2–3 behavioral runs out loud, "tell me about yourself." Don\'t cram new concepts — sharpen what you already know.'),
      b([10, 0], "buffer", "BUFFER", "Calm before interview", "No new information. Walk, stretch, music. Let your nervous system settle. Check tech if remote."),
      b(null, "flex", "INTERVIEW", "The interview", 'You\'ve gotten to final rounds at Google and Avora. Trust what you\'ve built. Say out loud: "Let me think through this for a moment."', "varies"),
      b(null, "health", "RECOVERY", "Post-interview decompression", "Eat. Walk. Don't immediately replay. Write one thing that went well and one adjustment — then close the tab. Evening is yours.", "after"),
      b(null, "lc", "LEETCODE", "LeetCode moves to tomorrow", "Prep + interview is a full cognitive day. Skip LeetCode. It resumes tomorrow.", "note"),
    ],
  },
  {
    id: "heavy",
    label: "Heavy",
    icon: "🔬",
    showNotes: false,
    blocks: [
      b([7, 30], "health", "HEALTH", "Wake, movement, breakfast", 'Heavy days still need a solid start. Don\'t skip this to "get more done."'),
      b([9, 0], "lc", "LEETCODE", "2 problems only — 60 min cap", "Keep the habit alive but trim it. Two problems, time-boxed hard."),
      b([10, 0], "flex", "DEEP WORK", "Primary block — research / contract / EK-Mojave", "Deep focus, no notifications. BioSemantic Bridge benchmarking, contract deliverable, or EK-Mojave question batching goes here."),
      b([12, 30], "health", "BREAK", "Real lunch — 45 min away from screen", "Your afternoon focus depends entirely on this reset. Not optional."),
      b([13, 15], "jobs", "JOBS", "Applications — compressed to 60 min", "3–5 targeted only. Use the resume tailor skill and move fast."),
      b([14, 15], "flex", "DEEP WORK", "Second block if needed", "Continue research or contract. If complete, this becomes learn + tweet time instead."),
      b([16, 0], "learn", "LEARN", "Learn + tweet — 60 min", "Still happens on heavy days. Identity work compounds regardless of what else you're building."),
      b([17, 0], "health", "HEALTH", "Hard stop — evening protected", "Work ends here. Heavy days are the ones that most need a clean shutdown."),
    ],
  },
  {
    id: "low",
    label: "Low Energy",
    icon: "🌙",
    showNotes: false,
    blocks: [
      b(null, "health", "HEALTH", "Slow start — no guilt about the clock", "Some days your body is running a different program. You've had physiological stress at 593% above baseline. Start when you can.", "whenever"),
      b(null, "lc", "LEETCODE", "2 problems — easy/medium only", "Minimum viable habit. No hard problems on depleted days. Two easy-mediums still count.", "morning"),
      b(null, "jobs", "JOBS", "3 applications — that is enough", "Three real targeted applications. One connection message. Done. You don't need to apply to 20 things to have had a productive job search day.", "midday"),
      b(null, "learn", "LEARN", "One small thing — tweet it", "30 minutes. One article, one video, one thing revisited. Post it.", "afternoon"),
      b(null, "health", "REST", "Actual rest — not productivity guilt", "Paint. Minecraft. Call Gagan. Read fiction. Cook. Watch something. You are maintaining the system so it doesn't collapse.", "rest of day"),
      b(null, "buffer", "NOTE", "You applied to 19 jobs in one of the hardest weeks of your life", "Final rounds at Google and Avora while starting new meds, alone in a foreign country. A low day is not a lost day.", "reminder"),
    ],
  },
];

export const CATEGORY_COLORS: Record<Category, { border: string; tagBg: string; tagText: string }> = {
  jobs:   { border: "border-l-accent-jobs",   tagBg: "bg-[#2d1a45]", tagText: "text-accent-jobs" },
  lc:     { border: "border-l-accent-lc",     tagBg: "bg-[#3d1f0a]", tagText: "text-accent-lc" },
  learn:  { border: "border-l-accent-learn",  tagBg: "bg-[#0d2d20]", tagText: "text-accent-learn" },
  health: { border: "border-l-accent-health", tagBg: "bg-[#3d0f25]", tagText: "text-accent-health" },
  flex:   { border: "border-l-accent-flex",   tagBg: "bg-[#0d1f3d]", tagText: "text-accent-flex" },
  buffer: { border: "border-l-accent-buffer", tagBg: "bg-[#1e1535]", tagText: "text-accent-buffer" },
  rest:   { border: "border-l-dot",           tagBg: "bg-[#1a1a22]", tagText: "text-muted" },
};

export const NOTES = [
  {
    title: "non-negotiables",
    items: ["Sleep before 11pm", "Eat 3 real meals", "2 LeetCode minimum", "No job apps after 7pm", "One screen-free break"],
  },
  {
    title: "job search",
    items: ["Max 8 apps/day", "Job Scout weekly", "30 min mock daily", "Track everything", "Fix: structure under pressure"],
  },
  {
    title: "day type guide",
    items: ["Standard: default day", "Interview: any interview", "Heavy: research/contract", "Low energy: Whoop <34%"],
  },
  {
    title: "health signals",
    items: ["High stress on waking: low day", "HRV dropping: reduce load", "Skipping meals: reset day", "Keep PCP appointment"],
  },
];
