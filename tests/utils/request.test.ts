import { describe, it, expect } from 'vitest';
import { getQueryParams, parseQueryParams, getHeader, contentType } from '../../src/utils/request';

// Mock for NextRequest since we are in a test environment
class MockHeaders {
  private headers: Record<string, string> = {};
  
  constructor(headers: Record<string, string> = {}) {
    this.headers = headers;
  }
  
  get(name: string): string | null {
    return this.headers[name.toLowerCase()] || null;
  }
}

class MockNextRequest {
  public readonly url: string;
  public readonly headers: MockHeaders;
  public readonly method: string;
  
  constructor(url: string, method = 'GET', headers = {}) {
    this.url = url;
    this.method = method;
    this.headers = new MockHeaders(headers);
  }
  
  clone(): MockNextRequest {
    return new MockNextRequest(this.url, this.method, {});
  }
  
  async json(): Promise<any> {
    return { mock: 'data' };
  }
  
  async formData(): Promise<FormData> {
    const formData = new FormData();
    formData.append('field', 'value');
    return formData;
  }
}

describe('Request Utilities', () => {
  describe('getQueryParams()', () => {
    it('should extract query parameters correctly', () => {
      const req = new MockNextRequest('https://example.com/api?foo=bar&num=123') as any;
      const params = getQueryParams(req);
      
      expect(params).toEqual({
        foo: 'bar',
        num: '123'
      });
    });
    
    it('should return an empty object if there are no parameters', () => {
      const req = new MockNextRequest('https://example.com/api') as any;
      const params = getQueryParams(req);
      
      expect(params).toEqual({});
    });
  });
  
  describe('parseQueryParams()', () => {
    it('should convert parameter types correctly', () => {
      const req = new MockNextRequest('https://example.com/api?str=text&num=123&bool=true&arr=a,b,c') as any;
      const schema = {
        str: 'string',
        num: 'number',
        bool: 'boolean',
        arr: 'array',
        missing: 'string'
      };
      
      const parsed = parseQueryParams(req, schema as any);
      
      expect(parsed).toEqual({
        str: 'text',
        num: 123,
        bool: true,
        arr: ['a', 'b', 'c']
      });
      expect(parsed).not.toHaveProperty('missing');
    });
  });
  
  describe('getHeader()', () => {
    it('should get an existing header', () => {
      const req = new MockNextRequest('https://example.com', 'GET', {
        'content-type': 'application/json',
        'authorization': 'Bearer token123'
      }) as any;
      
      expect(getHeader(req, 'content-type')).toBe('application/json');
      expect(getHeader(req, 'authorization')).toBe('Bearer token123');
    });
    
    it('should return null for a non-existent header', () => {
      const req = new MockNextRequest('https://example.com') as any;
      expect(getHeader(req, 'x-non-existent')).toBeNull();
    });
  });
  
  describe('contentType', () => {
    it('should correctly detect JSON content type', () => {
      const req = new MockNextRequest('https://example.com', 'POST', {
        'content-type': 'application/json; charset=utf-8'
      }) as any;
      
      expect(contentType.isJson(req)).toBe(true);
      expect(contentType.isFormData(req)).toBe(false);
      expect(contentType.isUrlEncoded(req)).toBe(false);
    });
    
    it('should correctly detect Form Data content type', () => {
      const req = new MockNextRequest('https://example.com', 'POST', {
        'content-type': 'multipart/form-data; boundary=something'
      }) as any;
      
      expect(contentType.isJson(req)).toBe(false);
      expect(contentType.isFormData(req)).toBe(true);
      expect(contentType.isUrlEncoded(req)).toBe(false);
    });
  });
});
