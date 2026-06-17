# Senior Fullstack Interview Roadmap

File nay la ban do tong quan, khong phai noi chua ly thuyet chi tiet. Khi can hoc sau, di den file canonical trong `README.md`.

## 1. Muc tieu phong van

Vi tri muc tieu: Fullstack / Senior Node.js / Frontend Lead co kha nang lam viec end-to-end:

- Backend: Node.js, TypeScript, NestJS, REST API, auth, validation, testing, production readiness.
- Frontend: React, Next.js, rendering strategy, data fetching, performance, UI architecture.
- Database: schema design, index, transaction, isolation, query optimization.
- Distributed backend: cache, queue, Kafka, rate limit, background job, idempotency.
- DevOps: Docker, CI/CD, monitoring/logging, cloud/Kubernetes co ban.
- System design: clarify requirement, estimate scale, decompose service, choose database/cache/queue, discuss bottleneck.
- Interview communication: giai thich bang trade-off, dua vi du tu project that.

## 2. Thu tu uu tien

### Uu tien 1: Bat buoc chac

- Node.js event loop, non-blocking I/O, stream/backpressure.
- TypeScript typing, `unknown` vs `any`, generic, interface vs type.
- NestJS module, provider, DI, guard, pipe, interceptor, exception filter.
- REST API design, status code, idempotency, auth/authz.
- SQL index, transaction, isolation level, query tuning.
- React/Next.js rendering: SSR, SSG, ISR, CSR, Server/Client Component.

### Uu tien 2: Senior backend/fullstack

- Cache strategy, Redis pitfalls, cache stampede, invalidation.
- Queue/background job, retry, DLQ, idempotent consumer.
- Kafka concept: topic, partition, consumer group, offset, ordering.
- API performance debugging: tracing, DB query, N+1, payload, cache, concurrency.
- Docker, CI/CD, observability, graceful shutdown.

### Uu tien 3: System design va leadership

- Scale stateless service, database read/write path, sharding/replica.
- Notification/feed/file-processing/rate-limit system design.
- Code review, mentoring, trade-off communication, conflict handling.
- Reverse interview: hoi ve architecture, team process, quality bar, ownership.

## 3. Lo trinh 7 ngay

### Ngay 1: Node.js va TypeScript

- Hoc `02-nodejs-NESTJS_MASTERY_GUIDE.md` tu Node.js core den async/error handling.
- Tu tra loi: vi sao Node xu ly nhieu request du JavaScript single-thread?
- Tu tra loi: khi nao can stream, khi nao can worker thread?

### Ngay 2: NestJS production API

- Hoc module, DI, lifecycle, guard/pipe/interceptor/filter trong `02`.
- On auth, validation, serialization, transaction, testing.
- Viet lai flow request NestJS bang 5-7 dong.

### Ngay 3: Frontend React/Next.js

- Hoc `03-kiến thức nền tảng - nextjs.md`.
- Tap so sanh SSR/SSG/ISR/CSR va Server/Client Component.
- Chuan bi vi du ve form lon, data fetching, SEO, performance.

### Ngay 4: Database

- Hoc `05-kiến thức master database.md`.
- Tap doc `EXPLAIN`, chon index, giai thich transaction/isolation.
- Chuan bi vi du toi uu query cham tu project.

### Ngay 5: Backend patterns

- Hoc `06-backend-core-knowledge.md`.
- On cache, Redis session, rate limit, distributed lock, queue/Kafka, idempotency.
- Tap tra loi: khi nao xu ly sync, khi nao dua vao background job?

### Ngay 6: DevOps va production readiness

- Hoc `04-kiến thức-database-devops.md`.
- On Dockerfile multi-stage, health check, CI/CD, migration, rollback, monitoring.
- Chuan bi checklist production-ready API.

### Ngay 7: Mock interview va system design

- Hoc `07-system-design-cases.md`.
- Dung `09-QA-fullstack.md` de tu phong van.
- Chuan bi pitch/project story trong `08-plan-answer-interview-fullstack.md`.

## 4. Khung tra loi cau hoi ky thuat

Dung format ngan gon:

1. Dinh nghia hoac y chinh.
2. Khi nao dung.
3. Trade-off.
4. Vi du thuc te tu project.
5. Pitfall va cach tranh.

Vi du voi cache:

- Cache giup giam latency va DB load cho du lieu doc nhieu.
- Dung cho data it thay doi hoac chap nhan eventual consistency.
- Trade-off la stale data, invalidation, memory pressure.
- Thuc te nen co TTL, cache key ro rang, metric hit rate, cach chong stampede.

## 5. Checklist truoc phong van

- Noi duoc request lifecycle cua NestJS.
- Noi duoc SSR/SSG/ISR/CSR va cach chon trong Next.js.
- Giai thich duoc index, transaction, isolation level bang vi du.
- Debug duoc API cham theo thu tu: client, network, service, DB, cache, dependency.
- Thiet ke duoc mot system co cache, queue, DB, monitoring.
- Co 2-3 project story theo STAR: problem, action, trade-off, result.
- Co cau hoi nguoc ve architecture, team ownership, release process.
