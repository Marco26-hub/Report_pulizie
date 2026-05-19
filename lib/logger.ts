type ErrorLevel = "info" | "warn" | "error";

type ErrorContext = Record<string, string | number | boolean | null | undefined>;

type LogEntry = {
  level: ErrorLevel;
  message: string;
  timestamp: string;
  context?: ErrorContext;
  stack?: string;
  userId?: string;
  route?: string;
};

function formatLog(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.message
  ];
  if (entry.userId) parts.push(`user:${entry.userId}`);
  if (entry.route) parts.push(`route:${entry.route}`);
  if (entry.context) parts.push(JSON.stringify(entry.context));
  if (entry.stack) parts.push(`\n${entry.stack}`);
  return parts.join(" ");
}

function log(entry: LogEntry): void {
  const formatted = formatLog(entry);

  switch (entry.level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }

  // If Sentry DSN is configured, send to Sentry
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && typeof window !== "undefined") {
    try {
      // Dynamic import with variable to prevent Vite from resolving at build time
      const sentryModule = "@sentry/browser";
      import(/* @vite-ignore */ sentryModule).then((Sentry) => {
        if (entry.level === "error") {
      Sentry.captureException(new Error(entry.message), {
          extra: { ...entry.context, route: entry.route },
          user: entry.userId ? { id: entry.userId } : undefined,
          level: entry.level as "error" | "warning"
        });
        }
      }).catch(() => { /* Sentry not available */ });
    } catch { /* Import failed */ }
  }
}

export const logger = {
  info(message: string, context?: ErrorContext) {
    log({
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      context
    });
  },

  warn(message: string, context?: ErrorContext) {
    log({
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      context
    });
  },

  error(message: string, error?: Error | unknown, context?: ErrorContext) {
    const err = error instanceof Error ? error : new Error(String(error));
    log({
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      context,
      stack: err.stack
    });
  },

  withContext(context: ErrorContext) {
    return {
      info: (message: string, extra?: ErrorContext) => this.info(message, { ...context, ...extra }),
      warn: (message: string, extra?: ErrorContext) => this.warn(message, { ...context, ...extra }),
      error: (message: string, error?: Error | unknown, extra?: ErrorContext) =>
        this.error(message, error, { ...context, ...extra })
    };
  }
};

export function withErrorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  context: ErrorContext = {}
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          logger.error("Unhandled error in async function", error, context);
          throw error;
        });
      }
      return result;
    } catch (error) {
      logger.error("Unhandled error in function", error, context);
      throw error;
    }
  }) as T;
}
