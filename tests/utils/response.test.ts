import { describe, it, expect, vi } from 'vitest';
import { success, error, http } from '../../src/utils/response';

// Mock for NextResponse since we are in a test environment
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, options) => {
        return {
          headers: new Map(),
          body,
          status: options?.status || 200,
          set: function(key: string, value: string) {
            this.headers.set(key, value);
            return this;
          }
        };
      })
    }
  };
});

describe('Response Utilities', () => {
  describe('success()', () => {
    it('should create a successful response with data', () => {
      const data = { name: 'Test' };
      const response = success(data);
      
      expect(response.body).toEqual({
        success: true,
        data
      });
      expect(response.status).toBe(200);
    });

    it('should create a successful response with custom status', () => {
      const response = success({ id: 123 }, { status: 201 });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('error()', () => {
    it('should create an error response with message', () => {
      const message = 'Test error';
      const response = error(message);
      
      expect(response.body).toEqual({
        success: false,
        error: message
      });
      expect(response.status).toBe(400);
    });

    it('should create an error response with custom status', () => {
      const response = error('Unauthorized', { status: 401 });
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Unauthorized'
      });
    });
  });

  describe('http methods', () => {
    it('http.ok should return a 200 response', () => {
      const response = http.ok({ test: true });
      expect(response.status).toBe(200);
    });

    it('http.created should return a 201 response', () => {
      const response = http.created({ id: 1 });
      expect(response.status).toBe(201);
    });

    it('http.badRequest should return a 400 response', () => {
      const response = http.badRequest('Invalid data');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid data'
      });
    });

    it('http.unauthorized should return a 401 response', () => {
      const response = http.unauthorized();
      expect(response.status).toBe(401);
    });

    it('http.notFound should return a 404 response', () => {
      const response = http.notFound('Resource not found');
      expect(response.status).toBe(404);
    });
  });
});
