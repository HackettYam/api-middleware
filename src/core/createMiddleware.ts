import { NextRequest, NextResponse } from 'next/server';
import { MiddlewareConfig, NextApiHandler } from './types';

const defaultConfig: MiddlewareConfig = {
  basePath: '/api',
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  enableCors: true,
  allowedOrigins: ['*'],
  enableRateLimiting: false
};

/**
 * Creates a middleware for REST APIs in Next.js
 * @param config Custom middleware configuration
 * @returns Middleware function that can be applied to route handlers
 */
export function createMiddleware(config: MiddlewareConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  
  return function withMiddleware(handler: NextApiHandler): NextApiHandler {
    return async function middleware(req: NextRequest, context: any) {
      // Implement CORS if enabled
      if (finalConfig.enableCors) {
        const origin = req.headers.get('origin') || '';
        const isAllowedOrigin = 
          finalConfig.allowedOrigins?.includes('*') || 
          finalConfig.allowedOrigins?.includes(origin);
        
        if (!isAllowedOrigin) {
          return NextResponse.json(
            { error: 'CORS origin not allowed' },
            { status: 403 }
          );
        }
      }
      
      // Implement rate limiting if enabled
      if (finalConfig.enableRateLimiting && finalConfig.rateLimit) {
        // Here would go the rate limiting logic
        // (Would require external storage in a real implementation)
      }
      
      try {
        // Execute the original handler
        const response = await handler(req, context);
        
        // Add default headers to the response
        if (finalConfig.defaultHeaders) {
          Object.entries(finalConfig.defaultHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        }
        
        // Add CORS headers if enabled
        if (finalConfig.enableCors) {
          const origin = req.headers.get('origin') || '';
          if (finalConfig.allowedOrigins?.includes('*')) {
            response.headers.set('Access-Control-Allow-Origin', '*');
          } else if (origin && finalConfig.allowedOrigins?.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
          }
          response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }
        
        return response;
      } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  };
}
