import { NextRequest, NextResponse } from 'next/server';
import { NextApiHandler } from '../core/types';

/**
 * Options for the error handling middleware
 */
export interface ErrorHandlerOptions {
  /**
   * Function to transform errors before sending them to the client
   */
  errorFormatter?: (error: any) => { status: number; body: any };
  /**
   * If true, production errors will show fewer details
   */
  isProduction?: boolean;
  /**
   * Function for logging errors
   */
  logger?: (error: any) => void;
}

const defaultOptions: ErrorHandlerOptions = {
  isProduction: process.env.NODE_ENV === 'production',
  logger: console.error
};

/**
 * Custom class for API errors with HTTP status code
 */
export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Middleware for centralized error handling
 * @param options Configuration options
 * @returns Error handling middleware
 */
export function withErrorHandler(options: ErrorHandlerOptions = {}) {
  const finalOptions = { ...defaultOptions, ...options };

  return function errorHandlerMiddleware(handler: NextApiHandler): NextApiHandler {
    return async function (req: NextRequest, context: any) {
      try {
        return await handler(req, context);
      } catch (error: any) {
        // Log the error
        if (finalOptions.logger) {
          finalOptions.logger(error);
        }

        // Format the error for the response
        let status = 500;
        let responseBody: any = {
          error: 'Internal server error'
        };

        // Handle custom API errors
        if (error instanceof ApiError) {
          status = error.status;
          responseBody = {
            error: error.message,
            ...(error.details && { details: error.details })
          };
        } 
        // Allow custom formatting
        else if (finalOptions.errorFormatter) {
          const formatted = finalOptions.errorFormatter(error);
          status = formatted.status;
          responseBody = formatted.body;
        } 
        // Default format for regular errors
        else {
          responseBody = {
            error: finalOptions.isProduction ? 'Internal server error' : error.message,
            ...(finalOptions.isProduction ? {} : { stack: error.stack })
          };
        }

        return NextResponse.json(responseBody, { status });
      }
    };
  };
}
