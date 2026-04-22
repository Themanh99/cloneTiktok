import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

// @Catch(HttpException): Bắt TẤT CẢ HttpException
// Tại sao cần? Mặc định NestJS trả lỗi format khác nhau tùy loại exception.
// Filter này đảm bảo MỌI lỗi đều có cùng format → Frontend dễ handle.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Format chuẩn cho MỌI response lỗi
    response.status(status).json({
      statusCode: status,
      message: typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message,
      error: HttpStatus[status], // VD: "NOT_FOUND", "UNAUTHORIZED"
      timestamp: new Date().toISOString(),
      path: request.url, // VD: "/api/auth/login"
    });
  }
}
