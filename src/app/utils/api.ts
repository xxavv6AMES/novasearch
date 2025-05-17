import { searchLimiter, suggestionsLimiter } from './rateLimiter';

type ApiOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchWithRateLimiting(
  url: string,
  options: ApiOptions = {},
  isSearchRequest: boolean = true,
  maxRetries: number = 3
): Promise<Response> {
  const limiter = isSearchRequest ? searchLimiter : suggestionsLimiter;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wait for a rate limiting token
      await limiter.waitForToken();
      
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // If we get a 429, we'll wait longer before the next attempt
        const retryAfter = parseInt(response.headers.get('retry-after') || '5');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      if (!response.ok) {
        throw new ApiError(
          `API request failed with status ${response.status}`,
          response.status,
          await response.json().catch(() => null)
        );
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        // Exponential backoff: wait 2^attempt seconds before retrying
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError || new Error('API request failed after maximum retries');
}
