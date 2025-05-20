import { NextRequest, NextResponse } from 'next/server';
import { NextApiHandler } from '../core/types';

/**
 * Options for rate limiting middleware
 */
export interface RateLimitOptions {
  /**
   * Time window in milliseconds
   */
  windowMs?: number;
  /**
   * Maximum number of requests allowed in the time window
   */
  max?: number;
  /**
   * Function to generate the key that identifies the client
   */
  keyGenerator?: (req: NextRequest) => string;
  /**
   * Function to store request counters
   * In a real implementation, this should use Redis or another external store
   */
  store?: RateLimitStore;
  /**
   * Message to display when the limit is exceeded
   */
  message?: string;
  /**
   * Headers to include in the response
   */
  headers?: boolean;
}

/**
 * Interface for the rate limit counter store
 */
export interface RateLimitStore {
  /**
   * Increments the counter for a key
   */
  increment(key: string): Promise<RateLimitInfo>;
  /**
   * Removes a key from the store
   */
  reset(key: string): Promise<void>;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  /**
   * Total number of requests in the current window
   */
  totalHits: number;
  /**
   * Time remaining in ms until the window resets
   */
  timeRemaining: number;
}

// In-memory implementation (for development only)
// For production, implement with Redis or another external store
class MemoryStore implements RateLimitStore {
  private hits: Map<string, { count: number; resetTime: number }>;
  private readonly windowMs: number;

  constructor(windowMs: number) {
    this.hits = new Map();
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const record = this.hits.get(key);
    
    if (!record || now > record.resetTime) {
      this.hits.set(key, { count: 1, resetTime: now + this.windowMs });
      return { totalHits: 1, timeRemaining: this.windowMs };
    }
    
    const newCount = record.count + 1;
    this.hits.set(key, { count: newCount, resetTime: record.resetTime });
    
    return {
      totalHits: newCount,
      timeRemaining: record.resetTime - now
    };
  }

  async reset(key: string): Promise<void> {
    this.hits.delete(key);
  }
}

// Default options
const defaultOptions: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    return `${ip}:${req.method}:${new URL(req.url).pathname}`;
  },
  message: 'Too many requests, please try again later',
  headers: true
};

/**
 * Rate limiting middleware for API routes
 * @param options Configuration options
 * @returns Rate limiting middleware
 */
export function withRateLimit(options: RateLimitOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  const windowMs = opts.windowMs || defaultOptions.windowMs!;
  
  // Create counter store
  const store = opts.store || new MemoryStore(windowMs);
  
  return function rateLimitMiddleware(handler: NextApiHandler): NextApiHandler {
    return async function (req: NextRequest, context: any) {
      // Generate unique key for the client
      const key = opts.keyGenerator!(req);
      
      try {
        // Increment the counter for this key
        const limiterInfo = await store.increment(key);
        
        // Add rate limiting headers
        const headers: Record<string, string> = {};
        if (opts.headers) {
          headers['X-RateLimit-Limit'] = String(opts.max);
          headers['X-RateLimit-Remaining'] = String(Math.max(0, (opts.max || 0) - limiterInfo.totalHits));
          headers['X-RateLimit-Reset'] = String(Math.ceil(limiterInfo.timeRemaining / 1000));
        }
        
        // Check if the limit has been exceeded
        if (limiterInfo.totalHits > (opts.max || Infinity)) {
          return NextResponse.json(
            { error: opts.message },
            { 
              status: 429,
              headers
            }
          );
        }
        
        // Continue with the handler
        const response = await handler(req, context);
        
        // Add headers to the response
        if (opts.headers) {
          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        }
        
        return response;
      } catch (error) {
        console.error('Rate limit error:', error);
        return handler(req, context);
      }
    };
  };
}
