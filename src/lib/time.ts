export const DEFAULT_WAKE = { h: 7, m: 30 };

export function formatTime(h: number, m: number): string {
  const period = h >= 12 ? "pm" : "am";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const displayM = m.toString().padStart(2, "0");
  if (displayM === "00") return `${displayH}${period}`;
  return `${displayH}:${displayM}`;
}

export function shiftTime(baseH: number, baseM: number, shiftMin: number): { h: number; m: number } {
  let totalMin = baseH * 60 + baseM + shiftMin;
  if (totalMin < 0) totalMin += 24 * 60;
  totalMin = totalMin % (24 * 60);
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 };
}

export function calculateShift(wakeH: number, wakeM: number): number {
  const defaultMin = DEFAULT_WAKE.h * 60 + DEFAULT_WAKE.m;
  const actualMin = wakeH * 60 + wakeM;
  return actualMin - defaultMin;
}

export function getShiftedTimeLabel(time: [number, number], shiftMin: number): string {
  const shifted = shiftTime(time[0], time[1], shiftMin);
  return formatTime(shifted.h, shifted.m);
}

export function getBlockMinutes(time: [number, number], shiftMin: number): number {
  const shifted = shiftTime(time[0], time[1], shiftMin);
  return shifted.h * 60 + shifted.m;
}

const DEFAULT_DAY_LENGTH = 14 * 60;
const MAX_BEDTIME = 25 * 60;

export function getDayCompression(shiftMinutes: number): number {
  if (shiftMinutes <= 0) return 1;
  const defaultWakeMin = DEFAULT_WAKE.h * 60 + DEFAULT_WAKE.m;
  const wakeMin = defaultWakeMin + shiftMinutes;
  const maxSleep = Math.min(wakeMin + 16 * 60, MAX_BEDTIME);
  const available = maxSleep - wakeMin;
  if (available >= DEFAULT_DAY_LENGTH) return 1;
  return available / DEFAULT_DAY_LENGTH;
}

export function getBlockEffectiveShift(
  blockTime: [number, number],
  shiftMinutes: number,
  compression: number,
): number {
  if (compression >= 1) return shiftMinutes;
  const defaultWakeMin = DEFAULT_WAKE.h * 60 + DEFAULT_WAKE.m;
  const blockOffset = blockTime[0] * 60 + blockTime[1] - defaultWakeMin;
  return Math.round(shiftMinutes + blockOffset * (compression - 1));
}
