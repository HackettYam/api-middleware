import { NextRequest } from 'next/server';
import { 
  createMiddleware, 
  createRouter,
  withValidation,
  withErrorHandler,
  ApiError,
  http
} from '@hackettyam/api-middleware';
import { taskStore } from '../../../lib/store';

// Create API middleware with configuration
const apiMiddleware = createMiddleware({
  enableCors: true,
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
});

// Error handling middleware
const errorHandler = withErrorHandler({
  isProduction: process.env.NODE_ENV === 'production',
  logger: (error) => {
    console.error('[API Error]:', error);
  }
});

// Validation schema for creating tasks
const createTaskSchema = {
  title: { type: 'string', required: true, minLength: 3, maxLength: 100 }
};

// Validation schema for updating tasks
// Unused schema, prefixed with _ to satisfy linting
const _updateTaskSchema = {
  title: { type: 'string', minLength: 3, maxLength: 100 },
  completed: { type: 'boolean' }
};

// Create router to manage routes
const router = createRouter();

router
  // Get all tasks
  .get('/api/tasks', async () => {
    try {
      const tasks = await taskStore.findAll();
      return http.ok({ tasks });
    } catch (error) {
      throw new ApiError('Error getting tasks', 500, error);
    }
  })
  
  // Create a new task
  .post('/api/tasks', withValidation(createTaskSchema)(async (req: NextRequest, context) => {
    try {
      const taskData = context.validatedData;
      const newTask = await taskStore.create(taskData);
      
      // Ensure the task has all required fields before returning it
      if (!newTask || typeof newTask.id !== 'string' || typeof newTask.completed !== 'boolean') {
        console.error('Error: The created task does not have the expected structure', newTask);
        throw new ApiError('Error creating task: invalid format', 500, newTask);
      }
      
      return http.created({ task: newTask });
    } catch (err) {
      console.error('Error creating task:', err);
      throw new ApiError('Error creating task', 500, err);
    }
  }));

// Export handlers for HTTP methods
const apiHandler = apiMiddleware(errorHandler(router.handler));
export const GET = apiHandler;
export const POST = apiHandler;
