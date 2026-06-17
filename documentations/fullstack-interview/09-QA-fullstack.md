# QA và Mock Interview Fullstack

File này là question bank để luyện phỏng vấn. Khác với các file kiến thức canonical, file này tập trung vào câu hỏi, ý chính cần trả lời và cách nói trong phỏng vấn.

Khi luyện:

1. Chọn một nhóm câu hỏi.
2. Trả lời thành tiếng trong 2-3 phút/câu.
3. Nếu vấp kiến thức, quay về file canonical tương ứng.
4. Ghi câu chưa chắc vào checklist cuối file.

## 1. Node.js và TypeScript

Ôn sâu tại `02-nodejs-NESTJS_MASTERY_GUIDE.md`.

### Node.js xử lý nhiều request như thế nào nếu JavaScript single-thread?

Ý chính:

- JavaScript chạy trên main thread.
- I/O async được giao cho OS/libuv.
- Event loop đưa callback/promise continuation về call stack khi sẵn sàng.
- Node.js mạnh với I/O-bound, không tự động tốt với CPU-bound.

Câu trả lời ngắn:

> Node.js xử lý nhiều request tốt vì phần lớn request backend là I/O-bound. JavaScript chạy trên main thread, nhưng network/file/DB async không block main thread. Khi I/O xong, event loop đưa callback về xử lý. Nếu có CPU-heavy task trong request handler thì event loop bị block và toàn bộ API có thể chậm.

### Khi nào Node.js bị chậm?

Ý chính:

- Event loop bị block.
- Sync I/O.
- JSON payload quá lớn.
- CPU-heavy task.
- External API/DB chậm không timeout.
- Không dùng stream cho file lớn.

### `unknown` khác `any` thế nào?

Ý chính:

- `any` tắt type checking.
- `unknown` bắt buộc narrow trước khi dùng.
- Input từ HTTP/queue/webhook nên coi là `unknown` cho đến khi validate.

### Interface và type khác nhau thế nào?

Ý chính:

- `interface` phù hợp object contract, có declaration merging.
- `type` phù hợp union, intersection, mapped/conditional type.
- Quan trọng là convention team.

### Khi nào dùng `Promise.all`?

Ý chính:

- Dùng cho task độc lập.
- Không dùng nếu task phụ thuộc nhau.
- Với số lượng lớn cần concurrency limit.
- Cẩn thận làm quá tải DB/external API.

## 2. NestJS

Ôn sâu tại `02-nodejs-NESTJS_MASTERY_GUIDE.md`.

### NestJS khác Express ở điểm nào?

Ý chính:

- Express tối giản.
- NestJS xây trên Express/Fastify.
- Nest có module, DI, decorator, guard, pipe, interceptor, filter, testing pattern.
- Hợp project lớn cần convention.

### Request lifecycle trong NestJS?

Thứ tự:

```text
Middleware
-> Guard
-> Interceptor before
-> Pipe
-> Controller
-> Service/Provider
-> Interceptor after
-> Exception filter nếu có lỗi
```

### Guard, pipe, interceptor, exception filter khác nhau thế nào?

Ý chính:

- Guard: có cho request vào route không.
- Pipe: validate/transform input.
- Interceptor: bọc quanh handler, logging/response mapping/cache/timeout.
- Exception filter: bắt exception và chuẩn hóa error response.

### Vì sao không nên gọi repository trực tiếp từ controller?

Ý chính:

- Controller chỉ là HTTP adapter.
- Business logic nên ở service/use case.
- Dễ test, dễ reuse, tránh duplicate logic.

### `ValidationPipe` nên cấu hình thế nào?

