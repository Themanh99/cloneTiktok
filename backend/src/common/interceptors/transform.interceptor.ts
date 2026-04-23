import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// This interceptor wraps ALL successful responses into a standardized format:
// { data: ..., statusCode: 200, timestamp: "..." }
//
// Why? Consistency. Frontend always knows response.data contains the actual data.
// No need to guess "which field is data, which is metadata?"
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        data,
        statusCode: context.switchToHttp().getResponse().statusCode,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
