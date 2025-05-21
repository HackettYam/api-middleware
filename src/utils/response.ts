import { NextResponse } from 'next/server';

/**
 * Options for formatting API responses
 */
export interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Standard response format for APIs
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

/**
 * Creates a successful response with standard format
 * @param data Data to include in the response
 * @param options Additional options (status, headers)
 * @returns Formatted response for Next.js
 */
export function success<T = unknown>(data?: T, options: ResponseOptions = {}): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
  };

  return NextResponse.json(response, {
    status: options.status ?? 200,
    headers: options.headers,
  });
}

/**
 * Creates an error response with standard format
 * @param message Error message
 * @param options Additional options (status, headers)
 * @returns Formatted response for Next.js
 */
export function error(message: string, options: ResponseOptions = {}): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message,
  };

  return NextResponse.json(response, {
    status: options.status ?? 400,
    headers: options.headers,
  });
}

/**
 * Responses for common HTTP codes
 */
export const http = {
  // Successful responses
  ok: <T = unknown>(data?: T, headers?: Record<string, string>) =>
    success(data, { status: 200, headers }),
  created: <T = unknown>(data?: T, headers?: Record<string, string>) =>
    success(data, { status: 201, headers }),
  accepted: <T = unknown>(data?: T, headers?: Record<string, string>) =>
    success(data, { status: 202, headers }),
  noContent: (headers?: Record<string, string>) =>
    NextResponse.json(null, { status: 204, headers }),

  // Error responses
  badRequest: (message = 'Invalid request', headers?: Record<string, string>) =>
    error(message, { status: 400, headers }),
  unauthorized: (message = 'Unauthorized', headers?: Record<string, string>) =>
    error(message, { status: 401, headers }),
  forbidden: (message = 'Access forbidden', headers?: Record<string, string>) =>
    error(message, { status: 403, headers }),
  notFound: (message = 'Not found', headers?: Record<string, string>) =>
    error(message, { status: 404, headers }),
  methodNotAllowed: (message = 'Method not allowed', headers?: Record<string, string>) =>
    error(message, { status: 405, headers }),
  conflict: (message = 'Conflict', headers?: Record<string, string>) =>
    error(message, { status: 409, headers }),
  tooManyRequests: (message = 'Too many requests', headers?: Record<string, string>) =>
    error(message, { status: 429, headers }),
  serverError: (message = 'Internal server error', headers?: Record<string, string>) =>
    error(message, { status: 500, headers }),
};
