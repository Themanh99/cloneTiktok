# Senior Node.js Interview Study Guide

Mục tiêu của file này: ôn đúng trọng tâm cho vị trí Node.js từ 3 năm kinh nghiệm trở lên, có yêu cầu TypeScript, NestJS, microservices, database, message queue, Docker/K8s, hệ thống lớn, CCU cao và thiết kế kiến trúc sản phẩm.

---

# 1. Cách nhìn tổng quan về JD

JD này không chỉ hỏi code Node.js. Họ muốn ứng viên có thể:

- Viết backend production bằng Node.js/TypeScript.
- Thiết kế API, module, database, cache, queue.
- Hiểu kiến trúc monolith, modular monolith, microservices.
- Biết xử lý concurrency, scale, performance, high traffic.
- Biết trade-off khi chọn database, message queue, cache.
- Có tư duy thiết kế tính năng từ requirement đến kiến trúc triển khai.
- Biết vận hành app với Docker, Kubernetes, CI/CD, monitoring.

Nếu phỏng vấn vị trí này, cần trả lời theo kiểu:

1. Vấn đề là gì?
2. Thiết kế tổng thể ra sao?
3. Bottleneck nằm ở đâu?
4. Scale bằng cách nào?
5. Nếu lỗi thì hệ thống degrade thế nào?
6. Dữ liệu có nhất quán không?
7. Quan sát/monitor bằng metric gì?

---

# 2. Node.js Core

## Cần nắm

- Event loop.
- 6 phase của event loop.
- Promise, async/await, microtask queue.
- `process.nextTick`, `setTimeout`, `setImmediate`.
- Non-blocking I/O.
- Worker Threads.
- Cluster mode.
- Stream.
- Backpressure.
- Error handling async.
- Memory leak.
- CPU-bound vs I/O-bound.

## Câu trả lời trọng tâm

Node.js phù hợp với hệ thống I/O nhiều như API, realtime, gateway, BFF, chat, notification. Node.js không mạnh nếu xử lý CPU-heavy trực tiếp trên main thread vì sẽ block event loop.

Nếu có tác vụ nặng như resize ảnh, parse file rất lớn, encode video, export Excel lớn:

- Không xử lý trực tiếp trong request.
- Đẩy sang background worker.
- Dùng queue.
- Dùng stream thay vì load toàn bộ vào RAM.
- Có thể dùng Worker Threads hoặc service riêng.

## Câu hỏi hay gặp

### Vì sao Node.js xử lý nhiều request được dù single-thread?

Vì JavaScript chạy trên main thread, nhưng I/O được xử lý async bởi OS/libuv. Khi I/O xong, callback được đưa lại vào event loop.

### Khi nào Node.js bị chậm?

- Có code sync chạy lâu.
- JSON parse/stringify object rất lớn.
- Loop lớn trên main thread.
- Regex nặng.
- Upload/download không dùng stream.
- Query DB chậm làm request chờ lâu.
- Memory leak làm GC chạy nhiều.

### Xử lý file lớn trong Node.js thế nào?

Dùng stream và backpressure. Không dùng `fs.readFile` để đọc cả file lớn vào RAM.

```ts
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

await pipeline(
  createReadStream('large.csv'),
  createWriteStream('output.csv'),
);
```

---

# 3. TypeScript

## Cần nắm

- Type, interface.
- Union, intersection.
- Generic.
- Utility types: `Partial`, `Pick`, `Omit`, `Record`, `Required`.
- Narrowing.
- Type guard.
- Enum vs union literal.
- `unknown` vs `any`.
- Decorator trong NestJS.
- DTO, validation.
- Strict mode.

## Câu trả lời trọng tâm

TypeScript giúp giảm bug bằng static typing. Nhưng nếu lạm dụng `any`, type assertion hoặc bỏ strict mode thì lợi ích giảm nhiều.

Trong backend, TypeScript nên được dùng để định nghĩa:

- DTO input.
- Response type.
- Domain model.
- Repository interface.
- Service contract.
- Event payload.

## Câu hỏi hay gặp

### `unknown` khác gì `any`?

`any` tắt kiểm tra type. `unknown` bắt buộc phải kiểm tra type trước khi dùng.

```ts
function handle(value: unknown) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
}
```

### Interface và type khác gì?

Cả hai đều mô tả shape dữ liệu. `interface` phù hợp object/class contract và có thể declaration merging. `type` linh hoạt hơn cho union, intersection, mapped type.

### Generic dùng để làm gì?

Dùng khi logic giống nhau nhưng type thay đổi.

```ts
function wrap<T>(data: T) {
  return { data };
}
```

---

# 4. OOP, SOLID, Design Pattern

## Cần nắm

- Encapsulation.
- Inheritance.
- Polymorphism.
- Abstraction.
- SOLID.
- Dependency Injection.
- Factory.
- Strategy.
- Adapter.
- Observer.
- Decorator.
- Repository pattern.
- Unit of Work.

