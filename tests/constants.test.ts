import {
  PROPERTY_TYPES,
  REPORT_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  ANOMALY_CODES,
  PHOTO_KINDS,
  CHECKLIST_SECTIONS
} from "@/lib/constants";

describe("PROPERTY_TYPES", () => {
  it("has all required property types", () => {
    const values = PROPERTY_TYPES.map((p) => p.value);
    expect(values).toContain("appartamento");
    expect(values).toContain("villa");
    expect(values).toContain("ufficio");
    expect(values).toContain("bnb");
  });

  it("all values are unique", () => {
    const values = PROPERTY_TYPES.map((p) => p.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("REPORT_STATUSES", () => {
  it("has all expected statuses", () => {
    expect(REPORT_STATUSES).toEqual([
      "bozza",
      "completato",
      "inviato",
      "ricevuto",
      "approvato",
      "contestato"
    ]);
  });

  it("STATUS_LABELS covers all statuses", () => {
    for (const status of REPORT_STATUSES) {
      expect(STATUS_LABELS[status]).toBeDefined();
      expect(typeof STATUS_LABELS[status]).toBe("string");
    }
  });

  it("STATUS_COLORS covers all statuses", () => {
    for (const status of REPORT_STATUSES) {
      expect(STATUS_COLORS[status]).toBeDefined();
      expect(STATUS_COLORS[status]).toMatch(/^bg-/);
    }
  });
});

describe("ANOMALY_CODES", () => {
  it("has 'none' as first option", () => {
    expect(ANOMALY_CODES[0].code).toBe("none");
  });

  it("all codes are unique", () => {
    const codes = ANOMALY_CODES.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("has 'altro' as last option", () => {
    expect(ANOMALY_CODES[ANOMALY_CODES.length - 1].code).toBe("altro");
  });
});

describe("PHOTO_KINDS", () => {
  it("has all expected kinds", () => {
    const values = PHOTO_KINDS.map((k) => k.value);
    expect(values).toContain("before");
    expect(values).toContain("after");
    expect(values).toContain("anomaly");
  });

  it("all values are unique", () => {
    const values = PHOTO_KINDS.map((k) => k.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("CHECKLIST_SECTIONS", () => {
  it("has expected sections", () => {
    expect(CHECKLIST_SECTIONS).toContain("Cucina");
    expect(CHECKLIST_SECTIONS).toContain("Bagni");
    expect(CHECKLIST_SECTIONS).toContain("Camere");
  });
});
