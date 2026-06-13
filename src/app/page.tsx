"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { DEFAULT_SCHEDULES, type DaySchedule, type ScheduleBlock } from "@/lib/schedule-data";
import { calculateShift } from "@/lib/time";
import { fetchWhoopData, getRecoveryZone, getAutoMode, type WhoopData } from "@/lib/whoop";
import RecoveryRing from "@/components/RecoveryRing";
import ModeBanner from "@/components/ModeBanner";
import ScheduleView from "@/components/ScheduleView";
import TabBar from "@/components/TabBar";
import SetupScreen from "@/components/SetupScreen";
import BlockEditor from "@/components/BlockEditor";
import SettingsModal from "@/components/SettingsModal";
import PushSetup from "@/components/PushSetup";

type AppState = "setup" | "loading" | "ready";

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
  const contentRef = useRef<HTMLDivElement>(null);

  const loadWhoopFromSession = useCallback(async () => {
    try {
      const [recoveryRes, sleepRes] = await Promise.all([
        fetch("/api/whoop/recovery"),
        fetch("/api/whoop/sleep"),
      ]);

      if (!recoveryRes.ok) throw new Error("Failed to fetch recovery");
      const recoveryData = await recoveryRes.json();
      const recovery = recoveryData.records?.[0];
      if (!recovery?.score) throw new Error("No recovery data");

      const sleepData = sleepRes.ok ? await sleepRes.json() : null;
      const sleep = sleepData?.records?.[0];

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
      if (data.sleep) {
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

      if (data.sleep) {
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

    if (session?.user) {
      setAppState("loading");
      loadWhoopFromSession().then(() => setAppState("ready"));
      return;
    }

    const token = localStorage.getItem("whoop_token");
    const skipped = localStorage.getItem("whoop_skipped");

    if (!token && !skipped) {
      setAppState("setup");
      return;
    }

    if (token) {
      loadWhoop(token).then(() => setAppState("ready"));
    } else {
      setAppState("ready");
    }
  }, [loadWhoop, loadWhoopFromSession, session, sessionStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSchedules((prev) => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const activeSchedule = schedules.find((s) => s.id === activeTab) || schedules[0];
  const zone = whoopData ? getRecoveryZone(whoopData.recovery.score) : null;

  if (appState === "setup") {
    return <SetupScreen onConnect={handleConnect} onSkip={handleSkip} />;
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
      <div ref={contentRef} className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch] px-3.5 pt-5 pb-[calc(72px+env(safe-area-inset-bottom,0px)+20px)] sm:px-5 sm:pt-7 lg:max-w-[820px] lg:mx-auto lg:px-10 lg:pt-9 xl:max-w-[900px] xl:px-12">

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

        {!whoopData && (
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

        <ScheduleView
          schedule={activeSchedule}
          shiftMinutes={shiftMinutes}
          onEditBlock={editMode ? setEditingBlock : undefined}
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
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
