import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateTime,
  dateToTimestamp,
  dateToTs,
  tsToDate,
  tsToInputDT,
} from "../dateUtils";

describe("formatDate", () => {
  // Use a known timestamp: 2024-06-15T12:00:00.000Z
  const ts = new Date("2024-06-15T12:00:00Z").getTime();

  it("returns em-dash for null", () => {
    expect(formatDate(null, "pt")).toBe("\u2014");
  });

  it("returns em-dash for undefined", () => {
    expect(formatDate(undefined, "pt")).toBe("\u2014");
  });

  it("returns em-dash for 0", () => {
    expect(formatDate(0, "pt")).toBe("\u2014");
  });

  it("formats date in pt locale (pt-BR)", () => {
    const result = formatDate(ts, "pt");
    // pt-BR format: dd/mm/yyyy
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("formats date in en locale (en-US)", () => {
    const result = formatDate(ts, "en");
    // en-US format: mm/dd/yyyy
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("formats date in es locale (es-ES)", () => {
    const result = formatDate(ts, "es");
    // es-ES format: dd/mm/yyyy
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("defaults to en-US for unknown locale", () => {
    const result = formatDate(ts, "fr");
    // Falls through to en-US
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

describe("formatDateTime", () => {
  const ts = new Date("2024-06-15T14:30:00Z").getTime();

  it("returns em-dash for null", () => {
    expect(formatDateTime(null, "pt")).toBe("\u2014");
  });

  it("returns em-dash for undefined", () => {
    expect(formatDateTime(undefined, "en")).toBe("\u2014");
  });

  it("returns em-dash for 0", () => {
    expect(formatDateTime(0, "es")).toBe("\u2014");
  });

  it("returns a non-empty string for valid timestamp", () => {
    const result = formatDateTime(ts, "pt");
    expect(result).not.toBe("\u2014");
    expect(result.length).toBeGreaterThan(5);
  });
});

describe("dateToTimestamp", () => {
  it("converts date string to timestamp", () => {
    const result = dateToTimestamp("2024-06-15");
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThan(0);
  });

  it("returns NaN for invalid date", () => {
    const result = dateToTimestamp("not-a-date");
    expect(isNaN(result)).toBe(true);
  });
});

describe("dateToTs", () => {
  it("converts date string to timestamp at noon", () => {
    const result = dateToTs("2024-06-15");
    expect(result).not.toBeNull();
    expect(typeof result).toBe("number");
    // Should be noon of that day
    const date = new Date(result!);
    expect(date.getHours()).toBe(12);
    expect(date.getMinutes()).toBe(0);
  });

  it("returns null for empty string", () => {
    expect(dateToTs("")).toBeNull();
  });
});

describe("tsToDate", () => {
  it("converts timestamp to YYYY-MM-DD string", () => {
    const ts = new Date("2024-06-15T12:00:00Z").getTime();
    const result = tsToDate(ts);
    expect(result).toBe("2024-06-15");
  });

  it("returns empty string for null", () => {
    expect(tsToDate(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(tsToDate(undefined)).toBe("");
  });
});

describe("dateToTs / tsToDate roundtrip", () => {
  it("roundtrips correctly", () => {
    const original = "2024-06-15";
    const ts = dateToTs(original);
    expect(ts).not.toBeNull();
    const back = tsToDate(ts);
    expect(back).toBe(original);
  });
});

describe("tsToInputDT", () => {
  it("returns empty string for null", () => {
    expect(tsToInputDT(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(tsToInputDT(undefined)).toBe("");
  });

  it("returns datetime-local format string for valid timestamp", () => {
    const ts = new Date("2024-06-15T14:30:00Z").getTime();
    const result = tsToInputDT(ts);
    // Should be in YYYY-MM-DDTHH:MM format (16 chars)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
