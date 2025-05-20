# Authentication Guide - @hackettyam/api-middleware

This guide explains how to implement authentication in your REST APIs using our middleware library for Next.js.

## Supported authentication types

- **Bearer Token**: Token-based authentication in the Authorization header
- **JWT**: JWT token verification
- **API Key**: Authentication using API keys in custom headers
- **Custom**: Implement your own verification method

## Basic authentication with Bearer Token

```typescript
// app/api/auth/[[...route]]/route.ts
import { NextRequest } from 'next/server';
import { 
  createMiddleware, 
  createRouter, 
  withAuth,
  http 
} from '@hackettyam/api-middleware';

const apiMiddleware = createMiddleware();
const router = createRouter();

// Configure authentication middleware
const authMiddleware = withAuth({
  // Type of token to verify (default is 'Bearer')
  tokenType: 'Bearer',
  
  // Function to verify tokens
  verifyToken: async (token: string) => {
    // Here you would implement real verification against your database or service
    if (token === 'my-secret-token') {
      // You can return user data if verification is successful
      return { userId: '123', role: 'admin' };
    }
    // Returning false rejects authentication
    return false;
  }
});

// Public route (no authentication)
router.get('/public', (req: NextRequest) => {
  return http.ok({ message: 'Public endpoint' });
});

// Protected route (with authentication)
router.get('/protected', authMiddleware((req: NextRequest, context) => {
  // context.auth contains authenticated user data
  const userData = context.auth.data;
  
  return http.ok({ 
    message: 'Access authorized', 
    user: userData 
  });
}));

// Export handlers for Next.js App Router
export const GET = apiMiddleware(router.handler);
export const POST = apiMiddleware(router.handler);
```

## Authentication with JWT

```typescript
// Ejemplo con jsonwebtoken
import jwt from 'jsonwebtoken';
import { withAuth } from '@hackettyam/api-middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto';

const jwtAuthMiddleware = withAuth({
  tokenType: 'Bearer',
  verifyToken: async (token: string) => {
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded; // Return the decoded data
    } catch (error) {
      console.error('Error verifying JWT:', error);
      return false;
    }
  }
});
```

## Authentication with API Key

```typescript
const apiKeyMiddleware = withAuth({
  // Use a custom header
  tokenHeader: 'X-API-Key',
  tokenType: 'Custom',
  
  verifyToken: async (apiKey: string) => {
    // Verify the API Key against a database or allowed list
    const validApiKeys = ['key1', 'key2', 'key3'];
    
    if (validApiKeys.includes(apiKey)) {
      return true;
    }
    return false;
  }
});
```

## Apply global authentication to all routes

If you want to protect all routes by default, you can apply the middleware at the router level:

```typescript
const router = createRouter();

// Apply authentication to all routes
router.use(authMiddleware);

// Define routes (all will require authentication)
router
  .get('/profile', (req, context) => {
    return http.ok({ user: context.auth.data });
  })
  .get('/settings', (req, context) => {
    return http.ok({ settings: { theme: 'dark' } });
  });
```

## Security best practices

1. **Secure storage**: Never store secrets or keys in your code. Use environment variables.
2. **HTTPS**: Ensure your API is always accessible only via HTTPS.
3. **Token expiration**: Implement reasonable expiration times for your tokens.
4. **Refresh tokens**: For long-duration sessions, implement a refresh token system.
5. **Revocation**: Maintain a list of revoked tokens or implement a mechanism to invalidate tokens.
6. **Rate limiting**: Combine authentication with rate limits to prevent brute force attacks.
