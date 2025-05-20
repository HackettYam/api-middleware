# @hackettyam/api-middleware

Middleware for creating RESTful APIs in Next.js easily with security best practices and implementation.

## Installation

```bash
pnpm add @hackettyam/api-middleware
```

## Features

- ✅ Advanced middleware system for Next.js App Router
- ✅ Complete REST API router with support for dynamic routes
- ✅ Flexible authentication (Bearer token, JWT, custom)
- ✅ Data validation and sanitization
- ✅ Configurable CORS access control
- ✅ Rate limiting
- ✅ Centralized error handling
- ✅ Standardized response format
- ✅ Fully typed with TypeScript

## Basic Usage

### Create a simple API middleware

```typescript
// app/api/[[...route]]/route.ts
import { NextRequest } from 'next/server';
import { createMiddleware, createRouter, http } from '@hackettyam/api-middleware';

// Create middleware with custom configuration
const apiMiddleware = createMiddleware({
  enableCors: true,
  allowedOrigins: ['https://yourdomain.com'],
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
});

// Create router to manage routes
const router = createRouter({ prefix: '/api' });

// Define routes
router
  .get('/hello', (req: NextRequest) => {
    return http.ok({ message: 'Hello World!' });
  })
  .post('/users', async (req: NextRequest) => {
    const data = await req.json();
    // Logic to create user...
    return http.created({ id: '123', ...data });
  });

// Export handlers for HTTP methods
export const GET = apiMiddleware(router.handler);
export const POST = apiMiddleware(router.handler);
export const PUT = apiMiddleware(router.handler);
export const DELETE = apiMiddleware(router.handler);
```

### Use authentication

```typescript
// app/api/protected/[[...route]]/route.ts
import { NextRequest } from 'next/server';
import { 
  createMiddleware, 
  createRouter, 
  withAuth,
  http 
} from '@hackettyam/api-middleware';

const apiMiddleware = createMiddleware();

// Configure authentication
const authMiddleware = withAuth({
  tokenType: 'Bearer',
  verifyToken: async (token) => {
    // Verify token (with JWT, database, etc.)
    // Return user data if the token is valid
    return { userId: '123', role: 'admin' };
  }
});

const router = createRouter();

// Apply authentication middleware to all routes
router.use(authMiddleware);

router
  .get('/profile', (req: NextRequest, context) => {
    // context.auth contains the authenticated user data
    const { auth } = context;
    return http.ok({ user: auth.data });
  });

export const GET = apiMiddleware(router.handler);
export const POST = apiMiddleware(router.handler);
```

### Data validation

```typescript
import { NextRequest } from 'next/server';
import { 
  createMiddleware, 
  createRouter, 
  withValidation,
  http 
} from '@hackettyam/api-middleware';

const apiMiddleware = createMiddleware();
const router = createRouter();

// Define validation schema
const userSchema = {
  name: { type: 'string', required: true, minLength: 2 },
  email: { type: 'string', required: true, pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/ },
  age: { type: 'number', min: 18 }
};

router
  .post('/register', withValidation(userSchema)((req: NextRequest, context) => {
    // context.validatedData contains the already validated data
    const userData = context.validatedData;
    return http.created({ user: userData });
  }));

export const POST = apiMiddleware(router.handler);
```

### Error handling

```typescript
import { 
  createMiddleware, 
  createRouter, 
  withErrorHandler,
  ApiError 
} from '@hackettyam/api-middleware';

const router = createRouter();

// Configure error handling
const errorHandler = withErrorHandler({
  logger: (error) => {
    // Custom logging logic
    console.error(`[API Error]: ${error.message}`);
  }
});

router
  .get('/items/:id', (req, context) => {
    const { id } = context.params;
    
    // Simulate error
    if (id === '404') {
      throw new ApiError('Item not found', 404);
    }
    
    return { id, name: 'Example item' };
  });

// Apply error handling middleware
export const GET = createMiddleware()(
  errorHandler(router.handler)
);
```

## API Reference

### Core

- `createMiddleware(config)`: Creates an API middleware with custom configuration
- `createRouter(config)`: Creates a router to manage API routes

### Handlers

- `withAuth(options)`: Middleware for authentication
- `withValidation(schema)`: Middleware for data validation
- `withErrorHandler(options)`: Middleware for centralized error handling
- `withRateLimit(options)`: Middleware for rate limiting

### Utilities

- `http`: Methods for standard HTTP responses (ok, created, badRequest, etc.)
- `getQueryParams(req)`: Extracts query parameters
- `getJsonBody(req)`: Extracts JSON data from body
- `getFormData(req)`: Extracts form data

## Documentation

For a more detailed guide on using each module, check the following documents:

- [Quick Start Guide](./docs/quick-start-guide.md)
- [Authentication](./docs/authentication.md)
- [Validation](./docs/validation.md)
- [Error Handling](./docs/error-handling.md)
- [Advanced Error Handling](./docs/advanced-error-handling.md)

## Example Application

This library includes a complete example application that demonstrates its use in a real scenario:

- [Task Application](./examples/todo-app/README.md): A task management application with complete CRUD operations, implemented with Next.js and this library.

To run the example application:

```bash
cd examples/todo-app
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Make sure to add tests for any new functionality or fix.

## License

MIT
