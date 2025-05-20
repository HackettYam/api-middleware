# Best Practices for Next.js and @hackettyam/api-middleware

This document describes best practices for using `@hackettyam/api-middleware` in Next.js applications, especially with the App Router and Server/Client Components architecture.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [State Management with React Context](#state-management-with-react-context)
3. [Dynamic Loading of Client Components](#dynamic-loading-of-client-components)
4. [API Response Typing](#api-response-typing)
5. [Error Handling](#error-handling)

## Component Architecture

In Next.js App Router, components are Server Components by default. This means they render on the server and cannot use React features like hooks or context.

### Recommended Pattern

1. **Separation of Server and Client Components**:

```
app/
├── layout.tsx           # Server Component
└── page.tsx             # Client Component ('use client')

lib/
├── providers.tsx        # Client Component ('use client')
└── context/
    └── ApiContext.tsx   # Client Component ('use client')
```

2. **Using the `'use client'` directive**:

```tsx
// In any file that needs to use React hooks or context
'use client';

import { useState, useEffect } from 'react';
// ...rest of the code
```

3. **Composition of Server and Client Components**:

```tsx
// layout.tsx (Server Component)
import { Providers } from '../lib/providers';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## State Management with React Context

To manage application state and communicate with APIs implemented with `@hackettyam/api-middleware`, we recommend using React Context.

### Context Provider Implementation

```tsx
// lib/context/ApiContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';

// 1. Define the context type
interface ApiContextType {
  // State and methods
}

// 2. Create the context
const ApiContext = createContext<ApiContextType | undefined>(undefined);

// 3. Implement the Provider
export function ApiProvider({ children }) {
  // Implementation of state and methods
  
  return (
    <ApiContext.Provider value={/* context value */}>
      {children}
    </ApiContext.Provider>
  );
}

// 4. Custom hook to access the context
export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
```

### Usage in Components

```tsx
// In any client component
'use client';

import { useApi } from '../lib/context/ApiContext';

export default function MyComponent() {
  const { data, loading, error, fetchData } = useApi();
  
  // Use context data and methods
}
```

## Dynamic Loading of Client Components

To avoid hydration errors and optimize performance, we recommend loading Client Components dynamically when used in Server Components.

### Dynamic Loading Implementation

```tsx
// lib/providers.tsx
'use client';

import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';

// Load provider dynamically with SSR disabled
const ApiProvider = dynamic(() => import('./context/ApiContext').then(mod => mod.ApiProvider), { 
  ssr: false 
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApiProvider>
        {children}
      </ApiProvider>
    </Suspense>
  );
}
```

## API Response Typing

To improve type safety between the frontend and APIs implemented with `@hackettyam/api-middleware`, we recommend defining interfaces for API responses.

### Response Type Definitions

```tsx
// lib/types/api.ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: {
    message: string;
    code: string;
  };
}

export interface UsersApiResponse {
  data: {
    users: User[];
  };
  success: boolean;
}
```

### Usage in API Calls

```tsx
async function fetchUsers() {
  const response = await fetch('/api/users');
  const result = (await response.json()) as UsersApiResponse;
  
  if (result.success) {
    return result.data.users;
  } else {
    throw new Error(result.error?.message || 'Unknown error');
  }
}
```

## Error Handling

It is important to implement consistent error handling on both server and client sides.

### On the Server (API Routes)

```tsx
// In an API Route with @hackettyam/api-middleware
import { ApiError, withErrorHandling } from '@hackettyam/api-middleware';

// Error handling middleware
router.use(withErrorHandling({
  logger: (error, request) => {
    // Log the error
    console.error(`[API Error]: ${error.message}`);
  },
  formatError: (error) => {
    // Format the error
    return {
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      success: false
    };
  }
}));
```

### On the Client (React Context)

```tsx
// In the ApiContext
async function fetchData() {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Unknown error');
    }
    
    setData(result.data);
  } catch (err) {
    setError(err instanceof Error ? err.message : String(err));
  } finally {
    setLoading(false);
  }
}
```

---

By following these best practices, you can create Next.js applications with `@hackettyam/api-middleware` that are robust, type-safe, and take full advantage of Server and Client Components capabilities.
