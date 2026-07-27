interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface Entry {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private readonly entries = new Map<string, Entry>();

  check(key: string, options: RateLimitOptions, now = Date.now()) {
    const cutoff = now - options.windowMs;
    const previous = this.entries.get(key)?.timestamps ?? [];
    const active = previous.filter((timestamp) => timestamp > cutoff);

    if (active.length >= options.limit) {
      const retryAt = active[0] + options.windowMs;
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)),
      };
    }

    active.push(now);
    this.entries.set(key, { timestamps: active });

    // Prevent unbounded memory use on long-lived Node processes.
    if (this.entries.size > 5000) {
      for (const [entryKey, entry] of this.entries) {
        if (!entry.timestamps.some((timestamp) => timestamp > cutoff)) {
          this.entries.delete(entryKey);
        }
      }
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function requestClientKey(request: Request) {
  // Vercel overwrites X-Forwarded-For at the edge. The first value represents
  // the originating client; fall back to a non-identifying shared key locally.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export const publicApiLimiter = new SlidingWindowRateLimiter();