## Câu trả lời trọng tâm

Ở backend, OOP và design pattern không phải để làm code phức tạp hơn. Mục tiêu là tách trách nhiệm, dễ test, dễ thay đổi business logic.

Trong NestJS, Dependency Injection là pattern quan trọng nhất. Service không tự khởi tạo dependency, mà nhận dependency qua constructor.

```ts
@Injectable()
export class VideoService {
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly eventBus: EventBus,
  ) {}
}
```

## Pattern nên biết theo tình huống

### Strategy Pattern

Dùng khi có nhiều thuật toán có thể thay thế nhau.

Ví dụ:

- Nhiều cách tính phí ship.
- Nhiều provider thanh toán.
- Nhiều thuật toán ranking feed.

### Factory Pattern

Dùng khi logic tạo object phức tạp hoặc phụ thuộc loại input.

Ví dụ:

- Tạo payment provider theo `provider = momo | stripe | vnpay`.

### Adapter Pattern

Dùng để bọc API bên thứ ba thành interface nội bộ ổn định.

Ví dụ:

- Cloudinary, S3, Google Cloud Storage đều implement `StorageProvider`.

### Repository Pattern

Dùng để tách business logic khỏi ORM/database.

Ví dụ:

- Service gọi `userRepository.findByEmail(email)`.
- Không phụ thuộc trực tiếp Prisma query ở mọi nơi.

---

# 5. NestJS

## Cần nắm

- Module.
- Controller.
- Provider/Service.
- Dependency Injection.
- Guard.
- Interceptor.
- Pipe.
- Exception Filter.
- Middleware.
- DTO + validation.
- Custom decorator.
- Config module.
- Database module.
- Auth module.
- Microservices transport.
- Testing service/controller.

## Câu trả lời trọng tâm

NestJS phù hợp backend lớn vì ép cấu trúc module rõ ràng, hỗ trợ DI, decorator, validation, guard, interceptor. Khi codebase lớn, nên chia module theo domain/business capability, không chỉ chia theo technical layer.

Ví dụ module:

```text
AuthModule
UserModule
VideoModule
CommentModule
NotificationModule
PaymentModule
```

## Luồng request trong NestJS

```text
Middleware
-> Guard
-> Interceptor before
-> Pipe
-> Controller
-> Service
-> Interceptor after
-> Exception Filter nếu có lỗi
```

## Câu hỏi hay gặp

### Guard dùng để làm gì?

Guard quyết định request có được đi tiếp hay không. Dùng cho auth, role, permission.

### Pipe dùng để làm gì?

Pipe validate hoặc transform input trước khi vào controller.

### Interceptor dùng để làm gì?

Interceptor bọc quanh request/response. Dùng cho logging, transform response, timeout, cache, metrics.

### Exception Filter dùng để làm gì?

Chuẩn hóa error response và xử lý exception.

---

# 6. NextJS, ReactJS, TailwindCSS

Vị trí này backend-heavy nhưng có yêu cầu fullstack. Cần đủ hiểu frontend để làm BFF/API, tối ưu data fetching và phối hợp UI.

## NextJS cần nắm

- App Router.
- Server Component vs Client Component.
- SSR, SSG, ISR.
- API Route / Route Handler.
- Middleware.
- Caching.
- Data fetching.
- Authentication flow.
- SEO cơ bản.

## React cần nắm

- Component.
- Props/state.
- Hook: `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`.
- Controlled form.
- Error boundary.
- Rendering performance.
- Code splitting.
- State management.

## TailwindCSS cần nắm

- Utility-first CSS.
- Responsive class.
- Design token.
- Reusable component class strategy.
- Không lạm dụng class dài khó maintain.

## Câu hỏi hay gặp

### Server Component khác Client Component?

Server Component render trên server, không gửi JS không cần thiết xuống client, phù hợp fetch data và render nội dung tĩnh/ít tương tác.

Client Component chạy trên browser, dùng khi cần state, effect, event handler.

### Khi nào dùng SSR?

Dùng khi cần dữ liệu mới theo request hoặc SEO tốt với dữ liệu dynamic.

### Khi nào dùng CSR?

Dùng cho phần tương tác mạnh, dashboard nội bộ, hoặc dữ liệu chỉ cần sau khi user đăng nhập.

---

# 7. Database

## Cần nắm

- MySQL/PostgreSQL.
- MongoDB.
- Cassandra.
- Redis.
- Index.
- B-tree.
- Compound index.
- Query plan/EXPLAIN.
- Transaction.
- Isolation level.
- Lock.
- Replication.
- Partitioning.
- Sharding.
- Connection pool.
- Read/write splitting.
- Migration.

## PostgreSQL/MySQL

Phù hợp:

- Dữ liệu quan hệ.
- Transaction mạnh.
- Query SQL phức tạp.
- Consistency cao.