Ý chính:

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
```

Nhớ nói: DTO validation không thay thế business validation và DB constraint.

### Khi nào dùng request-scoped provider?

Ý chính:

- Khi provider thật sự cần state riêng theo request.
- Không dùng mặc định vì tốn chi phí hơn singleton.

## 3. Frontend React/Next.js

Ôn sâu tại `03-kiến thức nền tảng - nextjs.md`.

### SSR, SSG, ISR, CSR khác nhau thế nào?

Ý chính:

- CSR: render chủ yếu trên client, hợp dashboard sau login.
- SSR: render trên server theo request, hợp page cần SEO và data fresh.
- SSG: build static HTML, hợp docs/blog/landing.
- ISR: static nhưng revalidate định kỳ/on-demand, hợp content cần SEO nhưng có thể stale ngắn.

### Server Component khác Client Component thế nào?

Ý chính:

- Server Component render trên server, fetch data được, không gửi JS component đó xuống client.
- Không dùng state/effect/browser API.
- Client Component dùng cho interaction: form, modal, button, chart.
- Đặt `"use client"` ở boundary nhỏ nhất.

### Khi nào fetch data ở server, khi nào fetch ở client?

Server:

- Cần SEO.
- Cần cookie/session/secret.
- Muốn tránh waterfall.
- Nội dung chính cần có trong HTML.

Client:

- Data phụ thuộc interaction.
- Polling/refetch.
- Infinite scroll.
- Optimistic update.

### Làm sao tối ưu form lớn?

Ý chính:

- Chia form theo section.
- State đặt gần nơi dùng.
- Dùng schema validation.
- Debounce async validation.
- Dùng React Hook Form nếu phù hợp.
- Backend vẫn validate lại.
- Dùng profiler nếu chậm.

### Làm sao debug frontend chậm?

Ý chính:

- Web Vitals: LCP, INP, CLS.
- Bundle analyzer.
- React Profiler.
- Network waterfall.
- Image/font optimization.
- List/table virtualization.

## 4. Database

Ôn sâu tại `05-kiến thức master database.md`.

### Index là gì và trade-off?

Ý chính:

- Index giúp tìm dữ liệu nhanh hơn.
- Tăng tốc read/filter/join/sort nếu đúng.
- Làm write chậm hơn và tốn storage.
- Không tạo index theo cảm tính, dùng query thật và EXPLAIN.

### Compound index và leftmost prefix là gì?

Ý chính:

- Compound index gồm nhiều cột.
- Với `(user_id, status, created_at)`, query dùng tốt khi bắt đầu từ `user_id`.
- Thứ tự cột quan trọng.

### Vì sao query chậm dù có index?

Ý chính:

- Index không khớp query.
- Selectivity thấp.
- Dùng function trên column.
- Wildcard đầu chuỗi.
- Sort không dùng index.
- Statistics cũ.
- Query trả quá nhiều row.

### Transaction là gì?

Ý chính:

- Nhóm thao tác DB thành một đơn vị.
- Thành công hết hoặc rollback.
- ACID: Atomicity, Consistency, Isolation, Durability.

### Lost update là gì và xử lý thế nào?

Ý chính:

- Hai transaction cùng đọc rồi ghi đè nhau.
- Xử lý bằng atomic update, row lock, optimistic locking, constraint.

### Offset pagination có vấn đề gì?

Ý chính:

- Offset lớn làm DB bỏ qua nhiều row, càng về sau càng chậm.
- Data thay đổi có thể duplicate/missing.
- Feed/list lớn nên dùng cursor pagination.

## 5. Backend production patterns

Ôn sâu tại `06-backend-core-knowledge.md`.

### Idempotency là gì và khi nào cần?

Ý chính:

- Cùng request logic gọi nhiều lần không tạo side effect lặp.
- Cần cho payment, create order, webhook, retry.
- Dùng idempotency key và unique constraint.

### Khi nào dùng cache?

Ý chính:

- Data read-heavy.
- Query/external API chậm.
- Chấp nhận stale data.
- Cần TTL, invalidation, hit rate metric.

### Cache stampede là gì?

Ý chính:

- Key hot hết hạn, nhiều request cùng miss và cùng đánh DB.
- Xử lý bằng TTL jitter, lock rebuild, stale-while-revalidate, pre-warm.

### Khi nào dùng queue?

Ý chính:

- Task lâu.
- Không cần trả kết quả ngay.
- Cần retry.
- Cần absorb spike.
- Ví dụ email, notification, import file, report.

### Làm sao tránh duplicate message?

Ý chính:

- Consumer idempotent.
- Message có event id.
- Lưu processed event id.
- Unique constraint/upsert.

### Transactional outbox giải quyết vấn đề gì?

Ý chính:

- Tránh DB commit thành công nhưng publish event thất bại.
- Ghi business data và outbox event trong cùng transaction.
- Worker publish event sau.
- Consumer vẫn phải idempotent.

## 6. DevOps và operations

Ôn sâu tại `04-kiến thức-database-devops.md`.

### Docker image production nên tối ưu thế nào?

Ý chính:

- Multi-stage build.
- Base image version cụ thể.
- Lockfile.
- `.dockerignore`.
- Không copy secret.
- Non-root user nếu có thể.
- Image nhỏ, reproducible.

### CI/CD pipeline nên có gì?

Ý chính:

- Lint, typecheck, test, build.
- Build artifact/image.
- Scan nếu cần.
- Deploy staging.
- Smoke test.
- Promote production.
- Rollback plan.

### Rolling, blue-green, canary khác nhau thế nào?

Ý chính:

- Rolling thay dần instance, tiết kiệm nhưng chạy song song 2 version.
- Blue-green switch traffic giữa 2 môi trường, rollback nhanh nhưng tốn tài nguyên.
- Canary đưa ít traffic vào version mới để quan sát metric.

### Readiness khác liveness thế nào?

Ý chính:

- Readiness: pod có nhận traffic không.
- Liveness: pod có cần restart không.
- Không để liveness phụ thuộc quá nhiều vào DB/external service.

### Observability cần gì?

Ý chính:

- Logs.
- Metrics.
- Traces.
- Request id/correlation id.
- Alert theo error rate, p95/p99 latency, queue lag, DB pool waiting.

## 7. System design

Ôn sâu tại `07-system-design-cases.md`.

Khi trả lời system design, luôn bắt đầu bằng:

1. Clarify requirement.
2. Hỏi scale/metric.
3. Nói API/data model.
4. Nói high-level architecture.
5. Đi vào read/write path.
6. Nói bottleneck/trade-off/failure mode.
7. Nói monitoring.

### Câu 1: Xử lý file 1 triệu dòng: upload, preview trên UI, submit lên backend và lưu DB như thế nào?

#### Câu cần hỏi trước

- File format là gì: CSV, Excel, JSONL?
- File tối đa bao nhiêu MB/GB?
- Preview cần hiển thị bao nhiêu dòng?
- User có cần mapping cột trước khi submit không?
- Validation rule là gì?
- Nếu có dòng lỗi thì fail cả file hay import partial?
- Duplicate xử lý skip, update hay báo lỗi?
- Cần retry/resume nếu worker crash không?
- Cần progress realtime không hay polling đủ?

#### Câu trả lời tập trung

Em sẽ không xử lý 1 triệu dòng trong một HTTP request và không load toàn bộ file vào memory. Em tách flow thành upload/preview và submit/import async.

Upload/preview:

- Client upload file lên backend hoặc dùng presigned URL để upload thẳng lên object storage.
- Backend tạo `import_job` với status `uploaded/draft`.
- Backend đọc streaming phần đầu file để parse header và 50-100 dòng sample.
- UI hiển thị preview, mapping cột, lỗi format cơ bản.
- Nếu cần preview nhiều trang, backend cung cấp preview theo chunk/page từ file đã upload.

Submit/import:

- User bấm submit, frontend gọi `POST /import-jobs/:id/submit`.
- Backend validate ownership, status và mapping.
- Backend đổi status sang `pending`, push `jobId` vào queue và trả response nhanh.
- Worker đọc file bằng stream, validate row, insert/upsert theo batch transaction.
- Lỗi từng row ghi vào `import_job_errors` hoặc error file.
- Progress cập nhật: processed, success, failed, status.
- UI poll progress hoặc dùng SSE/WebSocket nếu cần realtime.

Data model gợi ý:

```sql
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY,
  user_id BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  status VARCHAR(30) NOT NULL,
  mapping JSONB,
  total_rows INT,
  processed_rows INT NOT NULL DEFAULT 0,
  success_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  error_file_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Điểm senior cần nhấn:

