import type { NextRequest } from 'next/server';

/**
 * Extracts and validates URL query parameters
 * @param req Next.js request
 * @returns Object with query parameters
 */
export function getQueryParams(req: NextRequest): Record<string, string> {
  const url = new URL(req.url);
  return Object.fromEntries(url.searchParams);
}

/**
 * Extracts and converts URL query parameters to specific types
 * @param req Next.js request
 * @param schema Type conversion schema
 * @returns Object with converted query parameters
 */
export function parseQueryParams<T extends Record<string, unknown>>(
  req: NextRequest,
  schema: Record<string, 'string' | 'number' | 'boolean' | 'array'>
): Partial<T> {
  const rawParams = getQueryParams(req);
  const parsedParams: Record<string, unknown> = {};

  Object.entries(schema).forEach(([key, type]) => {
    if (!(key in rawParams)) return;

    const value = rawParams[key];

    switch (type) {
      case 'number':
        parsedParams[key] = Number(value);
        break;
      case 'boolean':
        parsedParams[key] = value === 'true' || value === '1';
        break;
      case 'array':
        parsedParams[key] = value.split(',').map(item => item.trim());
        break;
      case 'string':
      default:
        parsedParams[key] = value;
    }
  });

  return parsedParams as Partial<T>;
}

/**
 * Extracts JSON data from the request body
 * @param req Next.js request
 * @returns Promise that resolves to JSON data
 */
export async function getJsonBody<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  try {
    return (await req.clone().json()) as T;
  } catch (error) {
    throw new Error('Error processing JSON body', { cause: error });
  }
}

/**
 * Extracts form data from the request body
 * @param req Next.js request
 * @returns Promise that resolves to form data
 */
export async function getFormData(req: NextRequest): Promise<Record<string, string | File>> {
  try {
    const formData = await req.clone().formData();
    return Object.fromEntries(formData);
  } catch (error) {
    throw new Error('Error processing form data', { cause: error });
  }
}

/**
 * Extracts a specific HTTP header
 * @param req Next.js request
 * @param header Header name
 * @returns Header value or null if it doesn't exist
 */
export function getHeader(req: NextRequest, header: string): string | null {
  return req.headers.get(header);
}

/**
 * Verifies if the request is of a specific type based on its Content-Type header
 */
export const contentType = {
  isJson: (req: NextRequest): boolean => {
    const contentType = req.headers.get('content-type') ?? '';
    return contentType.includes('application/json');
  },
  isFormData: (req: NextRequest): boolean => {
    const contentType = req.headers.get('content-type') ?? '';
    return contentType.includes('multipart/form-data');
  },
  isUrlEncoded: (req: NextRequest): boolean => {
    const contentType = req.headers.get('content-type') ?? '';
    return contentType.includes('application/x-www-form-urlencoded');
  },
};