Ví dụ:

- User.
- Order.
- Payment.
- Permission.
- Follow relation.

## MongoDB

Phù hợp:

- Document linh hoạt.
- Schema thay đổi nhanh.
- Dữ liệu đọc theo document.

Không phù hợp nếu cần join phức tạp nhiều bảng hoặc transaction phức tạp liên tục.

## Cassandra

Phù hợp:

- Ghi rất lớn.
- Scale ngang.
- Time-series/event/log.
- Query pattern cố định.

Điểm cần nhớ: Cassandra thiết kế bảng theo query. Không query linh hoạt như SQL.

## Redis

Phù hợp:

- Cache.
- Session.
- Rate limit.
- Distributed lock.
- Counter.
- Pub/Sub nhẹ.

## Câu hỏi hay gặp

### Vì sao query chậm dù có index?

- Index không khớp query.
- Thứ tự compound index sai.
- Query dùng function trên cột.
- `LIKE '%keyword'`.
- Select quá nhiều dòng.
- Statistics cũ.
- Database chọn seq scan vì table nhỏ hoặc filter không selective.

### Khi nào cần transaction?

Khi nhiều thay đổi dữ liệu phải thành công cùng nhau.

Ví dụ:

- Tạo order + order items + trừ stock.
- Like video + tăng like count.
- Chuyển tiền.

### Khi nào cần Redis cache?

Khi dữ liệu đọc nhiều, thay đổi không quá liên tục, query DB tốn kém.

Ví dụ:

- User profile.
- Feed page đầu.
- Config.
- Permission.
- Hot videos.

---

# 8. Message Queue

## Cần nắm

- Kafka.
- RabbitMQ.
- NATS.
- Producer.
- Consumer.
- Topic/queue.
- Partition.
- Consumer group.
- Offset.
- Ack/Nack.
- Retry.
- Dead letter queue.
- Idempotency.
- Ordering.
- At-most-once, at-least-once, exactly-once.

## Khi nào dùng message queue?

Dùng khi không muốn xử lý mọi thứ trong request chính.

Ví dụ user upload video:

```text
Request upload video
-> lưu metadata
-> publish video.uploaded
-> worker transcode video
-> worker generate thumbnail
-> worker scan content
-> worker notify followers
```

API trả response nhanh, các bước nặng xử lý async.

## Kafka vs RabbitMQ vs NATS

### Kafka

Phù hợp:

- Event streaming.
- Log lớn.
- Analytics.
- Nhiều consumer group đọc cùng một event.
- Throughput cao.

Điểm mạnh:

- Lưu event lâu.
- Replay được.
- Scale bằng partition.

### RabbitMQ

Phù hợp:

- Task queue.
- Routing linh hoạt.
- Work queue.
- Retry/DLQ rõ.

Điểm mạnh:

- Ack/Nack tốt.
- Exchange routing mạnh.

### NATS

Phù hợp:

- Messaging nhẹ, nhanh.
- Microservices communication.
- Pub/Sub đơn giản.
- Request/reply.

Điểm mạnh:

- Rất nhẹ.
- Latency thấp.
- Dễ vận hành hơn Kafka trong nhiều case.

## Câu hỏi hay gặp

### Làm sao tránh xử lý duplicate message?

Consumer phải idempotent.

Cách làm:

- Mỗi event có `eventId`.
- Lưu bảng `processed_events`.
- Unique key chống insert trùng.
- Update theo trạng thái thay vì cộng dồn mù.

### Retry message lỗi thế nào?

- Retry có giới hạn.
- Exponential backoff.
- Sau nhiều lần fail thì đẩy vào DLQ.
- Có dashboard để replay DLQ sau khi fix lỗi.

### Có đảm bảo thứ tự message không?

Kafka chỉ đảm bảo thứ tự trong cùng partition. Nếu cần ordering theo user, dùng key là `userId`.

---

# 9. Docker và Kubernetes

## Docker cần nắm

- Image.
- Container.
- Dockerfile.
- Docker Compose.
- Volume.
- Network.
- Multi-stage build.
- Healthcheck.
- Environment variables.
- Logs.

## Docker câu trả lời trọng tâm

Docker giúp đóng gói app và runtime để chạy nhất quán giữa local, staging, production.

Các lỗi thường gặp:

- Image quá lớn.
- Copy secret vào image.
- Không dùng `.dockerignore`.
- Dùng `localhost` sai giữa các container.
- Không có healthcheck.
- Không mount volume cho dữ liệu cần persist.

## Kubernetes cần nắm

- Pod.
- Deployment.
- Service.
- Ingress.
- ConfigMap.
- Secret.
- HPA.
- Volume/PVC.
- Readiness probe.
- Liveness probe.
- Rolling update.
- Namespace.

## Kubernetes câu trả lời trọng tâm

Kubernetes dùng để orchestration container: chạy, scale, restart, rolling update, service discovery.

