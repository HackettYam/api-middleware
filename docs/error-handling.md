# Error Handling Guide - @hackettyam/api-middleware

This guide explains how to implement effective error handling in your REST APIs using our middleware library for Next.js.

## Introduction

Proper error handling is essential for creating robust and user-friendly APIs. Our library provides tools to handle errors consistently and safely.

## Error handling middleware

The `withErrorHandler` middleware allows you to capture and process errors centrally:

```typescript
// app/api/[[...route]]/route.ts
import { NextRequest } from 'next/server';
import { 
  createMiddleware, 
  createRouter, 
  withErrorHandler,
  ApiError,
  http 
} from '@hackettyam/api-middleware';

const apiMiddleware = createMiddleware();

// Configure error handling middleware
const errorHandler = withErrorHandler({
  // Determines whether to show full error details
  isProduction: process.env.NODE_ENV === 'production',
  
  // Custom function for logging errors
  logger: (error) => {
    console.error(`[API Error ${new Date().toISOString()}]:`, error);
    
    // Here you could integrate with monitoring services like Sentry
    // sendToMonitoring(error);
  }
});

const router = createRouter();

// Route that could generate errors
router.get('/items/:id', (req: NextRequest, context) => {
  const { id } = context.params;
  
  // Simulate an error
  if (id === 'error') {
    throw new Error('Unhandled internal error');
  }
  
  // Simulate a controlled API error
  if (id === 'not-found') {
    throw new ApiError('Item not found', 404);
  }
  
  if (id === 'forbidden') {
    throw new ApiError('Access forbidden to resource', 403);
  }
  
  // Normal response
  return http.ok({ id, name: 'Example item' });
});

// Apply error handling middleware
export const GET = apiMiddleware(errorHandler(router.handler));
export const POST = apiMiddleware(errorHandler(router.handler));
```

## The ApiError class

For controlled errors, you can use the `ApiError` class which allows you to specify the HTTP status code and additional details:

```typescript
import { ApiError } from '@hackettyam/api-middleware';

// Basic error (status code 500 by default)
throw new ApiError('Error message');

// Error with custom status code
throw new ApiError('Resource not found', 404);

// Error with additional details
throw new ApiError('Validation failed', 400, {
  field: 'email',
  reason: 'invalid_format'
});
```

## Custom error formatting

You can customize how errors are formatted before sending them to the client:

```typescript
const errorHandler = withErrorHandler({
  errorFormatter: (error) => {
    // Determine the status code
    let status = 500;
    if (error instanceof ApiError) {
      status = error.status;
    } else if (error.code === 'P2025') {
      // Example: map specific Prisma errors
      status = 404;
    }
    
    // Format response body
    return {
      status,
      body: {
        success: false,
        error: error.message,
        code: error.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      }
    };
  }
});
```

## Error handling by type

The `withErrorHandler` middleware handles different types of errors:

1. **Controlled errors (`ApiError`)**: They are sent with the specified status code and message
2. **Validation errors**: Typically converted to 400 Bad Request responses
3. **Unhandled errors**: Converted to 500 Internal Server Error responses
4. **Database errors**: Can be mapped to specific codes using the `errorFormatter`

## Standard error responses

By default, error responses follow this format:

```json
{
  "success": false,
  "error": "Descriptive error message",
  "details": {
    // Optional additional information
  }
}
```

## Best practices

1. **Descriptive yet secure errors**: Provide useful error messages, but avoid exposing technical details or sensitive information in production
2. **Appropriate status codes**: Use the appropriate HTTP codes for each type of error
3. **Consistency**: Maintain a consistent format for all error responses
4. **Logging**: Log all errors with sufficient context for debugging
5. **Monitoring**: Integrate with monitoring tools to detect issues in production

## Common status codes

| Code | Description | Typical usage |
|--------|-------------|------------|
| 400 | Bad Request | Invalid or malformed input data |
| 401 | Unauthorized | Required or invalid authentication |
| 403 | Forbidden | No permission to access the resource |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Conflict with current state (e.g., duplicate) |
| 422 | Unprocessable Entity | Valid data but semantically incorrect |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unhandled server error |
