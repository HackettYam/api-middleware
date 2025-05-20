# Quick Start Guide - @hackettyam/api-middleware

This guide will help you get started quickly with our middleware library for RESTful APIs in Next.js.

## Installation

```bash
# With pnpm (recommended)
pnpm add @hackettyam/api-middleware

# With npm
npm install @hackettyam/api-middleware

# With yarn
yarn add @hackettyam/api-middleware
```

## Prerequisites

- Next.js 14.0.0 or higher
- React 18.0.0 or higher
- TypeScript (recommended for better development experience)

## Basic example

### 1. Create a basic API Router

```typescript
// app/api/[[...route]]/route.ts
import { NextRequest } from 'next/server';
import { createMiddleware, createRouter, http } from '@hackettyam/api-middleware';

// Create middleware with default configuration
const apiMiddleware = createMiddleware();

// Create router to handle routes
const router = createRouter();

// Define routes
router
  .get('/hello', (req: NextRequest) => {
    return http.ok({ message: 'Hello World!' });
  })
  .get('/users', async (req: NextRequest) => {
    // Simulate data retrieval
    const users = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Mary' }
    ];
    return http.ok({ users });
  });

// Export handlers for Next.js App Router
export const GET = apiMiddleware(router.handler);
export const POST = apiMiddleware(router.handler);
export const PUT = apiMiddleware(router.handler);
export const DELETE = apiMiddleware(router.handler);
```

### 2. Access the API

Once implemented, you can access your endpoints as follows:
- `GET http://localhost:3000/api/hello`
- `GET http://localhost:3000/api/users`

## Middleware configuration

You can customize the middleware behavior with various options:

```typescript
const apiMiddleware = createMiddleware({
  // Configure CORS
  enableCors: true,
  allowedOrigins: ['https://yourdomain.com'],
  
  // Default headers
  defaultHeaders: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'Custom value'
  },
  
  // Base path for the API
  basePath: '/api/v1'
});
```

## Next steps

To learn more about advanced features, check out the following guides:
- [Authentication](./authentication.md)
- [Data validation](./validation.md)
- [Rate Limiting](./rate-limiting.md)
- [Error handling](./error-handling.md)
