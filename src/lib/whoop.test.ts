import { describe, it, expect } from "vitest";
import { getRecoveryZone, getAutoMode } from "./whoop";

describe("getRecoveryZone", () => {
  it("returns green for scores >= 67", () => {
    expect(getRecoveryZone(67)).toBe("green");
    expect(getRecoveryZone(85)).toBe("green");
    expect(getRecoveryZone(100)).toBe("green");
  });

  it("returns yellow for scores 34-66", () => {
    expect(getRecoveryZone(34)).toBe("yellow");
    expect(getRecoveryZone(50)).toBe("yellow");
    expect(getRecoveryZone(66)).toBe("yellow");
  });

  it("returns red for scores < 34", () => {
    expect(getRecoveryZone(0)).toBe("red");
    expect(getRecoveryZone(20)).toBe("red");
    expect(getRecoveryZone(33)).toBe("red");
  });

  it("handles boundary values exactly", () => {
    expect(getRecoveryZone(33)).toBe("red");
    expect(getRecoveryZone(34)).toBe("yellow");
    expect(getRecoveryZone(66)).toBe("yellow");
    expect(getRecoveryZone(67)).toBe("green");
  });
});

describe("getAutoMode", () => {
  it("returns low for red zone", () => {
    expect(getAutoMode(10)).toBe("low");
    expect(getAutoMode(33)).toBe("low");
  });

  it("returns standard for yellow and green zones", () => {
    expect(getAutoMode(34)).toBe("standard");
    expect(getAutoMode(50)).toBe("standard");
    expect(getAutoMode(85)).toBe("standard");
  });
});
