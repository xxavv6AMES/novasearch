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
    public data?: unknown
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
      
      // Add timeout to fetch to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        if (response.status === 429) {
          // If we get a 429, we'll wait longer before the next attempt
          const retryAfter = parseInt(response.headers.get('retry-after') || '5');
          console.log(`Rate limited by API, waiting ${retryAfter} seconds before retry`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`API error: ${response.status} - ${errorBody}`);
          throw new ApiError(
            `API request failed with status ${response.status}: ${errorBody}`,
            response.status,
            errorBody
          );
        }
        
        return response;      } catch (error: unknown) {
        clearTimeout(timeoutId);
        const fetchError = error as Error;
        if (fetchError && fetchError.name === 'AbortError') {
          console.error('API request timed out');
          throw new ApiError('Request timed out', 408);
        }
        throw error;
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff: wait 2^attempt seconds before retrying
        const backoffTime = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${backoffTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }
  
  console.error('All retry attempts failed');
  throw lastError || new Error('API request failed after maximum retries');
}
