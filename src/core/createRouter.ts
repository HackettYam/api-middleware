import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type {
  HttpMethod,
  MiddlewareFunction,
  NextApiHandler,
  RouteDefinition,
  RouterConfig,
} from './types';

/**
 * Creates a router for REST APIs in Next.js
 * @param config Custom router configuration
 * @returns Router object with methods to define routes
 */
export function createRouter(config: RouterConfig = {}) {
  const routes: RouteDefinition[] = [];
  const prefix = config.prefix ?? '';
  const globalMiddlewares = config.middlewares ?? [];

  // Functions to define routes for different HTTP methods
  const router = {
    get: (path: string, handler: NextApiHandler) => {
      routes.push({ path: `${prefix}${path}`, method: 'GET', handler, middlewares: [] });
      return router;
    },
    post: (path: string, handler: NextApiHandler) => {
      routes.push({ path: `${prefix}${path}`, method: 'POST', handler, middlewares: [] });
      return router;
    },
    put: (path: string, handler: NextApiHandler) => {
      routes.push({ path: `${prefix}${path}`, method: 'PUT', handler, middlewares: [] });
      return router;
    },
    delete: (path: string, handler: NextApiHandler) => {
      routes.push({ path: `${prefix}${path}`, method: 'DELETE', handler, middlewares: [] });
      return router;
    },
    patch: (path: string, handler: NextApiHandler) => {
      routes.push({ path: `${prefix}${path}`, method: 'PATCH', handler, middlewares: [] });
      return router;
    },
    options: (path: string, handler: NextApiHandler) => {
      routes.push({ path: `${prefix}${path}`, method: 'OPTIONS', handler, middlewares: [] });
      return router;
    },
    head: (path: string, handler: NextApiHandler) => {
      routes.push({ path: `${prefix}${path}`, method: 'HEAD', handler, middlewares: [] });
      return router;
    },

    // Method to add global middleware
    use: (middleware: MiddlewareFunction) => {
      globalMiddlewares.push(middleware);
      return router;
    },

    // Method to add middleware to a specific route
    withMiddleware: (middleware: MiddlewareFunction) => {
      if (routes.length > 0) {
        const lastRoute = routes[routes.length - 1];
        lastRoute.middlewares = [...(lastRoute.middlewares ?? []), middleware];
      }
      return router;
    },

    // Function to handle incoming requests
    handler: async (
      req: NextRequest,
      context: Record<string, unknown> = {}
    ): Promise<NextResponse> => {
      const url = new URL(req.url);
      const pathname = url.pathname;
      const method = req.method as HttpMethod;

      // Find the route that matches the request
      const route = routes.find(r => {
        // Implement route matching (including support for dynamic routes)
        const pathMatch =
          r.path === pathname || (r.path.includes(':') && matchDynamicRoute(r.path, pathname));
        return pathMatch && r.method === method;
      });

      if (!route) {
        return NextResponse.json({ error: 'Not found', path: pathname, method }, { status: 404 });
      }

      // Extract route parameters if there are dynamic routes
      const params = extractRouteParams(route.path, pathname);
      const enhancedContext: Record<string, unknown> = { ...context, params };

      // Apply middlewares (global and route-specific)
      let handler = route.handler;

      // Apply route-specific middlewares (from right to left)
      if (route.middlewares && route.middlewares.length > 0) {
        for (let i = route.middlewares.length - 1; i >= 0; i--) {
          handler = route.middlewares[i](handler);
        }
      }

      // Apply global middlewares (from right to left)
      if (globalMiddlewares.length > 0) {
        for (let i = globalMiddlewares.length - 1; i >= 0; i--) {
          handler = globalMiddlewares[i](handler);
        }
      }

      // Execute the resulting handler
      try {
        return await handler(req, enhancedContext);
      } catch (error) {
        console.error('Router error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    },
  };

  return router;
}

/**
 * Helper function to match dynamic routes
 */
function matchDynamicRoute(routePath: string, pathname: string): boolean {
  const routeParts = routePath.split('/');
  const pathParts = pathname.split('/');

  if (routeParts.length !== pathParts.length) return false;

  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) continue;
    if (routeParts[i] !== pathParts[i]) return false;
  }

  return true;
}

/**
 * Extracts parameters from a dynamic route
 */
function extractRouteParams(routePath: string, pathname: string): Record<string, string> {
  const params: Record<string, string> = {};

  const routeParts = routePath.split('/');
  const pathParts = pathname.split('/');

  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      const paramName = routeParts[i].slice(1);
      params[paramName] = pathParts[i];
    }
  }

  return params;
}
