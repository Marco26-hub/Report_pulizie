import { calcTotalHours, formatDate, formatDateTime, todayISO } from "@/lib/utils";

describe("calcTotalHours", () => {
  it("calculates hours correctly for normal range", () => {
    expect(calcTotalHours("09:00", "17:00")).toBe(8);
  });

  it("subtracts break time", () => {
    expect(calcTotalHours("09:00", "17:00", 30)).toBe(7.5);
  });

  it("handles overnight shifts", () => {
    expect(calcTotalHours("22:00", "06:00")).toBe(8);
  });

  it("returns 0 when timeIn is missing", () => {
    expect(calcTotalHours("", "17:00")).toBe(0);
  });

  it("returns 0 when timeOut is missing", () => {
    expect(calcTotalHours("09:00", "")).toBe(0);
  });

  it("handles partial hours", () => {
    expect(calcTotalHours("09:00", "09:30")).toBe(0.5);
    expect(calcTotalHours("09:00", "09:15")).toBe(0.25);
  });
});

describe("formatDate", () => {
  it("formats date string to Italian format", () => {
    const result = formatDate("2024-01-15");
    expect(result).toMatch(/\d{2}\/01\/2024/);
  });

  it("formats Date object to Italian format", () => {
    const date = new Date(2024, 6, 20); // July 20, 2024
    const result = formatDate(date);
    expect(result).toMatch(/20\/07\/2024/);
  });
});

describe("formatDateTime", () => {
  it("formats date with time in Italian locale", () => {
    const result = formatDateTime(new Date(2024, 0, 15, 14, 30));
    expect(result).toContain("2024");
  });
});

describe("todayISO", () => {
  it("returns today's date in ISO format", () => {
    const result = todayISO();
    const today = new Date().toISOString().slice(0, 10);
    expect(result).toBe(today);
  });
});