- Stream/backpressure.
- Queue/background job.
- Batch transaction.
- Idempotency/retry.
- Unique constraint theo business key.
- Error report.
- Progress UX.
- Observability theo `jobId`.

Câu trả lời ngắn:

> Với file 1 triệu dòng, em thiết kế theo job async. Upload file lên storage, backend chỉ stream một phần đầu để preview và mapping cột. Khi user submit, backend tạo job và đưa vào queue. Worker đọc file bằng stream, validate theo row, insert/upsert theo batch transaction, cập nhật progress và lưu error rows riêng. UI poll progress hoặc dùng SSE/WebSocket. Quan trọng là không load hết file vào memory, không xử lý trong một request, có retry/idempotency và error report.

### Câu 2: Hệ thống 10 triệu user dùng đồng thời cần xây dựng như thế nào?

#### Câu cần hỏi trước

- 10 triệu là active connection, active user trong window hay DAU?
- Workload chính là read-heavy, write-heavy, feed/video, chat hay transaction?
- Peak RPS bao nhiêu?
- Read/write ratio?
- Latency target?
- Một region hay multi-region?
- Consistency cần mạnh hay eventual consistency?
- Data nào cache/CDN được?
- Availability target?
- Có yêu cầu security/compliance không?

#### Cách tiếp cận tổng thể

