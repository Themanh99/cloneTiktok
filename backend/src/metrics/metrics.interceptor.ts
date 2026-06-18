import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      finalize(() => {
        const elapsedSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
        const route = request.route?.path || request.path || 'unknown';
        const labels = {
          method: request.method,
          route,
          status_code: String(response.statusCode),
        };
        this.metrics.requestCounter.inc(labels);
        this.metrics.requestDuration.observe(labels, elapsedSeconds);
      }),
    );
  }
}
