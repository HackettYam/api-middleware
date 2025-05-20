import { NextRequest, NextResponse } from 'next/server';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface MiddlewareConfig {
  basePath?: string;
  defaultHeaders?: Record<string, string>;
  enableCors?: boolean;
  allowedOrigins?: string[];
  enableRateLimiting?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export type NextApiHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

export type MiddlewareFunction = (handler: NextApiHandler) => NextApiHandler;

export interface RouterConfig {
  prefix?: string;
  middlewares?: MiddlewareFunction[];
}

export interface RouteDefinition {
  path: string;
  method: HttpMethod;
  handler: NextApiHandler;
  middlewares?: MiddlewareFunction[];
}