Ví dụ deploy backend:

```text
Ingress
-> Service
-> Deployment
-> Pods chạy Node.js API
-> ConfigMap/Secret cấp config
-> HPA scale theo CPU/RPS/custom metric
```

## Probe

### Readiness probe

Pod đã sẵn sàng nhận traffic chưa.

Ví dụ app start rồi nhưng chưa connect DB xong thì readiness fail.

### Liveness probe

Pod còn sống không. Nếu fail, Kubernetes restart pod.

Không nên dùng liveness quá nhạy làm pod restart liên tục khi app chỉ chậm tạm thời.

## HPA

Horizontal Pod Autoscaler scale số pod theo metric.

Metric thường dùng:

- CPU.
- Memory.
- RPS.
- Queue lag.
- Custom metric.

---

# 10. Microservices và Distributed System

## Cần nắm

- Monolith.
- Modular monolith.
- Microservices.
- Service discovery.
- API Gateway.
- BFF.
- Sync vs async communication.
- Circuit breaker.
- Timeout.
- Retry.
- Bulkhead.
- Saga.
- Outbox pattern.
- Idempotency.
- Eventual consistency.
- Distributed tracing.

## Monolith vs Microservices

### Monolith

Phù hợp:

- Team nhỏ.
- Product chưa ổn định.
- Domain chưa rõ.
- Cần phát triển nhanh.

Ưu điểm:

- Dễ debug.
- Dễ transaction.
- Dễ deploy.

Nhược điểm:

- Lớn dần khó maintain.
- Scale theo từng module khó.

### Modular Monolith

Vẫn deploy một app, nhưng code chia module theo domain rõ ràng.

Đây thường là lựa chọn tốt trước khi tách microservices.

### Microservices

Phù hợp:

- Team lớn.
- Domain rõ.
- Cần scale từng phần độc lập.
- Cần deploy độc lập.

Nhược điểm:

- Distributed transaction khó.
- Debug khó.
- Observability bắt buộc.
- Network failure là chuyện bình thường.
- Data consistency phức tạp hơn.

## Câu hỏi hay gặp

### Khi nào tách service?

Tách khi:

- Domain boundary rõ.
- Module có scale khác biệt.
- Team ownership rõ.
- Deploy độc lập có giá trị.
- Dữ liệu và business logic đủ độc lập.

Không nên tách chỉ vì muốn "microservices".

### Xử lý transaction giữa nhiều service thế nào?

Không dùng transaction database xuyên service theo kiểu truyền thống.

Thường dùng:

- Saga pattern.
- Outbox pattern.
- Event-driven.
- Compensation action.

Ví dụ order:

```text
Order created
-> reserve stock
-> charge payment
-> confirm order
```

Nếu payment fail:

```text
release stock
cancel order
```

### Outbox pattern là gì?

Khi service vừa update database vừa publish event, có nguy cơ DB commit thành công nhưng publish event fail.

Outbox pattern:

1. Trong cùng transaction, ghi business data và ghi event vào bảng outbox.
2. Worker đọc outbox và publish event.
3. Publish thành công thì đánh dấu sent.

---

# 11. Hệ thống lớn, CCU cao, hiệu năng lớn

Đây là phần phỏng vấn tình huống. Không có một câu trả lời duy nhất. Cần trình bày được cách phân tích, bottleneck và trade-off.

## 11.1 Cách trả lời bài system design

Luôn đi theo khung:

1. Clarify requirement.
2. Estimate traffic/data.
3. Thiết kế high-level architecture.
4. Thiết kế data model.
5. API chính.
6. Bottleneck.
7. Scaling strategy.
8. Consistency.
9. Failure handling.
10. Monitoring.

Không nhảy ngay vào công nghệ.

## 11.2 Các metric cần hỏi

- DAU/MAU.
- CCU.
- RPS.
- Read/write ratio.
- Payload size.
- Latency target.
- Data retention.
- Peak traffic.
- SLA/SLO.
- Region.
- Consistency requirement.

Ví dụ:

```text
10 triệu CCU không có nghĩa là 10 triệu request mỗi giây.
Phải hỏi mỗi user tạo bao nhiêu request/phút.
```

Nếu 10 triệu CCU, mỗi user trung bình 1 request/30 giây:

```text
10,000,000 / 30 = khoảng 333,333 RPS
```

Đây là traffic rất lớn, cần multi-region/CDN/cache/load balancing/sharding/queue.

---

# 12. Case 1: Xử lý file 1 triệu dòng

Yêu cầu ví dụ:

- User upload file CSV 1 triệu dòng.
- Cần preview một phần trên UI.
- Cần validate dữ liệu.
- Cần import vào database.
- Cần download file kết quả.

## Câu trả lời tốt

Không đọc toàn bộ file vào RAM. Dùng stream, object storage, background job và batch processing.

## Thiết kế tổng thể

