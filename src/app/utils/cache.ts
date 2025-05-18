import { LRUCache } from 'lru-cache';

// Cache for search results and suggestions
const searchCache = new LRUCache<string, Record<string, unknown>>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
});

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  backoffUntil?: number;
}

interface RateLimiter {
  maxTokens: number;
  refillRate: number; // tokens per second
  refillInterval: number; // milliseconds
  buckets: Map<string, TokenBucket>;
}

const rateLimiters: Record<string, RateLimiter> = {
  search: {
    maxTokens: 30,
    refillRate: 0.5, // 1 token every 2 seconds
    refillInterval: 1000,
    buckets: new Map(),
  },
  suggest: {
    maxTokens: 50,
    refillRate: 1, // 1 token per second
    refillInterval: 1000,
    buckets: new Map(),
  },
};

export function getRateLimitedResponse(key: 'search' | 'suggest'): {
  isLimited: boolean;
  remainingTokens: number;
  retryAfter?: number;
} {
  const limiter = rateLimiters[key];
  const now = Date.now();
  let bucket = limiter.buckets.get(key);

  // If in backoff period, return limited
  if (bucket?.backoffUntil && now < bucket.backoffUntil) {
    return {
      isLimited: true,
      remainingTokens: 0,
      retryAfter: Math.ceil((bucket.backoffUntil - now) / 1000),
    };
  }

  // Initialize bucket if it doesn't exist
  if (!bucket) {
    bucket = { tokens: limiter.maxTokens, lastRefill: now };
    limiter.buckets.set(key, bucket);
  }

  // Refill tokens based on time elapsed
  const timeSinceLastRefill = now - bucket.lastRefill;
  const tokensToAdd = (timeSinceLastRefill / 1000) * limiter.refillRate;
  
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(limiter.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Check if we have tokens available
  if (bucket.tokens >= 1) {
    bucket.tokens--;
    return {
      isLimited: false,
      remainingTokens: Math.floor(bucket.tokens),
    };
  }

  // If we're rate limited, set exponential backoff
  const backoffDuration = bucket.backoffUntil ? 
    Math.min(60000, (now - bucket.backoffUntil) * 2) : // Double the previous backoff
    5000; // Initial backoff of 5 seconds

  bucket.backoffUntil = now + backoffDuration;
  
  return {
    isLimited: true,
    remainingTokens: 0,
    retryAfter: Math.ceil(backoffDuration / 1000),
  };
}

export function getCachedResponse(key: string) {
  return searchCache.get(key);
}

export function setCachedResponse(key: string, value: Record<string, unknown>) {
  searchCache.set(key, value);
}

export function resetRateLimit(key: 'search' | 'suggest') {
  const limiter = rateLimiters[key];
  const bucket = limiter.buckets.get(key);
  if (bucket) {
    bucket.tokens = limiter.maxTokens;
    bucket.lastRefill = Date.now();
    delete bucket.backoffUntil;
  }
}
