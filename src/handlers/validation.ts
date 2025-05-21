import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { NextApiHandler } from '../core/types';

// Define a more specific validation rule structure
type ValidationRule = {
  required?: boolean;
  type?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string | RegExp;
  patternMessage?: string;
};

type ValidationSchema = Record<string, ValidationRule>;
type ValidationData = Record<string, unknown>;
type ValidationResult = { valid: boolean; errors?: Record<string, string> };
type ValidationFunction = (data: ValidationData) => ValidationResult;

/**
 * Middleware for data validation in API routes
 * @param schema Validation schema or custom validation function
 * @returns Validation middleware
 */
export function withValidation(schema: ValidationSchema | ValidationFunction) {
  return function validationMiddleware(handler: NextApiHandler): NextApiHandler {
    return async function (req: NextRequest, context?: Record<string, unknown>) {
      // Get request data according to the HTTP method
      let requestData: ValidationData = {};
      const contentType = req.headers.get('content-type') ?? '';

      if (req.method === 'GET' || req.method === 'DELETE') {
        // Extract data from query parameters
        const url = new URL(req.url);
        requestData = Object.fromEntries(url.searchParams);
      } else if (contentType.includes('application/json')) {
        // Extract data from JSON body
        try {
          requestData = (await req.clone().json()) as ValidationData;
        } catch (error) {
          return NextResponse.json({ error: 'Invalid JSON body', cause: error }, { status: 400 });
        }
      } else if (contentType.includes('multipart/form-data')) {
        // Extract data from form
        try {
          const formData = await req.clone().formData();
          requestData = Object.fromEntries(formData);
        } catch (error) {
          return NextResponse.json({ error: 'Invalid form data', cause: error }, { status: 400 });
        }
      }

      // Validate the data
      let validation: ValidationResult;
      if (typeof schema === 'function') {
        // Use the custom validation function
        validation = schema(requestData);
      } else {
        // Implement simple schema-based validation
        // In a real implementation, it would be recommended to use a library like zod, yup, etc.
        validation = validateWithSchema(requestData, schema);
      }

      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validation.errors },
          { status: 400 }
        );
      }

      // Add validated data to the context
      const enhancedContext = {
        ...context,
        validatedData: requestData,
      };

      // Continue with the handler if validation is successful
      return handler(req, enhancedContext);
    };
  };
}

/**
 * Simple schema-based validation function
 * Note: For a real implementation, it is recommended to use libraries like zod, yup, etc.
 */
function validateWithSchema(data: ValidationData, schema: ValidationSchema): ValidationResult {
  const errors: Record<string, string> = {};
  let valid = true;

  // Iterate through the schema and validate each field
  Object.entries(schema).forEach(([field, rule]: [string, ValidationRule]) => {
    const value = data[field];

    // Check if the field is required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = `The field ${field} is required`;
      valid = false;
    }

    // If the field has a value, validate its type
    if (value !== undefined && value !== null) {
      // Validate type
      if (rule.type && typeof value !== rule.type) {
        errors[field] = `The field ${field} must be of type ${rule.type}`;
        valid = false;
      }

      // Validate minimum length for strings and arrays
      if (
        rule.minLength !== undefined &&
        (typeof value === 'string' || Array.isArray(value)) &&
        value.length < rule.minLength
      ) {
        errors[field] = `The field ${field} must have at least ${rule.minLength} characters`;
        valid = false;
      }

      // Validate maximum length for strings and arrays
      if (
        rule.maxLength !== undefined &&
        (typeof value === 'string' || Array.isArray(value)) &&
        value.length > rule.maxLength
      ) {
        errors[field] = `The field ${field} must have at most ${rule.maxLength} characters`;
        valid = false;
      }

      // Validate minimum value for numbers
      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        errors[field] = `The field ${field} must be greater than or equal to ${rule.min}`;
        valid = false;
      }

      // Validate maximum value for numbers
      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        errors[field] = `The field ${field} must be less than or equal to ${rule.max}`;
        valid = false;
      }

      // Validate with regular expression
      if (rule.pattern && typeof value === 'string') {
        const regex = new RegExp(rule.pattern);
        if (!regex.test(value)) {
          errors[field] = rule.patternMessage ?? `The field ${field} has an invalid format`;
          valid = false;
        }
      }
    }
  });

  return { valid, errors };
}
