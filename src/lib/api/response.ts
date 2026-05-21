/**
 * API Response Wrapper
 *
 * Standardized response format for all API endpoints
 * Ensures consistency across the application
 */

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  requestId: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  requestId: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Success Response
 */
export function successResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
  };
}

/**
 * Error Response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, any>
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
  };
}

/**
 * Common Error Codes
 */
export const ErrorCodes = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Database
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Business Logic
  INVALID_STATE: 'INVALID_STATE',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BAD_GATEWAY: 'BAD_GATEWAY',

  // Healthcare Specific
  APPOINTMENT_CONFLICT: 'APPOINTMENT_CONFLICT',
  DOCTOR_UNAVAILABLE: 'DOCTOR_UNAVAILABLE',
  INVALID_MEDICAL_DATA: 'INVALID_MEDICAL_DATA',
  HIPAA_VIOLATION: 'HIPAA_VIOLATION',
};

/**
 * HTTP Status Codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Error response with HTTP status
 */
export function apiError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, any>
) {
  return {
    status,
    body: errorResponse(code, message, details),
  };
}

/**
 * Success response with HTTP status
 */
export function apiSuccess<T>(status: number, data: T) {
  return {
    status,
    body: successResponse(data),
  };
}

/**
 * Preset error responses
 */
export const ApiErrors = {
  validationError: (details?: Record<string, any>) =>
    apiError(
      HttpStatus.BAD_REQUEST,
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      details
    ),

  unauthorized: () =>
    apiError(HttpStatus.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED, 'Unauthorized'),

  forbidden: () =>
    apiError(HttpStatus.FORBIDDEN, ErrorCodes.FORBIDDEN, 'Forbidden'),

  notFound: (resource: string = 'Resource') =>
    apiError(
      HttpStatus.NOT_FOUND,
      ErrorCodes.NOT_FOUND,
      `${resource} not found`
    ),

  conflict: (message: string = 'Resource already exists') =>
    apiError(HttpStatus.CONFLICT, ErrorCodes.CONFLICT, message),

  rateLimitExceeded: (retryAfter?: number) =>
    apiError(
      HttpStatus.TOO_MANY_REQUESTS,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'Too many requests. Please try again later.',
      retryAfter ? { retryAfter } : undefined
    ),

  internalError: (message: string = 'An unexpected error occurred') =>
    apiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCodes.INTERNAL_ERROR,
      message
    ),

  serviceUnavailable: () =>
    apiError(
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCodes.SERVICE_UNAVAILABLE,
      'Service temporarily unavailable'
    ),

  hipaaViolation: () =>
    apiError(
      HttpStatus.FORBIDDEN,
      ErrorCodes.HIPAA_VIOLATION,
      'HIPAA policy violation detected'
    ),

  appointmentConflict: () =>
    apiError(
      HttpStatus.CONFLICT,
      ErrorCodes.APPOINTMENT_CONFLICT,
      'Appointment time slot is not available'
    ),
};