```text
Client
-> API tạo upload session
-> Upload file lên S3/object storage bằng presigned URL
-> API nhận callback/confirm upload
-> Publish job import_file
-> Worker đọc file bằng stream
-> Parse từng dòng
-> Validate
-> Insert DB theo batch
-> Ghi lỗi vào error file
-> Cập nhật progress
-> UI poll/websocket xem progress
-> User preview/download kết quả
```

## Preview trên UI

Không load 1 triệu dòng lên UI.

Cách làm:

- Chỉ preview 100-500 dòng đầu.
- Backend parse sample đầu tiên.
- UI dùng pagination/virtualized table nếu cần xem nhiều.
- Với file đã import, query DB theo page.

## Import vào DB

Không insert từng dòng một.

Dùng:

- Batch insert.
- Transaction theo batch nhỏ.
- Validate trước các field cơ bản.
- Unique constraint để chống duplicate.
- Lưu trạng thái từng batch.

Ví dụ batch:

```text
1 batch = 1,000 hoặc 5,000 dòng
```

Không nên để một transaction ôm 1 triệu dòng vì:

- Lock lâu.
- Rollback nặng.
- Dễ timeout.
- Tốn memory.

## Progress

Lưu progress:

```text
file_import_jobs
- id
- user_id
- status: pending | processing | completed | failed
- total_rows
- processed_rows
- success_rows
- failed_rows
- error_file_url
```

UI lấy progress:

- Poll mỗi 2-5 giây.
- Hoặc WebSocket/SSE nếu cần realtime.

## Download kết quả

Nếu user cần download file đã xử lý:

- Worker ghi output/error file vào object storage.
- API trả signed URL.
- Không stream file lớn qua app server nếu không cần.

## Bottleneck

- RAM nếu đọc cả file.
- DB nếu insert quá nhanh không kiểm soát.
- Validation gọi external API.
- Duplicate dữ liệu.
- User upload file lỗi format.
- Retry job làm import trùng.

## Cách xử lý lỗi

- Job idempotent.
- Mỗi dòng có row number.
- Lưu lỗi theo dòng.
- Nếu worker chết, job có thể resume từ offset/batch.
- Nếu retry, không insert trùng nhờ unique key/import batch state.

## Câu trả lời ngắn khi phỏng vấn

Em sẽ không xử lý file 1 triệu dòng trực tiếp trong request. Em upload file lên object storage, tạo job async qua queue, worker đọc file bằng stream, validate và insert theo batch. UI chỉ preview một phần nhỏ hoặc dùng pagination/virtualization. Progress lưu vào DB/Redis để UI poll hoặc nhận realtime. File kết quả hoặc lỗi được ghi lại vào storage và trả signed URL để download.

---

# 13. Case 2: Hệ thống 10 triệu CCU

## Clarify trước

10 triệu CCU cần hỏi thêm:

- Mỗi user gửi bao nhiêu request/phút?
- Tính năng nào hot nhất?
- Read/write ratio?
- Có realtime không?
- Có multi-region không?
- Latency target?
- Dữ liệu có cần strong consistency không?

## Kiến trúc tổng thể

```text
Client
-> CDN
-> Load Balancer
-> API Gateway/BFF
-> Stateless API services
-> Redis cache/session/rate limit
-> Database cluster/sharding/read replica
-> Message queue
-> Worker services
-> Object storage
-> Monitoring/log/tracing
```

## Nguyên tắc scale

### Stateless service

API server không lưu state trong memory local. Session/token/cache để Redis hoặc external store.

Nhờ vậy có thể scale ngang nhiều instance.

### Cache mạnh

Dùng nhiều lớp cache:

- CDN cache static/media/public API.
- Redis cache hot data.
- Local in-memory cache cho config ít thay đổi.
- Database query cache nếu phù hợp.

### Database scale

Tùy bài toán:

- Read replica cho read-heavy.
- Partition table lớn.
- Sharding theo user_id/tenant_id.
- Archive dữ liệu cũ.
- Index đúng query.
- Tách OLTP và analytics.

### Queue hóa workload nặng

Không xử lý tác vụ nặng trong request:

- Gửi email.
- Push notification.
- Generate report.
- Transcode video.
- Analytics.
- Sync third-party.

### Rate limit và backpressure

Hệ thống lớn phải có cơ chế từ chối hợp lý khi quá tải:

- Rate limit theo user/IP/API key.
- Queue giới hạn tốc độ consumer.
- Circuit breaker với service lỗi.
- Timeout rõ ràng.
- Fallback response.

## Với realtime/CCU cao

Nếu 10 triệu kết nối WebSocket:

- Không để một server giữ quá nhiều connection vượt khả năng.
- Scale WebSocket gateway ngang.
- Dùng sticky session hoặc connection routing phù hợp.
- Dùng Redis Pub/Sub, NATS hoặc Kafka để fanout event tùy scale.
- Presence nên lưu Redis với TTL.
- Dùng heartbeat để detect connection chết.

