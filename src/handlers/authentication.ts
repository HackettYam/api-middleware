import { NextRequest, NextResponse } from 'next/server';
import { NextApiHandler } from '../core/types';

/**
 * Configuration options for the authentication middleware
 */
export interface AuthOptions {
  tokenSecret?: string;
  tokenHeader?: string;
  tokenType?: 'Bearer' | 'JWT' | 'Custom';
  verifyToken?: (token: string) => Promise<boolean | object | any> | boolean | object | any;
  onSuccess?: (tokenData: any, req: NextRequest) => void;
}

const defaultAuthOptions: AuthOptions = {
  tokenHeader: 'Authorization',
  tokenType: 'Bearer'
};

/**
 * Middleware for authentication in API routes
 * @param options Configuration options for authentication
 * @returns Authentication middleware
 */
export function withAuth(options: AuthOptions = {}) {
  const finalOptions = { ...defaultAuthOptions, ...options };
  
  return function authMiddleware(handler: NextApiHandler): NextApiHandler {
    return async function (req: NextRequest, context: any) {
      const authHeader = req.headers.get(finalOptions.tokenHeader || 'Authorization');
      
      if (!authHeader) {
        return NextResponse.json(
          { error: 'Authorization required' },
          { status: 401 }
        );
      }
      
      let token: string;
      
      // Extract the token according to its type
      if (finalOptions.tokenType === 'Bearer') {
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
          return NextResponse.json(
            { error: 'Invalid token format' },
            { status: 401 }
          );
        }
        token = parts[1];
      } else {
        token = authHeader;
      }
      
      // Verify the token
      try {
        let tokenData = true;
        
        if (finalOptions.verifyToken) {
          tokenData = await Promise.resolve(finalOptions.verifyToken(token));
          
          if (!tokenData) {
            return NextResponse.json(
              { error: 'Invalid or expired token' },
              { status: 401 }
            );
          }
        }
        
        // Execute the success callback if defined
        if (finalOptions.onSuccess) {
          finalOptions.onSuccess(tokenData, req);
        }
        
        // Add token information to the context
        const enhancedContext = {
          ...context,
          auth: {
            token,
            data: tokenData
          }
        };
        
        // Continue with the handler if the token is valid
        return handler(req, enhancedContext);
      } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: 401 }
        );
      }
    };
  };
}