```text
Client
-> CDN / WAF / Rate limit
-> Load Balancer
-> Stateless API services
-> Redis cache
-> Database primary/read replicas
-> Queue/event stream
-> Workers
-> Observability
```

Nguyên tắc:

- API stateless để scale ngang.
- CDN cho static/public content.
- Cache hot read.
- DB primary cho write, replica cho read nếu phù hợp.
- Queue/event stream cho tác vụ async.
- Rate limit/backpressure để bảo vệ dependency.

Database scaling:

1. Schema/index/query tốt.
2. Connection pool hợp lý.
3. Cache hot read.
4. Read replica.
5. Partition nếu data rất lớn.
6. Sharding khi write/storage vượt khả năng một cluster.

Nếu là realtime/WebSocket:

```text
Client WebSocket
-> Gateway nodes
-> Pub/Sub/Event bus
-> Backend services
-> Gateway fanout
```

Cần presence store, heartbeat, reconnect strategy, backpressure và metric active connections/messages per second.

Điểm senior cần nhấn:

- Clarify trước, không over-engineer.
- Stateless service.
- Cache/CDN cho read-heavy.
- Queue cho async workload.
- DB là bottleneck chính.
- Consistency trade-off.
- Backpressure/rate limit.
- Observability: p95/p99, error rate, DB pool, queue lag.

Câu trả lời ngắn:

> Em sẽ clarify trước 10 triệu là active connection hay active user, workload read/write ra sao, latency và consistency requirement. Về kiến trúc, em đặt CDN/WAF/LB phía trước, API service stateless để scale ngang, Redis/cache cho hot read, DB primary/read replica, queue/event stream cho tác vụ async. Em không sharding ngay từ đầu mà tối ưu query/index/cache/replica trước. Nếu là realtime, em tách WebSocket gateway, lưu presence ở distributed store và fanout qua pub/sub. Cuối cùng phải có rate limit, backpressure, monitoring p95/p99, error rate, DB pool và queue lag.

## 8. Behavioral và leadership

Ôn sâu tại `08-plan-answer-interview-fullstack.md`.

### Giới thiệu bản thân trong 60 giây

Nhấn:

- Fullstack React/Next.js + Node/NestJS.
- Làm end-to-end.
- Quan tâm maintainability, performance, production readiness.
- Có project story cụ thể.

### Kể về dự án khó nhất

Khung:

```text
Situation
Task
Action
Result
Trade-off
Lesson
```

### Kể về lần tối ưu performance

Nhấn:

- Đo trước.
- Xác định bottleneck.
- Fix theo nguyên nhân.
- Đo lại.

### Kể về conflict trong team

Nhấn:

- Đưa tranh luận về requirement/trade-off.
- Không cá nhân hóa.
- Có phương án incremental.

### Điểm yếu của bạn là gì?

Nên nói điểm yếu thật, có cách cải thiện.

Ví dụ:

> Trước đây em có xu hướng đi quá sâu vào technical detail khi giải thích. Em cải thiện bằng cách bắt đầu với context, impact và trade-off trước, rồi mới đi vào chi tiết nếu người nghe cần.

## 9. Tips khi trả lời

- Trả lời ý chính trước, chi tiết sau.
- Luôn nói trade-off.
- Dùng ví dụ thật từ project.
- Nếu không chắc, nói cách bạn sẽ verify/debug.
- Với system design, hỏi requirement trước.
- Với câu senior, nói thêm monitoring, failure mode và maintainability.
- Không chỉ kể công nghệ, phải nói vì sao chọn.

## 10. Checklist câu chưa chắc

Thêm câu hỏi chưa trả lời tốt vào đây trong quá trình mock:

- [ ] Node.js/event loop:
- [ ] NestJS lifecycle:
- [ ] React/Next.js rendering:
- [ ] Database/index/transaction:
- [ ] Cache/queue/Kafka:
- [ ] Docker/CI/CD/monitoring:
- [ ] System design:
- [ ] Behavioral/project story:
