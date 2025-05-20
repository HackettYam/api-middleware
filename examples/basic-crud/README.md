# Example Application: Todo App

This application demonstrates the use of `@hackettyam/api-middleware` to implement a RESTful API in Next.js.

## Features

* Complete CRUD operations for tasks
* Input data validation
* Centralized error handling
* Real-time API status visualization
* Task filtering by status

## Project Structure

```
todo-app/
├── app/
│   ├── api/
│   │   └── tasks/
│   │       ├── [id]/
│   │       │   └── route.ts      # Individual task handling (GET, PUT, DELETE)
│   │       └── route.ts          # Task collection handling (GET, POST)
│   ├── layout.tsx                # Main layout (Server Component)
│   └── page.tsx                  # Main page with tasks UI (Client Component)
├── lib/
│   ├── context/
│   │   └── TaskContext.tsx       # React Context for task management
│   ├── providers.tsx             # Context providers (dynamically loaded)
│   ├── models.ts                 # Type definitions and schemas
│   └── store.ts                  # Store simulator for tasks
├── package.json
├── tailwind.config.js            # Tailwind CSS configuration
└── postcss.config.js             # PostCSS configuration
```

## Application Architecture

### Context Pattern with Client-Server Separation

This application implements a modern architecture using React Context with client-server separation:

1. **Server Components** (by default in Next.js App Router)
   - `app/layout.tsx`: Server component for the main layout
   - `app/api/tasks/route.ts`: API endpoints implemented as Server Components

2. **Client Components** (marked with `'use client'`)
   - `lib/context/TaskContext.tsx`: React Context for managing task state
   - `app/page.tsx`: Application UI that consumes the context

3. **Dynamic Loading of Client Components**
   - `lib/providers.tsx`: Loads the TaskProvider using `dynamic` with `ssr: false` to avoid hydration errors
   
### Data Flow Pattern

```
UI (page.tsx) ↔ React Context (TaskContext) ↔ API Routes (api/tasks) ↔ @hackettyam/api-middleware
```

## Middleware Implementation

### 1. API Routes

The API endpoints use the router and middlewares from `@hackettyam/api-middleware`:

**`app/api/tasks/route.ts`** - Usage example:

```typescript
import { createRouter } from '@hackettyam/api-middleware/core';
import { withValidation } from '@hackettyam/api-middleware/handlers';
import { http } from '@hackettyam/api-middleware/utils';

// Create a router for the API
const router = createRouter();

// Define routes with validation
router.get('/api/tasks', async () => {
  // Get tasks...
  return http.ok({ tasks });
});

router.post('/api/tasks', withValidation(createTaskSchema), async ({ data }) => {
  // Create task with validated data
  return http.created({ task: newTask });
});

// Export handlers for HTTP methods
export const GET = router.createHandler();
export const POST = router.createHandler();
```

### 2. Data Validation

The library allows validating input data using schemas:

```typescript
import { z } from 'zod';

// Validation schema
const createTaskSchema = z.object({
  title: z.string().min(1).max(100),
});
```

### 3. Error Handling

The error handling middleware captures exceptions and transforms them into coherent responses:

```typescript
// Errors are automatically captured and formatted
try {
  // Logic that might fail
} catch (error) {
  // Errors are handled by the middleware and return:
  // Status: 400-500 depending on the type of error
  // Body: { error: { message, code, details } }
}
```

## How to Run

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Main Demonstration Points

This application demonstrates:

1. **Middleware Configuration** - How to configure and apply middlewares to specific routes
2. **Data Validation** - Using schemas to validate input data
3. **Error Handling** - Consistent capturing and formatting of errors
4. **Standardized Responses** - Coherent format for all responses
5. **Reactive UI** - Integration with a React Context based frontend
6. **Modern Architecture** - Implementation of client-server patterns in Next.js App Router
7. **State Management** - Using React Context to manage application state
