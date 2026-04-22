import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interceptor này wrap TẤT CẢ response thành công thành format chuẩn:
// { data: ..., statusCode: 200, timestamp: "..." }
//
// Tại sao? Consistency. Frontend luôn biết response.data là data thật.
// Không cần đoán "field nào là data, field nào là metadata?"
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
