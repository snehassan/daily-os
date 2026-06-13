import { describe, it, expect } from "vitest";
import { formatTime, shiftTime, calculateShift, getShiftedTimeLabel, getBlockMinutes, DEFAULT_WAKE } from "./time";

describe("formatTime", () => {
  it("formats AM times", () => {
    expect(formatTime(7, 30)).toBe("7:30");
    expect(formatTime(9, 0)).toBe("9am");
    expect(formatTime(11, 15)).toBe("11:15");
  });

  it("formats PM times", () => {
    expect(formatTime(13, 0)).toBe("1pm");
    expect(formatTime(14, 45)).toBe("2:45");
    expect(formatTime(23, 30)).toBe("11:30");
  });

  it("formats noon and midnight", () => {
    expect(formatTime(0, 0)).toBe("12am");
    expect(formatTime(12, 0)).toBe("12pm");
  });

  it("omits minutes when zero", () => {
    expect(formatTime(8, 0)).toBe("8am");
    expect(formatTime(15, 0)).toBe("3pm");
  });
});

describe("shiftTime", () => {
  it("shifts forward", () => {
    expect(shiftTime(7, 30, 60)).toEqual({ h: 8, m: 30 });
    expect(shiftTime(7, 30, 90)).toEqual({ h: 9, m: 0 });
  });

  it("shifts backward", () => {
    expect(shiftTime(7, 30, -30)).toEqual({ h: 7, m: 0 });
    expect(shiftTime(7, 30, -90)).toEqual({ h: 6, m: 0 });
  });

  it("wraps past midnight", () => {
    expect(shiftTime(23, 0, 120)).toEqual({ h: 1, m: 0 });
  });

  it("wraps before midnight", () => {
    expect(shiftTime(1, 0, -120)).toEqual({ h: 23, m: 0 });
  });
});

describe("calculateShift", () => {
  it("returns zero when waking at default time", () => {
    expect(calculateShift(DEFAULT_WAKE.h, DEFAULT_WAKE.m)).toBe(0);
  });

  it("returns positive when waking later", () => {
    expect(calculateShift(9, 0)).toBe(90);
  });

  it("returns negative when waking earlier", () => {
    expect(calculateShift(6, 0)).toBe(-90);
  });
});

describe("getShiftedTimeLabel", () => {
  it("applies shift and formats", () => {
    expect(getShiftedTimeLabel([7, 30], 60)).toBe("8:30");
    expect(getShiftedTimeLabel([12, 0], -30)).toBe("11:30");
  });
});

describe("getBlockMinutes", () => {
  it("returns total minutes after shift", () => {
    expect(getBlockMinutes([7, 30], 0)).toBe(450);
    expect(getBlockMinutes([7, 30], 60)).toBe(510);
  });
});
