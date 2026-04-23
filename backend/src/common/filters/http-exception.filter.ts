import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

// @Catch(HttpException): Catches ALL HttpExceptions.
// Why? By default NestJS returns errors in different formats depending on exception type.
// This filter ensures EVERY error has the same format → Frontend can handle them consistently.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Standardized format for ALL error responses
    response.status(status).json({
      statusCode: status,
      message:
        typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message,
      messageCode:
        typeof exceptionResponse === 'object' ? (exceptionResponse as any).messageCode ?? null : null,
      error: HttpStatus[status], // e.g. "NOT_FOUND", "UNAUTHORIZED"
      timestamp: new Date().toISOString(),
      path: request.url, // e.g. "/api/auth/login"
    });
  }
}
