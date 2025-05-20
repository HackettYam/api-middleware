# Advanced Error Handling

This guide explains the advanced capabilities of the error handling middleware in `@hackettyam/api-middleware` and how to implement a robust error handling system in your APIs.

## Table of Contents

1. [Fundamental concepts](#fundamental-concepts)
2. [Error types](#error-types)
3. [Error middleware](#error-middleware)
4. [Custom errors](#custom-errors)
5. [Error logging](#error-logging)
6. [Practical examples](#practical-examples)
7. [Best practices](#best-practices)

## Fundamental concepts

Error handling in REST APIs should be:

- **Consistent**: Uniform structure of error responses
- **Informative**: Provide useful details to the client
- **Secure**: Do not expose sensitive information
- **Specific**: Appropriate HTTP status codes

## Error types

The library provides several predefined error types:

```typescript
import { ApiError, ValidationError, AuthenticationError, AuthorizationError } from '@hackettyam/api-middleware/errors';
```

| Error Class | HTTP Code | Use Case |
|----------------|-------------|-------------|
| `ApiError` | Configurable | Base error that you can extend |
| `ValidationError` | 400 | Invalid input data |
| `AuthenticationError` | 401 | Invalid or missing credentials |
| `AuthorizationError` | 403 | No permission to access the resource |
| `NotFoundError` | 404 | Requested resource does not exist |

## Error middleware

The error middleware is responsible for capturing any exception thrown during the execution of the request and transforming it into a structured response.

```typescript
import { createRouter, withErrorHandler } from '@hackettyam/api-middleware';

const router = createRouter();

// The error middleware is already applied by default
// but you can customize it:
router.use(withErrorHandler({
  logger: (err, req) => {
    console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.url}:`, err);
  },
  // Custom format for errors 
  formatError: (err, _req) => ({
    error: {
      message: err.message,
      code: err.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }
  })
}));
```

## Custom errors

You can create your own error types by extending `ApiError`:

```typescript
import { ApiError } from '@hackettyam/api-middleware';

export class ResourceExhaustedError extends ApiError {
  constructor(message = 'Resources exhausted') {
    super(message, 429);
    this.name = 'ResourceExhaustedError';
    this.code = 'RESOURCE_EXHAUSTED';
  }
}

// Usage:
throw new ResourceExhaustedError('API quota exceeded');
```

## Error logging

The error middleware can be configured with a logging function to record detailed information:

```typescript
import { withErrorHandler } from '@hackettyam/api-middleware';

const errorLogger = (error, request) => {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = request.url;
  const userId = request.auth?.userId || 'anonymous';
  
  console.error(`[${timestamp}] ${method} ${url} (User: ${userId}) - Error: ${error.message}`);
  
  // You can integrate it with monitoring services like Sentry
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: { url, method, userId }
    });
  }
};

router.use(withErrorHandler({ logger: errorLogger }));
```

## Practical examples

### Error handling in an authentication route

```typescript
router.post('/api/auth/login', withValidation(loginSchema), async ({ data }) => {
  try {
    const { email, password } = data;
    const user = await getUserByEmail(email);
    
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }
    
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }
    
    // Generate token...
    return http.ok({ token });
  } catch (error) {
    // The middleware will automatically capture the error
    throw error;
  }
});
```

### Resource access control

```typescript
router.get('/api/users/:id/profile', withAuth(), async (req, ctx) => {
  const { id } = req.params;
  const currentUserId = ctx.auth.userId;
  
  // Verify if the user can access the profile
  if (id !== currentUserId && !ctx.auth.isAdmin) {
    throw new AuthorizationError('You do not have permission to view this profile');
  }
  
  const profile = await getUserProfile(id);
  
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }
  
  return http.ok({ profile });
});
```

## Best practices

1. **Specificity**: Use the most specific error type for each situation.
2. **Clear messages**: Provide descriptive error messages but without exposing sensitive information.
3. **Error codes**: Define consistent error codes to facilitate handling on the client side.
4. **Strategic logging**: Record enough details to debug problems without compromising sensitive data.
5. **Early validation**: Validate input data at the beginning of the flow to avoid errors in later stages.
6. **Consistent errors**: Maintain a uniform error response structure throughout the API.

---

With this guide, you will have a complete and professional error handling system that will significantly improve the quality and maintainability of your APIs.
