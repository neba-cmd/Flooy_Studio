import { describe, expect, it } from "vitest";
import { SlidingWindowRateLimiter } from "./rate-limit";

describe("SlidingWindowRateLimiter", () => {
  it("allows requests up to the configured limit", () => {
    const limiter = new SlidingWindowRateLimiter();
    const options = { limit: 2, windowMs: 1000 };

    expect(limiter.check("customer", options, 1000).allowed).toBe(true);
    expect(limiter.check("customer", options, 1100).allowed).toBe(true);
    expect(limiter.check("customer", options, 1200)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
  });

  it("opens a new window and isolates different clients", () => {
    const limiter = new SlidingWindowRateLimiter();
    const options = { limit: 1, windowMs: 1000 };

    expect(limiter.check("one", options, 1000).allowed).toBe(true);
    expect(limiter.check("two", options, 1001).allowed).toBe(true);
    expect(limiter.check("one", options, 2001).allowed).toBe(true);
  });
});