## Bottleneck thường gặp

- Database connection pool cạn.
- Redis hot key.
- Kafka consumer lag.
- Load balancer quá tải.
- Log quá nhiều làm tăng I/O.
- Một endpoint hot không cache.
- N+1 query.
- JSON response quá lớn.
- WebSocket fanout quá rộng.

## Monitoring cần có

- RPS.
- P95/P99 latency.
- Error rate.
- CPU/memory.
- Event loop lag.
- DB slow query.
- DB connection pool usage.
- Redis hit rate.
- Redis memory.
- Queue lag.
- Kafka consumer lag.
- WebSocket connections.
- GC pause.

## Câu trả lời ngắn khi phỏng vấn

Với 10 triệu CCU, em sẽ bắt đầu bằng estimate RPS thật dựa trên hành vi user. Kiến trúc cần stateless service sau load balancer, cache nhiều lớp với CDN/Redis, database có read replica hoặc sharding tùy data access pattern, workload nặng đi qua queue, realtime gateway scale riêng, và bắt buộc có monitoring P95/P99, error rate, DB slow query, Redis hit rate, queue lag. Em cũng sẽ thiết kế rate limit, timeout, circuit breaker và fallback để hệ thống degrade có kiểm soát khi quá tải.

---

# 14. Case 3: Feed video như TikTok

## Yêu cầu

- User mở app thấy feed video.
- Feed cá nhân hóa.
- Load nhanh.
- Scroll liên tục.
- Like/comment/follow realtime-ish.

## Thiết kế tổng thể

```text
Client
-> Feed API
-> Redis cache candidate feed
-> Recommendation service
-> Video metadata DB
-> Object storage/CDN cho video
-> Event pipeline ghi hành vi user
```

## Cốt lõi

Video file không đi qua backend API chính. Video nên lưu object storage và phân phối qua CDN.

Backend trả metadata:

```json
{
  "videoId": "v1",
  "videoUrl": "https://cdn.example.com/v1.m3u8",
  "author": {},
  "stats": {},
  "reason": "recommended"
}
```

## Scale feed

- Precompute candidate feed cho user hoặc segment.
- Cache page đầu trong Redis.
- Dùng cursor pagination, không dùng offset lớn.
- Ghi event user action vào Kafka.
- Recommendation service xử lý async.

## Bottleneck

- Recommendation query chậm.
- Cache miss hàng loạt.
- Hot video stats update quá nhiều.
- Like count/comment count ghi trực tiếp DB quá nhiều.

## Cách xử lý counter lớn

- Dùng Redis counter cho hot path.
- Flush về DB định kỳ.
- Hoặc dùng event log rồi aggregate.
- Cần chấp nhận eventual consistency cho count.

---

# 15. Case 4: Notification system

## Yêu cầu

- User follow nhận notification khi creator đăng video.
- Có push notification.
- Có in-app notification.
- Hệ thống không được sập nếu một creator có nhiều triệu follower.

## Thiết kế

```text
Video created
-> Kafka topic video.created
-> Notification fanout worker
-> Query followers theo page
-> Batch create notifications
-> Push provider worker
```

## Vấn đề lớn: fanout

Nếu creator có 10 triệu follower, không thể xử lý một request tạo 10 triệu notification sync.

Cách làm:

- Fanout async.
- Chia batch.
- Dùng queue.
- Rate limit push provider.
- Với celebrity account, có thể dùng fanout-on-read.

## Fanout-on-write vs fanout-on-read

### Fanout-on-write

Khi có event, ghi notification/feed item cho từng follower.

Ưu điểm:

- Đọc nhanh.

Nhược điểm:

- Ghi cực lớn nếu follower nhiều.

### Fanout-on-read

Không ghi trước cho từng follower. Khi user mở app mới query nội dung từ người họ follow.

Ưu điểm:

- Giảm write.

Nhược điểm:

- Read phức tạp và chậm hơn.

Thực tế có thể hybrid:

- User bình thường: fanout-on-write.
- Celebrity: fanout-on-read hoặc special pipeline.

---

# 16. Case 5: Rate limit login/API

## Yêu cầu

- Chống brute force login.
- Chống spam API.
- Không block nhầm quá nhiều user thật.

## Thiết kế

Dùng Redis:

```text
rate:login:ip:{ip}
rate:login:user:{userId}
rate:api:{userId}:{endpoint}
```

Thuật toán:

- Fixed window.
- Sliding window.
- Token bucket.
- Leaky bucket.

## Câu trả lời thực tế

Với login, em sẽ rate limit theo cả IP và account/email. Nếu vượt ngưỡng thì delay hoặc captcha, không chỉ block cứng. Dùng Redis atomic increment với TTL hoặc Lua script cho sliding window. Với API public, dùng token bucket để cho phép burst nhỏ nhưng giới hạn tốc độ trung bình.

