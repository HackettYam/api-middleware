import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withAuth } from '../../src/handlers/authentication';
import { NextRequest } from 'next/server';

// Mocks
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

describe('Authentication Middleware', () => {
  // Create mocks for tests
  let mockRequest: NextRequest;
  let mockHandler: any;
  let _nextResponse: any;

  beforeEach(() => {
    // Reset mocks between tests
    vi.clearAllMocks();
    
    // Mock for NextRequest
    mockRequest = {
      headers: {
        get: vi.fn((name) => {
          if (name === 'Authorization') return 'Bearer valid-token';
          return null;
        })
      },
      url: 'https://example.com/api/protected'
    } as unknown as NextRequest;
    
    // Mock for the next handler in the middleware chain
    mockHandler = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Map(),
      body: { success: true }
    });
    
    // Mock for the NextResponse response
    _nextResponse = {
      status: 200,
      headers: new Map(),
      body: {}
    };
  });

  describe('Basic Configuration', () => {
    it('should pass the request to the next handler if token is valid', async () => {
      // Configure authentication middleware with a simple verifier
      const verifyToken = vi.fn().mockReturnValue(true);
      const authMiddleware = withAuth({ verifyToken });
      
      // Apply middleware to the handler
      const wrappedHandler = authMiddleware(mockHandler);
      
      // Execute the handler
      await wrappedHandler(mockRequest, {});
      
      // Verifications
      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should reject the request if there is no authentication token', async () => {
      // Change the mock to simulate missing token
      mockRequest.headers.get = vi.fn().mockReturnValue(null);
      
      const verifyToken = vi.fn();
      const authMiddleware = withAuth({ verifyToken });
      const wrappedHandler = authMiddleware(mockHandler);
      
      const response = await wrappedHandler(mockRequest, {});
      
      // Verifications
      expect(verifyToken).not.toHaveBeenCalled();
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Authorization required');
    });

    it('should reject the request if the token is invalid', async () => {
      // Configure middleware to fail verification
      const verifyToken = vi.fn().mockReturnValue(false);
      const authMiddleware = withAuth({ verifyToken });
      const wrappedHandler = authMiddleware(mockHandler);
      
      const response = await wrappedHandler(mockRequest, {});
      
      // Verifications
      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('Advanced Features', () => {
    it('should add token data to the context', async () => {
      // Simulated user data that would be returned by a JWT
      const tokenData = { userId: '123', role: 'admin' };
      const verifyToken = vi.fn().mockReturnValue(tokenData);
      
      const authMiddleware = withAuth({ verifyToken });
      const wrappedHandler = authMiddleware(mockHandler);
      
      await wrappedHandler(mockRequest, {});
      
      // Verify that the context was passed with authentication data
      expect(mockHandler).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          auth: expect.objectContaining({
            token: 'valid-token',
            data: tokenData
          })
        })
      );
    });

    it('should allow custom authentication headers', async () => {
      // Change the mock to use a custom header
      mockRequest.headers.get = vi.fn((name) => {
        if (name === 'X-API-Key') return 'api-key-value';
        return null;
      });
      
      const verifyToken = vi.fn().mockReturnValue(true);
      const authMiddleware = withAuth({ 
        tokenHeader: 'X-API-Key', 
        tokenType: 'Custom',
        verifyToken 
      });
      
      const wrappedHandler = authMiddleware(mockHandler);
      await wrappedHandler(mockRequest, {});
      
      // Verifications
      expect(verifyToken).toHaveBeenCalledWith('api-key-value');
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });
});
