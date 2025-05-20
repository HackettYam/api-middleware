import { NextRequest } from 'next/server';
import { 
  createMiddleware, 
  createRouter,
  withValidation,
  withErrorHandler,
  ApiError,
  http
} from '@hackettyam/api-middleware';
import { taskStore } from '../../../../lib/store';

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

// Validation schema for updating tasks
const updateTaskSchema = {
  title: { type: 'string', minLength: 3, maxLength: 100 },
  completed: { type: 'boolean' }
};

// Create router to manage routes
const router = createRouter();

router
  // Get a specific task
  .get('/api/tasks/:id', async (req: NextRequest, context) => {
    try {
      const { id } = context.params;
      const task = await taskStore.findById(id);
      
      if (!task) {
        throw new ApiError('Task not found', 404);
      }
      
      return http.ok({ task });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error getting task', 500);
    }
  })
  
  // Update an existing task
  .put('/api/tasks/:id', withValidation(updateTaskSchema)(async (req: NextRequest, context) => {
    try {
      const { id } = context.params;
      const updateData = context.validatedData;
      
      const updatedTask = await taskStore.update(id, updateData);
      
      if (!updatedTask) {
        throw new ApiError('Task not found', 404);
      }
      
      return http.ok({ task: updatedTask });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error updating task', 500);
    }
  }))
  
  // Delete a task
  .delete('/api/tasks/:id', async (req: NextRequest, context: { params: { id: string } }) => {
    try {
      const { id } = context.params;
      const deleted = await taskStore.delete(id);
      
      if (!deleted) {
        throw new ApiError('Task not found', 404);
      }
      
      return http.ok({ success: true, message: 'Task successfully deleted' });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error deleting task', 500);
    }
  });

// Export handlers for HTTP methods
export const GET = apiMiddleware(errorHandler(router.handler));
export const PUT = apiMiddleware(errorHandler(router.handler));
export const DELETE = apiMiddleware(errorHandler(router.handler));
