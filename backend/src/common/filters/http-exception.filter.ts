import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from '../../i18n/i18n.service';

// @Catch(HttpException): Catches ALL HttpExceptions.
// Why? By default NestJS returns errors in different formats depending on exception type.
// This filter ensures EVERY error has the same format → Frontend can handle them consistently.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Standardized format for ALL error responses
    const messageCode =
      typeof exceptionResponse === 'object'
        ? (exceptionResponse as { messageCode?: string }).messageCode
        : undefined;
    const fallback =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : String((exceptionResponse as { message?: string | string[] }).message ?? 'Request failed');
    const language = this.i18n.resolveLanguage(
      request.headers['x-language'] ?? request.headers['accept-language'],
    );

    response.status(status).json({
      statusCode: status,
      message: Array.isArray((exceptionResponse as { message?: unknown }).message)
        ? (exceptionResponse as { message: string[] }).message
        : this.i18n.translate(messageCode as never, language, fallback),
      messageCode: messageCode ?? null,
      error: HttpStatus[status], // e.g. "NOT_FOUND", "UNAUTHORIZED"
      timestamp: new Date().toISOString(),
      path: request.url, // e.g. "/api/auth/login"
    });
  }
}
