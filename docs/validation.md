# Data Validation Guide - @hackettyam/api-middleware

This guide explains how to implement data validation in your REST APIs using our middleware library for Next.js.

## Introduction

Data validation is a fundamental part of ensuring the security and consistency of your API. The `withValidation` middleware allows you to validate input data before it reaches your controllers.

## Basic validation with schemas

```typescript
// app/api/users/[[...route]]/route.ts
import { NextRequest } from 'next/server';
import { 
  createMiddleware, 
  createRouter, 
  withValidation,
  http 
} from '@hackettyam/api-middleware';

const apiMiddleware = createMiddleware();
const router = createRouter();

// Define a validation schema
const userSchema = {
  name: { type: 'string', required: true, minLength: 2 },
  email: { 
    type: 'string', 
    required: true,
    pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    patternMessage: 'Invalid email'
  },
  age: { type: 'number', min: 18, max: 120 },
  roles: { type: 'array', minLength: 1 }
};

// Apply validation to a POST route
router.post('/users', withValidation(userSchema)((req: NextRequest, context) => {
  // If the request reaches here, the data has already been validated
  const userData = context.validatedData;
  
  // Process validated data...
  return http.created({ 
    message: 'User created successfully',
    user: {
      id: `user-${Date.now()}`,
      ...userData
    }
  });
}));

// Export handlers for Next.js App Router
export const POST = apiMiddleware(router.handler);
```

## Validation with custom functions

If you need more complex validation logic, you can use custom functions:

```typescript
// Custom validation as a function
const validateUser = (data: any) => {
  const errors: Record<string, string> = {};
  let valid = true;
  
  // Validate name
  if (!data.name || data.name.length < 2) {
    errors.name = 'Name is required and must be at least 2 characters';
    valid = false;
  }
  
  // Validate email with a regular expression
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'Invalid email';
    valid = false;
  }
  
  // Validate password and confirmation
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
    valid = false;
  }
  
  return { valid, errors };
};

// Apply custom validation
router.post('/register', withValidation(validateUser)((req, context) => {
  // Process registration...
}));
```

## Supported validation types

The basic validation schema supports the following rules:

| Rule | Type | Description |
|------|------|-------------|
| `required` | boolean | Required field |
| `type` | string | Data type ('string', 'number', 'boolean', 'array', 'object') |
| `minLength` | number | Minimum length for strings and arrays |
| `maxLength` | number | Maximum length for strings and arrays |
| `min` | number | Minimum value for numbers |
| `max` | number | Maximum value for numbers |
| `pattern` | RegExp | Regular expression to validate strings |
| `patternMessage` | string | Custom message for pattern errors |

## Validation with external libraries

For more complex cases, it is recommended to integrate specialized validation libraries such as Zod, Yup, or Joi:

```typescript
import { z } from 'zod';
import { withValidation } from '@hackettyam/api-middleware';

// Define schema with Zod
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  roles: z.array(z.string()).min(1)
});

// Validation function using Zod
const validateWithZod = (data: any) => {
  try {
    userSchema.parse(data);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false,
      errors: error.formErrors?.fieldErrors || error.errors 
    };
  }
};

// Apply validation with Zod
router.post('/users', withValidation(validateWithZod)((req, context) => {
  // Procesar datos validados...
}));
```

## Validation error handling

By default, the validation middleware responds with a 400 (Bad Request) status code when data is invalid. The response includes details about the errors:

```json
{
  "success": false,
  "error": "Invalid request data",
  "details": {
    "name": "The name field is required",
    "email": "Invalid email"
  }
}
```

## Best practices

1. **Complete validation**: Validate all input fields, not just the required ones
2. **Sanitization**: Consider sanitizing data after validating it to prevent injections
3. **Clear messages**: Provide descriptive error messages to help clients
4. **Layer validation**: Don't rely only on client validation; always validate on the server
