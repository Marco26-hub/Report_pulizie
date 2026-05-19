import { z } from "zod";

// Replicate the schemas from API routes for testing
const paramsSchema = z.object({ id: z.string().uuid() });
const contestBodySchema = z.object({ reason: z.string().min(1, "Motivo contestazione obbligatorio").max(1000) });
const setupSchema = z.object({
  company_name: z.string().min(2),
  admin_name: z.string().min(2),
  admin_email: z.string().email(),
  admin_password: z.string().min(8)
});
const employeeSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["employee", "admin"]).default("employee"),
  temp_password: z.string().min(8)
});

describe("paramsSchema", () => {
  it("validates valid UUID", () => {
    const result = paramsSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID string", () => {
    const result = paramsSchema.safeParse({ id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = paramsSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});

describe("contestBodySchema", () => {
  it("validates valid reason", () => {
    const result = contestBodySchema.safeParse({ reason: "Report incompleto" });
    expect(result.success).toBe(true);
  });

  it("rejects empty reason", () => {
    const result = contestBodySchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });

  it("rejects reason too long", () => {
    const result = contestBodySchema.safeParse({ reason: "a".repeat(1001) });
    expect(result.success).toBe(false);
  });
});

describe("setupSchema", () => {
  it("validates correct setup data", () => {
    const result = setupSchema.safeParse({
      company_name: "Pulizie SRL",
      admin_name: "Mario Rossi",
      admin_email: "mario@test.com",
      admin_password: "password123"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = setupSchema.safeParse({
      company_name: "Pulizie SRL",
      admin_name: "Mario Rossi",
      admin_email: "not-an-email",
      admin_password: "password123"
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = setupSchema.safeParse({
      company_name: "Pulizie SRL",
      admin_name: "Mario Rossi",
      admin_email: "mario@test.com",
      admin_password: "short"
    });
    expect(result.success).toBe(false);
  });

  it("rejects short company name", () => {
    const result = setupSchema.safeParse({
      company_name: "A",
      admin_name: "Mario Rossi",
      admin_email: "mario@test.com",
      admin_password: "password123"
    });
    expect(result.success).toBe(false);
  });
});

describe("employeeSchema", () => {
  it("validates correct employee data", () => {
    const result = employeeSchema.safeParse({
      full_name: "Luigi Verdi",
      email: "luigi@test.com",
      temp_password: "password123"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("employee");
    }
  });

  it("defaults role to employee", () => {
    const result = employeeSchema.safeParse({
      full_name: "Luigi Verdi",
      email: "luigi@test.com",
      temp_password: "password123"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("employee");
    }
  });

  it("accepts admin role", () => {
    const result = employeeSchema.safeParse({
      full_name: "Luigi Verdi",
      email: "luigi@test.com",
      role: "admin",
      temp_password: "password123"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = employeeSchema.safeParse({
      full_name: "Luigi Verdi",
      email: "luigi@test.com",
      role: "superadmin",
      temp_password: "password123"
    });
    expect(result.success).toBe(false);
  });
});
