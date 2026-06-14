"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { DEFAULT_SCHEDULES, type DaySchedule, type ScheduleBlock } from "@/lib/schedule-data";
import { calculateShift, DEFAULT_WAKE, shiftTime, getDayCompression, getBlockEffectiveShift, getBlockMinutes } from "@/lib/time";
import { fetchWhoopData, getRecoveryZone, getAutoMode, type WhoopData } from "@/lib/whoop";
import RecoveryRing from "@/components/RecoveryRing";
import ModeBanner from "@/components/ModeBanner";
import ScheduleView from "@/components/ScheduleView";
import TabBar from "@/components/TabBar";
import SetupScreen from "@/components/SetupScreen";
import BlockEditor from "@/components/BlockEditor";
import SettingsModal from "@/components/SettingsModal";
import PushSetup from "@/components/PushSetup";
import OnboardingWizard from "@/components/OnboardingWizard";

type AppState = "setup" | "loading" | "onboarding" | "ready";

export default function HomePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [appState, setAppState] = useState<AppState>("loading");
  const [schedules, setSchedules] = useState<DaySchedule[]>(DEFAULT_SCHEDULES);
  const [activeTab, setActiveTab] = useState("standard");
  const [whoopData, setWhoopData] = useState<WhoopData | null>(null);
  const [shiftMinutes, setShiftMinutes] = useState(0);
  const [autoModeId, setAutoModeId] = useState<string | undefined>();
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [customWake, setCustomWake] = useState<{ h: number; m: number } | null>(null);
  const [blockAdjustments, setBlockAdjustments] = useState<Record<string, number>>({});
  const [tokenExpired, setTokenExpired] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const loadWhoopFromSession = useCallback(async () => {
    try {
      const [recoveryRes, sleepRes] = await Promise.all([
        fetch("/api/whoop/recovery"),
        fetch("/api/whoop/sleep"),
      ]);

      if (recoveryRes.status === 401) {
        const body = await recoveryRes.json().catch(() => ({}));
        if (body.error === "token_expired") {
          setTokenExpired(true);
          return false;
        }
      }

      if (!recoveryRes.ok) throw new Error("Failed to fetch recovery");
      const recoveryData = await recoveryRes.json();
      const recovery = recoveryData.records?.[0];
      if (!recovery?.score) throw new Error("No recovery data");

      const sleepData = sleepRes.ok ? await sleepRes.json() : null;
      const sleep = sleepData?.records?.find((r: { nap: boolean }) => !r.nap);

      let sleepResult = null;
      if (sleep?.end) {
        const wakeDate = new Date(sleep.end);
        sleepResult = {
          wakeTime: { h: wakeDate.getHours(), m: wakeDate.getMinutes() },
          endISO: sleep.end,
        };
      }

      const data: WhoopData = {
        recovery: {
          score: recovery.score.recovery_score,
          hrv: recovery.score.hrv_rmssd_milli,
          rhr: recovery.score.resting_heart_rate,
        },
        sleep: sleepResult,
      };

      setWhoopData(data);
      const savedWake = localStorage.getItem("daily_os_custom_wake");
      if (!savedWake && data.sleep) {
        setShiftMinutes(calculateShift(data.sleep.wakeTime.h, data.sleep.wakeTime.m));
      }
      const mode = getAutoMode(data.recovery.score);
      setAutoModeId(mode);
      setActiveTab(mode);
      return true;
    } catch (err) {
      console.error("Whoop fetch failed:", err);
      return false;
    }
  }, []);

  const loadWhoop = useCallback(async (token: string) => {
    try {
      const data = await fetchWhoopData(token);
      setWhoopData(data);

      const savedWake = localStorage.getItem("daily_os_custom_wake");
      if (!savedWake && data.sleep) {
        const shift = calculateShift(data.sleep.wakeTime.h, data.sleep.wakeTime.m);
        setShiftMinutes(shift);
      }

      const mode = getAutoMode(data.recovery.score);
      setAutoModeId(mode);
      setActiveTab(mode);

      return true;
    } catch (err) {
      console.error("Whoop fetch failed:", err);
      if (err instanceof Error && err.message === "TOKEN_EXPIRED") {
        localStorage.removeItem("whoop_token");
        setAppState("setup");
      }
      return false;
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    const savedSchedules = localStorage.getItem("daily_os_schedules");
    if (savedSchedules) {
      try {
        setSchedules(JSON.parse(savedSchedules));
      } catch {}
    }

    const savedWake = localStorage.getItem("daily_os_custom_wake");
    if (savedWake) {
      try {
        const wake = JSON.parse(savedWake);
        setCustomWake(wake);
        setShiftMinutes(calculateShift(wake.h, wake.m));
      } catch {}
    }

    const savedAdj = localStorage.getItem("daily_os_block_adj");
    if (savedAdj) {
      try {
        const { date, adj } = JSON.parse(savedAdj);
        if (date === new Date().toDateString()) {
          setBlockAdjustments(adj);
        } else {
          localStorage.removeItem("daily_os_block_adj");
        }
      } catch {}
    }

    const needsOnboarding = !localStorage.getItem("daily_os_onboarded") && !localStorage.getItem("daily_os_schedules");

    if (session?.user) {
      setAppState("loading");
      loadWhoopFromSession().then(() => setAppState(needsOnboarding ? "onboarding" : "ready"));
      return;
    }

    const token = localStorage.getItem("whoop_token");
    const skipped = localStorage.getItem("whoop_skipped");

    if (!token && !skipped) {
      setAppState("setup");
      return;
    }

    if (token) {
      loadWhoop(token).then(() => setAppState(needsOnboarding ? "onboarding" : "ready"));
    } else {
      setAppState(needsOnboarding ? "onboarding" : "ready");
    }
  }, [loadWhoop, loadWhoopFromSession, session, sessionStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSchedules((prev) => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const compression = useMemo(() => getDayCompression(shiftMinutes), [shiftMinutes]);
  const activeSchedule = schedules.find((s) => s.id === activeTab) || schedules[0];

  useEffect(() => {
    if (appState !== "ready") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const block of activeSchedule.blocks) {
      if (!block.time) continue;
      const baseShift = getBlockEffectiveShift(block.time, shiftMinutes, compression);
      const effectiveShift = baseShift + (blockAdjustments[block.id] || 0);
      const blockMin = getBlockMinutes(block.time, effectiveShift);
      const notifyMin = blockMin - 10;

      if (notifyMin > nowMin) {
        const delayMs = (notifyMin - nowMin) * 60 * 1000;
        timers.push(setTimeout(() => {
          new Notification("Daily OS", {
            body: `${block.title} starts in 10 minutes`,
            icon: "/icon-192.png",
          });
        }, delayMs));
      }
    }

    return () => timers.forEach(t => clearTimeout(t));
  }, [appState, activeSchedule, shiftMinutes, blockAdjustments, compression]);

  function handleOnboardingComplete(newSchedules: DaySchedule[]) {
    saveSchedules(newSchedules);
    localStorage.setItem("daily_os_onboarded", "true");
    setAppState("ready");
  }

  function handleConnect(token: string) {
    localStorage.setItem("whoop_token", token);
    localStorage.removeItem("whoop_skipped");
    setAppState("loading");
    loadWhoop(token).then(() => setAppState("ready"));
  }

  function handleSkip() {
    localStorage.setItem("whoop_skipped", "true");
    setAppState("ready");
  }

  function handleTabSelect(id: string) {
    setActiveTab(id);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveSchedules(updated: DaySchedule[]) {
    setSchedules(updated);
    localStorage.setItem("daily_os_schedules", JSON.stringify(updated));
  }

  function handleBlockSave(block: ScheduleBlock) {
    const updated = schedules.map((s) => {
      if (s.id !== activeTab) return s;
      const idx = s.blocks.findIndex((b) => b.id === block.id);
      if (idx >= 0) {
        const blocks = [...s.blocks];
        blocks[idx] = block;
        return { ...s, blocks };
      }
      return { ...s, blocks: [...s.blocks, block] };
    });
    saveSchedules(updated);
    setEditingBlock(undefined);
  }

  function handleBlockDelete(id: string) {
    const updated = schedules.map((s) => {
      if (s.id !== activeTab) return s;
      return { ...s, blocks: s.blocks.filter((b) => b.id !== id) };
    });
    saveSchedules(updated);
    setEditingBlock(undefined);
  }

  function handleSettingsSave(token: string) {
    if (token) {
      localStorage.setItem("whoop_token", token);
      localStorage.removeItem("whoop_skipped");
      setShowSettings(false);
      setAppState("loading");
      loadWhoop(token).then(() => setAppState("ready"));
    }
  }

  function handleSettingsClear() {
    localStorage.removeItem("whoop_token");
    localStorage.removeItem("whoop_skipped");
    setShowSettings(false);
    setWhoopData(null);
    setAutoModeId(undefined);
    setShiftMinutes(0);
    setAppState("setup");
  }

  function handleResetSchedules() {
    localStorage.removeItem("daily_os_schedules");
    setSchedules(DEFAULT_SCHEDULES);
  }

  function handleWakeTimeChange(timeStr: string) {
    const [h, m] = timeStr.split(":").map(Number);
    const wake = { h, m };
    setCustomWake(wake);
    localStorage.setItem("daily_os_custom_wake", JSON.stringify(wake));
    setShiftMinutes(calculateShift(h, m));
    handleClearAdjustments();
  }

  function handleClearCustomWake() {
    setCustomWake(null);
    localStorage.removeItem("daily_os_custom_wake");
    if (whoopData?.sleep) {
      setShiftMinutes(calculateShift(whoopData.sleep.wakeTime.h, whoopData.sleep.wakeTime.m));
    } else {
      setShiftMinutes(0);
    }
  }

  function handleBlockTimeAdjust(blockId: string, newH: number, newM: number) {
    const schedule = schedules.find(s => s.id === activeTab);
    if (!schedule) return;

    const blockIndex = schedule.blocks.findIndex(b => b.id === blockId);
    if (blockIndex < 0) return;

    const block = schedule.blocks[blockIndex];
    if (!block.time) return;

    const compression = getDayCompression(shiftMinutes);
    const baseShift = getBlockEffectiveShift(block.time, shiftMinutes, compression);
    const currentAdj = blockAdjustments[block.id] || 0;
    const effectiveShift = baseShift + currentAdj;
    const current = shiftTime(block.time[0], block.time[1], effectiveShift);
    const delta = (newH * 60 + newM) - (current.h * 60 + current.m);
    if (delta === 0) return;

    const newAdj = { ...blockAdjustments };
    for (let i = blockIndex; i < schedule.blocks.length; i++) {
      const b = schedule.blocks[i];
      newAdj[b.id] = (newAdj[b.id] || 0) + delta;
    }

    setBlockAdjustments(newAdj);
    localStorage.setItem("daily_os_block_adj", JSON.stringify({
      date: new Date().toDateString(),
      adj: newAdj,
    }));
  }

  function handleClearAdjustments() {
    setBlockAdjustments({});
    localStorage.removeItem("daily_os_block_adj");
  }

  const zone = whoopData ? getRecoveryZone(whoopData.recovery.score) : null;

  if (appState === "setup") {
    return <SetupScreen onConnect={handleConnect} onSkip={handleSkip} />;
  }

  if (appState === "onboarding") {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  if (appState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-border border-t-accent-buffer rounded-full animate-spin" />
        <span className="text-[13px] text-muted">Fetching recovery data from Whoop...</span>
      </div>
    );
  }

  return (
    <>
      <div ref={contentRef} className="px-3.5 pt-5 pb-[calc(72px+env(safe-area-inset-bottom,0px)+20px)] sm:px-5 sm:pt-7 lg:max-w-[820px] lg:mx-auto lg:px-10 lg:pt-9 xl:max-w-[900px] xl:px-12">

        <div className="mb-5">
          <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.14em] text-muted uppercase mb-1.5">
            daily operating system
          </div>
          <h1 className="font-serif text-[26px] sm:text-[32px] lg:text-[42px] xl:text-[46px] font-normal leading-[1.15] mb-2">
            Daily <em className="italic text-accent-buffer">OS</em>
          </h1>
          <p className="text-muted text-[12px] sm:text-[13px] lg:text-sm leading-[1.6]">
            Recovery-aware scheduling. Not a hustle schedule — a sustainable one.
          </p>
        </div>

        {whoopData && (
          <RecoveryRing
            score={whoopData.recovery.score}
            hrv={whoopData.recovery.hrv}
            rhr={whoopData.recovery.rhr}
            wakeTime={whoopData.sleep?.wakeTime || null}
            shiftMinutes={shiftMinutes}
          />
        )}

        {whoopData && zone && (
          <ModeBanner score={whoopData.recovery.score} zone={zone} />
        )}

        <PushSetup
          vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""}
          isAuthenticated={!!whoopData}
        />

        {tokenExpired && (
          <div className="bg-[#1f1508] border border-[#3d2a0a] rounded-[10px] p-[14px_16px] text-[13px] leading-[1.6] mb-5 flex items-center justify-between gap-3">
            <div>
              <strong className="block font-mono text-[10px] tracking-[0.1em] uppercase mb-1 text-accent-lc">
                whoop session expired
              </strong>
              <span className="text-muted">Sign in again to refresh your recovery data.</span>
            </div>
            <button
              onClick={() => signIn("whoop")}
              className="px-4 py-2 bg-accent-lc text-bg text-xs font-semibold rounded-lg cursor-pointer shrink-0 active:opacity-80"
            >
              Re-sign in
            </button>
          </div>
        )}

        {!whoopData && !tokenExpired && (
          <div className="bg-[#1a1020] border border-[#3d1a4a] rounded-[10px] p-[14px_16px] text-[13px] text-[#c084fc] leading-[1.6] mb-5">
            <strong className="block font-mono text-[10px] tracking-[0.1em] uppercase mb-1 text-[#a855f7]">
              health note
            </strong>
            Physiological stress has been running high (593% above baseline some days). This schedule protects sleep, enforces real breaks, and keeps evenings light. On depleted days, compress the middle — never the sleep or the break.
          </div>
        )}

        <div className="flex flex-wrap gap-2 sm:gap-2.5 lg:gap-4 mb-5 sm:mb-6 lg:mb-7">
          {[
            { color: "#c084fc", label: "jobs" },
            { color: "#fb923c", label: "leetcode" },
            { color: "#34d399", label: "learn" },
            { color: "#f472b6", label: "health" },
            { color: "#60a5fa", label: "flex" },
            { color: "#a78bfa", label: "buffer" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-[10px] sm:text-[11px] lg:text-xs text-muted font-mono">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-5 p-3 bg-surface border border-border rounded-[10px]">
          <label className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted shrink-0">
            Wake up
          </label>
          <input
            type="time"
            value={`${String(customWake?.h ?? shiftTime(DEFAULT_WAKE.h, DEFAULT_WAKE.m, shiftMinutes).h).padStart(2, "0")}:${String(customWake?.m ?? shiftTime(DEFAULT_WAKE.h, DEFAULT_WAKE.m, shiftMinutes).m).padStart(2, "0")}`}
            onChange={(e) => handleWakeTimeChange(e.target.value)}
            className="bg-bg border border-border rounded-lg px-2.5 py-1.5 text-text font-mono text-xs outline-none focus:border-accent-buffer transition-colors [color-scheme:dark]"
          />
          <span className="text-muted text-[11px]">
            {customWake ? "custom" : whoopData?.sleep ? "from whoop" : "default"}
          </span>
          {customWake && (
            <button
              onClick={handleClearCustomWake}
              className="text-[10px] text-dot font-mono bg-transparent border-none cursor-pointer active:text-muted ml-auto"
            >
              reset
            </button>
          )}
        </div>

        {editMode && (
          <div className="flex items-center justify-between mb-4 p-3 bg-surface border border-accent-buffer/30 rounded-lg flex-wrap gap-2">
            <span className="text-xs text-accent-buffer font-mono">EDIT MODE</span>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingBlock(null)}
                className="px-3 py-1.5 bg-accent-buffer text-bg text-xs font-semibold rounded-lg cursor-pointer"
              >
                + Add Block
              </button>
              <button
                onClick={handleResetSchedules}
                className="px-3 py-1.5 border border-border text-muted text-xs rounded-lg bg-transparent cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-3 py-1.5 border border-border text-muted text-xs rounded-lg bg-transparent cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {Object.keys(blockAdjustments).length > 0 && (
          <div className="flex items-center justify-between mb-3 px-3 py-2 bg-[#1f1508] border border-[#3d2a0a] rounded-lg">
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-accent-lc">
              schedule adjusted
            </span>
            <button
              onClick={handleClearAdjustments}
              className="text-[10px] text-dot font-mono bg-transparent border-none cursor-pointer active:text-muted"
            >
              reset
            </button>
          </div>
        )}

        <ScheduleView
          schedule={activeSchedule}
          shiftMinutes={shiftMinutes}
          blockAdjustments={blockAdjustments}
          onEditBlock={editMode ? setEditingBlock : undefined}
          onAdjustBlockTime={handleBlockTimeAdjust}
        />

        {whoopData && (
          <div className="text-center pt-3 pb-2">
            <button
              onClick={() => {
                const token = localStorage.getItem("whoop_token");
                if (token) loadWhoop(token);
              }}
              className="font-mono text-[10px] text-dot cursor-pointer bg-transparent border-none active:text-muted"
            >
              Tap to refresh Whoop data
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 lg:top-5 lg:right-5 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-surface border border-border text-muted text-base lg:text-lg cursor-pointer z-[101] flex items-center justify-center active:text-text transition-colors"
      >
        ⚙
      </button>

      <button
        onClick={() => setEditMode(!editMode)}
        className={`fixed top-4 right-14 lg:top-5 lg:right-16 w-9 h-9 lg:w-10 lg:h-10 rounded-full border text-sm cursor-pointer z-[101] flex items-center justify-center active:text-text transition-colors
          ${editMode ? "bg-accent-buffer/20 border-accent-buffer/50 text-accent-buffer" : "bg-surface border-border text-muted"}`}
        title="Edit schedule"
      >
        ✏️
      </button>

      <TabBar
        schedules={schedules}
        activeId={activeTab}
        autoModeId={autoModeId}
        onSelect={handleTabSelect}
      />

      {editingBlock !== undefined && (
        <BlockEditor
          block={editingBlock}
          onSave={handleBlockSave}
          onDelete={handleBlockDelete}
          onClose={() => setEditingBlock(undefined)}
        />
      )}

      <SettingsModal
        open={showSettings}
        currentToken={typeof window !== "undefined" ? localStorage.getItem("whoop_token") || "" : ""}
        onSave={handleSettingsSave}
        onClear={handleSettingsClear}
        onRebuild={() => {
          localStorage.removeItem("daily_os_onboarded");
          localStorage.removeItem("daily_os_schedules");
          setShowSettings(false);
          setAppState("onboarding");
        }}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
