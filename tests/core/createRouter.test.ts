import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRouter } from '../../src/core/createRouter';
import { NextResponse } from 'next/server';

// Mock for NextResponse
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, options) => {
        return {
          headers: new Map(),
          body,
          status: options?.status || 200
        };
      })
    }
  };
});

describe('Router API', () => {
  let mockRequest: any;
  
  beforeEach(() => {
    // Reset mocks between tests
    vi.clearAllMocks();
    
    // Base mock for NextRequest
    mockRequest = {
      method: 'GET',
      url: 'https://example.com/api/test',
      headers: {
        get: vi.fn().mockReturnValue(null)
      }
    };
  });
  
  describe('Basic Routes', () => {
    it('should handle a GET route correctly', async () => {
      const router = createRouter();
      
      // Define a test route
      router.get('/api/test', () => {
        return {
          status: 200,
          body: { message: 'Test successful' },
          headers: new Map()
        } as unknown as NextResponse;
      });
      
      // Execute the handler
      const response = await router.handler(mockRequest);
      
      // Verifications
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Test successful' });
    });
    
    it('should return 404 for routes not found', async () => {
      const router = createRouter();
      mockRequest.url = 'https://example.com/api/no-existe';
      
      // Execute the handler without defining any route
      const response = await router.handler(mockRequest);
      
      // Verifications
      expect(response).toBeDefined();
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not found');
    });
    
    it('should handle different HTTP methods', async () => {
      const router = createRouter();
      
      // Update the URL for this specific test
      mockRequest.url = 'https://example.com/api/resource';
      
      // Define multiple routes with different methods
      router.get('/api/resource', () => ({
        status: 200,
        body: { action: 'get' },
        headers: new Map()
      } as unknown as NextResponse));
      
      router.post('/api/resource', () => ({
        status: 201,
        body: { action: 'post' },
        headers: new Map()
      } as unknown as NextResponse));
      
      // Test GET
      mockRequest.method = 'GET';
      const getResponse = await router.handler(mockRequest);
      expect(getResponse.body).toEqual({ action: 'get' });
      
      // Test POST
      mockRequest.method = 'POST';
      const postResponse = await router.handler(mockRequest);
      expect(postResponse.body).toEqual({ action: 'post' });
    });
  });
  
  describe('Middleware and advanced routes', () => {
    it('should apply global middleware to all routes', async () => {
      const middlewareSpy = vi.fn((handler) => {
        return async (req: any, ctx: any) => {
          ctx.middlewareCalled = true;
          return handler(req, ctx);
        };
      });
      
      const router = createRouter();
      router.use(middlewareSpy);
      
      router.get('/api/test', (req, ctx) => {
        return {
          status: 200,
          body: { middlewareCalled: ctx.middlewareCalled },
          headers: new Map()
        } as unknown as NextResponse;
      });
      
      // Execute the handler
      const response = await router.handler(mockRequest);
      
      // Verifications
      expect(middlewareSpy).toHaveBeenCalled();
      expect(response.body).toEqual({ middlewareCalled: true });
    });
    
    it('should apply specific middleware to a route', async () => {
      const middleware = vi.fn((handler) => {
        return async (req: any, ctx: any) => {
          ctx.routeSpecific = true;
          return handler(req, ctx);
        };
      });
      
      const router = createRouter();
      
      router
        .get('/api/test', (req, ctx) => {
          return {
            status: 200,
            body: { routeSpecific: ctx.routeSpecific },
            headers: new Map()
          } as unknown as NextResponse;
        })
        .withMiddleware(middleware);
      
      // Execute the handler
      const response = await router.handler(mockRequest);
      
      // Verifications
      expect(middleware).toHaveBeenCalled();
      expect(response.body).toEqual({ routeSpecific: true });
    });
    
    it('should capture dynamic route parameters', async () => {
      const router = createRouter();
      
      mockRequest.url = 'https://example.com/api/users/123';
      
      router.get('/api/users/:id', (req, ctx) => {
        return {
          status: 200,
          body: { userId: ctx.params.id },
          headers: new Map()
        } as unknown as NextResponse;
      });
      
      // Execute the handler
      const response = await router.handler(mockRequest);
      
      // Verifications
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ userId: '123' });
    });
  });
});
