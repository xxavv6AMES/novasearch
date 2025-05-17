export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxTokens: number, refillRate: number) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // convert to seconds
    const newTokens = timePassed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  async tryAcquire(): Promise<boolean> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  async waitForToken(): Promise<void> {
    while (!(await this.tryAcquire())) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// Create separate limiters for search and suggestions
export const searchLimiter = new RateLimiter(10, 1); // 10 tokens, refills at 1 token per second
export const suggestionsLimiter = new RateLimiter(20, 2); // 20 tokens, refills at 2 tokens per second
