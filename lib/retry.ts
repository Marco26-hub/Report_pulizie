type RetryOptions = {
  maxRetries?: number;
  delayMs?: number;
  backoff?: "linear" | "exponential";
};

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = "exponential" } = options;
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;

      const wait = backoff === "exponential" ? delayMs * Math.pow(2, attempt) : delayMs * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  throw lastError;
}