## Vấn đề

- User sau NAT dùng chung IP.
- Bot phân tán nhiều IP.
- Redis down thì chọn fail-open hay fail-closed.
- Key cardinality quá lớn.

---

# 17. Case 6: API chậm cần tối ưu

## Cách debug

1. Xác định endpoint nào chậm.
2. Xem P95/P99 latency.
3. Kiểm tra log trace từng bước.
4. Xem DB slow query.
5. Xem external API latency.
6. Xem Redis hit/miss.
7. Xem event loop lag.
8. Kiểm tra response size.

## Nguyên nhân thường gặp

- N+1 query.
- Thiếu index.
- Query trả quá nhiều dữ liệu.
- Join nặng.
- Không cache.
- Gọi API bên thứ ba chậm.
- Await tuần tự thay vì song song.
- JSON quá lớn.
- CPU-heavy task trong request.

## Cách tối ưu

- Thêm index đúng.
- Dùng pagination/cursor.
- Chỉ select field cần thiết.
- Cache hot data.
- Dùng `Promise.all` cho tác vụ độc lập.
- Đẩy việc nặng sang queue.
- Tối ưu serialization.
- Dùng CDN cho static/media.

---

# 18. Thiết kế tính năng và kiến trúc sản phẩm

Khi được hỏi "thiết kế tính năng X", không chỉ nói API. Cần nói đủ:

- Requirement.
- User flow.
- API.
- Data model.
- Permission.
- Validation.
- State machine nếu có.
- Async jobs nếu có.
- Edge cases.
- Observability.
- Rollout.

## Ví dụ: thiết kế tính năng follow user

### API

```text
POST /users/:id/follow
DELETE /users/:id/follow
GET /users/:id/followers
GET /users/:id/following
```

### Data model

```text
follows
- follower_id
- following_id
- created_at

unique(follower_id, following_id)
index(following_id, created_at)
index(follower_id, created_at)
```

### Logic

- Không cho follow chính mình.
- Follow idempotent.
- Unfollow idempotent.
- Unique constraint chống duplicate.
- Count có thể eventual consistency.

### Async

- Publish event `user.followed`.
- Notification service gửi thông báo.
- Recommendation service cập nhật graph.

### Scale

- Cursor pagination cho followers/following.
- Cache count nếu đọc nhiều.
- Với celebrity, follower list rất lớn cần index tốt và paging.

---

# 19. Checklist ôn tập theo mức ưu tiên

## Ưu tiên 1: Bắt buộc chắc

- Node.js event loop, Promise, async/await.
- TypeScript core, generic, utility type, `unknown` vs `any`.
- NestJS module/controller/service/guard/pipe/interceptor.
- SQL index, compound index, transaction, isolation.
- Redis cache/session/rate limit.
- Docker image/container/compose.
- Message queue retry/DLQ/idempotency.
- System design framework.

## Ưu tiên 2: Senior backend

- Microservices trade-off.
- Saga/outbox/eventual consistency.
- Kafka partition/consumer group/offset/lag.
- RabbitMQ ack/nack/exchange/DLQ.
- K8s deployment/service/ingress/HPA/probe.
- DB replication, sharding, read replica.
- Observability: log, metric, trace.
- Performance debugging.

## Ưu tiên 3: Fullstack supporting

- NextJS SSR/SSG/ISR/Server Component.
- React hooks/rendering performance.
- Tailwind component styling convention.
- Frontend pagination/virtualization.
- Upload/download large file UX.

---

# 20. Bộ câu hỏi tự luyện

## Node.js

1. Event loop hoạt động thế nào?
2. Promise chạy ở phase nào?
3. `process.nextTick` khác gì Promise?
4. Khi nào Node.js bị block?
5. Xử lý file lớn bằng Node.js thế nào?
6. Stream và backpressure là gì?
7. Khi nào dùng Worker Threads?

## TypeScript

1. `any` khác gì `unknown`?
2. Generic dùng để làm gì?
3. Interface khác gì type?
4. Utility types dùng trong trường hợp nào?
5. Làm sao type-safe event payload?

## NestJS

1. Guard, pipe, interceptor khác nhau thế nào?
2. Module trong NestJS dùng để làm gì?
3. Exception filter dùng khi nào?
4. Thiết kế module auth như thế nào?
5. Làm sao test service có dependency?

## Database

1. Index giúp gì và hại gì?
2. Compound index hoạt động thế nào?
3. Đọc `EXPLAIN` cần nhìn gì?
4. Transaction dùng khi nào?
5. Isolation level giải quyết vấn đề gì?
6. Khi nào chọn PostgreSQL, MongoDB, Cassandra, Redis?

## Message Queue

1. Khi nào dùng queue?
2. Kafka khác RabbitMQ thế nào?
3. Consumer group là gì?
4. Offset là gì?
5. Vì sao cần idempotency?
6. Retry và DLQ thiết kế thế nào?

