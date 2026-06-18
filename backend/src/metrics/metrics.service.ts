import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, register } from 'prom-client';

@Injectable()
export class MetricsService {
  readonly requestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  readonly requestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  });

  constructor() {
    collectDefaultMetrics({ prefix: 'tiktokweb_' });
  }

  get contentType() {
    return register.contentType;
  }

  render() {
    return register.metrics();
  }
}
