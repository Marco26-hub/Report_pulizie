import { logger, withErrorBoundary } from "@/lib/logger";

describe("logger", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("logs info messages", () => {
    logger.info("Test message");
    expect(console.log).toHaveBeenCalled();
  });

  it("logs warn messages", () => {
    logger.warn("Warning message");
    expect(console.warn).toHaveBeenCalled();
  });

  it("logs error messages with stack trace", () => {
    const error = new Error("Test error");
    logger.error("Something failed", error);
    expect(console.error).toHaveBeenCalled();
  });

  it("includes context in log", () => {
    logger.info("User action", { userId: "123", action: "login" });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("User action")
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("userId")
    );
  });

  it("creates scoped logger with context", () => {
    const scoped = logger.withContext({ module: "auth" });
    scoped.info("Login attempt");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("auth")
    );
  });
});

describe("withErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("passes through successful sync functions", () => {
    const fn = () => 42;
    const wrapped = withErrorBoundary(fn);
    expect(wrapped()).toBe(42);
  });

  it("catches and logs sync errors", () => {
    const fn = () => { throw new Error("Sync error"); };
    const wrapped = withErrorBoundary(fn, { test: true });
    expect(() => wrapped()).toThrow("Sync error");
    expect(console.error).toHaveBeenCalled();
  });

  it("passes through successful async functions", async () => {
    const fn = async () => "success";
    const wrapped = withErrorBoundary(fn);
    await expect(wrapped()).resolves.toBe("success");
  });

  it("catches and logs async errors", async () => {
    const fn = async () => { throw new Error("Async error"); };
    const wrapped = withErrorBoundary(fn);
    await expect(wrapped()).rejects.toThrow("Async error");
    expect(console.error).toHaveBeenCalled();
  });
});