## Docker/K8s

1. Image khác container thế nào?
2. Multi-stage build để làm gì?
3. Docker volume dùng khi nào?
4. Pod, deployment, service, ingress là gì?
5. Readiness khác liveness thế nào?
6. HPA scale theo metric gì?

## System design

1. Thiết kế upload file 1 triệu dòng.
2. Thiết kế feed video cho 10 triệu user.
3. Thiết kế notification cho creator có 10 triệu follower.
4. Thiết kế rate limit login.
5. Thiết kế hệ thống 10 triệu CCU.
6. Debug API P99 latency tăng đột biến.
7. Xử lý Kafka consumer lag cao.
8. Xử lý Redis hot key.
9. Xử lý database connection pool cạn.
10. Thiết kế rollback khi deploy lỗi.

---

# 21. Mẫu trả lời phỏng vấn tình huống

## Mẫu 1: Khi gặp bài scale lớn

Em sẽ không bắt đầu bằng công nghệ ngay. Em sẽ hỏi rõ traffic, RPS, read/write ratio, latency target, consistency requirement và peak traffic. Sau đó em thiết kế service stateless sau load balancer, cache các dữ liệu hot bằng CDN/Redis, tối ưu database bằng index/read replica/sharding nếu cần, đưa workload nặng sang queue, và thêm monitoring P95/P99, error rate, DB slow query, Redis hit rate, queue lag. Với traffic quá tải, em dùng rate limit, timeout, circuit breaker và fallback để hệ thống degrade có kiểm soát.

## Mẫu 2: Khi gặp bài file lớn

Em sẽ không upload rồi xử lý file lớn trực tiếp trong request. Em tạo upload session, cho client upload lên object storage bằng presigned URL, sau đó tạo job async. Worker đọc file bằng stream, validate từng dòng, insert theo batch, lưu progress và error rows. UI chỉ preview một phần nhỏ hoặc dùng pagination/virtualization. Kết quả xử lý được ghi thành file trên storage và trả signed URL để download.

## Mẫu 3: Khi gặp bài microservices

Em sẽ chỉ tách microservice khi domain boundary rõ, team ownership rõ, cần scale/deploy độc lập. Nếu product chưa ổn định, em ưu tiên modular monolith trước. Khi đã tách service, em tránh distributed transaction trực tiếp, dùng saga/outbox/event-driven, đảm bảo idempotency, timeout, retry, circuit breaker và tracing.

## Mẫu 4: Khi gặp bài performance

Em sẽ đo trước khi sửa. Em xem endpoint nào chậm, P95/P99, trace từng dependency, DB slow query, Redis hit/miss, event loop lag, response size. Sau khi biết bottleneck, em mới chọn giải pháp: thêm index, giảm data trả về, cache, chạy song song bằng `Promise.all`, đẩy tác vụ nặng sang queue hoặc scale service.

---

# 22. Thứ tự học nhanh trong 7 ngày

## Ngày 1

- Node.js event loop.
- Promise/microtask.
- Stream/backpressure.
- Worker Threads.

## Ngày 2

- TypeScript core.
- NestJS lifecycle.
- Guard/pipe/interceptor/filter.
- DI và testing.

## Ngày 3

- SQL index.
- Compound index.
- EXPLAIN.
- Transaction/isolation.
- Redis cache/rate limit/session.

## Ngày 4

- Kafka/RabbitMQ/NATS.
- Retry/DLQ.
- Idempotency.
- Outbox pattern.

## Ngày 5

- Docker.
- Kubernetes core.
- CI/CD.
- Deploy/rollback/migration.

## Ngày 6

- Microservices.
- Saga.
- Circuit breaker.
- Observability.
- Performance debugging.

## Ngày 7

- Luyện system design:
  - File 1 triệu dòng.
  - 10 triệu CCU.
  - Feed video.
  - Notification fanout.
  - Rate limit.
  - API chậm.

---

# 23. Những câu nên nói được thật chắc

- "Không xử lý tác vụ nặng trong request, em đẩy qua queue/worker."
- "Không đọc file lớn vào RAM, em dùng stream và backpressure."
- "Không scale API nếu service còn state local, em làm service stateless trước."
- "Không thêm index theo cảm giác, em kiểm tra bằng EXPLAIN ANALYZE."
- "Không tin message queue chỉ gửi đúng một lần, consumer phải idempotent."
- "Không retry vô hạn, cần retry limit, backoff và DLQ."
- "Không dùng microservices nếu domain chưa rõ, modular monolith có thể hợp lý hơn."
- "Không rollback DB dễ như rollback code, migration phải backward compatible."
- "Không đo thì không tối ưu, phải xem P95/P99, trace, slow query, queue lag."
- "Không dùng offset pagination cho dữ liệu lớn thay đổi liên tục, nên dùng cursor."

