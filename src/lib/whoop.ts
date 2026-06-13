const WHOOP_BASE = "https://api.prod.whoop.com/developer/v1";

export interface RecoveryData {
  score: number;
  hrv: number;
  rhr: number;
}

export interface SleepData {
  wakeTime: { h: number; m: number };
  endISO: string;
}

export interface WhoopData {
  recovery: RecoveryData;
  sleep: SleepData | null;
}

async function whoopFetch(endpoint: string, token: string) {
  const res = await fetch(`${WHOOP_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new Error("TOKEN_EXPIRED");
  }

  if (!res.ok) {
    throw new Error(`Whoop API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchWhoopData(token: string): Promise<WhoopData> {
  const [recoveryRes, sleepRes] = await Promise.all([
    whoopFetch("/recovery?limit=1", token),
    whoopFetch("/activity/sleep?limit=1", token),
  ]);

  const recovery = recoveryRes.records?.[0];
  if (!recovery?.score) {
    throw new Error("No recovery data available");
  }

  const sleep = sleepRes.records?.[0];
  let sleepData: SleepData | null = null;

  if (sleep?.end) {
    const wakeDate = new Date(sleep.end);
    sleepData = {
      wakeTime: { h: wakeDate.getHours(), m: wakeDate.getMinutes() },
      endISO: sleep.end,
    };
  }

  return {
    recovery: {
      score: recovery.score.recovery_score,
      hrv: recovery.score.hrv_rmssd_milli,
      rhr: recovery.score.resting_heart_rate,
    },
    sleep: sleepData,
  };
}

export function getRecoveryZone(score: number): "green" | "yellow" | "red" {
  if (score >= 67) return "green";
  if (score >= 34) return "yellow";
  return "red";
}

export function getAutoMode(score: number): string {
  return score < 34 ? "low" : "standard";
}
