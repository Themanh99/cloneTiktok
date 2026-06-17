# System Design và Case Thực Chiến

File này là tài liệu canonical cho phần system design trong phỏng vấn fullstack/backend. Mục tiêu là biết cách hỏi lại requirement, đưa ra kiến trúc hợp lý, nói được trade-off, bottleneck, failure mode và monitoring.

## 1. Cách tiếp cận system design interview

### 1.1 Mục tiêu của system design interview

System design interview không chỉ kiểm tra bạn biết công nghệ gì. Người phỏng vấn muốn xem:

- Bạn có biết hỏi requirement trước khi thiết kế không.
- Bạn có biết chia bài toán thành component không.
- Bạn có hiểu trade-off không.
- Bạn có biết bottleneck và failure mode không.
- Bạn có thiết kế phù hợp scale, không over-engineer không.
- Bạn có giao tiếp rõ ràng và có thứ tự không.

### 1.2 Khung trả lời tổng quát

Nên đi theo thứ tự:

1. Clarify requirement.
2. Xác định scale và metric.
3. Định nghĩa API chính.
4. Thiết kế data model.
5. Vẽ high-level architecture.
6. Đi vào read path/write path.
7. Chọn database/cache/queue/storage.
8. Nói về consistency và trade-off.
9. Nói bottleneck và failure mode.
10. Nói monitoring/alerting.

Câu mở đầu nên nói:

> Em sẽ clarify scope và scale trước. Sau đó em đề xuất API/data model, high-level architecture, rồi đi vào read/write path, bottleneck, consistency và monitoring. Nếu thời gian ít, em ưu tiên flow chính và trade-off quan trọng nhất.

### 1.3 Các câu cần hỏi trước

Tùy bài, nhưng thường cần hỏi:

- User là ai?
- Chức năng bắt buộc là gì, chức năng nào nice-to-have?
- DAU/MAU/CCU khoảng bao nhiêu?
- Peak RPS?
- Read/write ratio?
- Data size và growth?
- Latency target?
- Availability target?
- Consistency requirement?
- Một region hay multi-region?
- Có yêu cầu security/compliance không?
- Retention dữ liệu bao lâu?

### 1.4 Trade-off nên nhắc tự nhiên

- Simplicity vs scalability.
- Consistency vs availability/latency.
- Sync processing vs async processing.
- SQL transaction vs eventual consistency.
- Cache freshness vs DB load.
- Fanout-on-write vs fanout-on-read.
- Strong ordering vs throughput.
- Monolith/modular monolith vs microservices.
- Build in-house vs managed service.

### 1.5 Sai lầm hay gặp

- Chưa hỏi requirement đã chọn Kafka, Kubernetes, sharding.
- Chỉ vẽ box mà không nói request flow.
- Không nói data model.
- Không nói bottleneck.
- Không nói failure mode.
- Không nói monitoring.
- Over-engineer bài toán nhỏ.
- Dùng buzzword nhưng không giải thích tại sao.

## 2. Case: Xử lý file 1 triệu dòng

### 2.1 Requirement cần hỏi

- File format là gì: CSV, Excel, JSONL?
- File tối đa bao nhiêu MB/GB?
- 1 triệu dòng nhưng mỗi dòng bao nhiêu cột?
- Preview cần bao nhiêu dòng?
- User có cần mapping cột trước khi import không?
- Validation rule là gì?
- Có cho import partial không hay fail toàn bộ file?
- Duplicate xử lý skip, update hay báo lỗi?
- Cần progress realtime không?
- Import phải xong trong bao lâu?
- Có cần retry/resume nếu worker crash không?

### 2.2 Thiết kế tổng quan

Không xử lý 1 triệu dòng trong một HTTP request.

Thiết kế theo job async:

```text
Client
-> upload file
-> API tạo import_job
-> Object Storage lưu file
-> API parse sample rows để preview
-> User submit mapping/config
-> API push job vào queue
-> Worker stream file, validate, insert batch
-> DB lưu progress/errors
-> UI poll/SSE/WebSocket progress
```

### 2.3 Upload và preview

Có hai cách upload:

1. Client upload file lên backend, backend đẩy vào object storage.
2. Backend cấp presigned URL, client upload trực tiếp lên object storage.

Với file lớn, presigned URL thường tốt hơn vì:

- Giảm tải backend.
- Tránh backend giữ connection upload lâu.
- Object storage xử lý file tốt hơn.

Preview:

- Backend đọc streaming một phần đầu file.
- Parse header và khoảng 50-100 dòng đầu.
- Trả sample rows cho UI.
- UI cho user mapping cột, xem lỗi format cơ bản.

Không nên:

- Load toàn bộ file vào browser.
- Load toàn bộ file vào memory backend.
- Preview 1 triệu dòng trên UI.

### 2.4 Submit và xử lý backend

Khi user submit:

```http
POST /import-jobs/:id/submit
```

Backend:

1. Check job thuộc user hiện tại.
2. Check status hợp lệ: `uploaded` hoặc `draft`.
3. Validate mapping/config.
4. Đổi status sang `pending`.
5. Push `jobId` vào queue.
6. Trả response nhanh.

Worker:

1. Đổi status `processing`.
2. Đọc file bằng stream.
3. Parse từng row.
4. Validate row.
5. Gom batch 500-2000 rows.
6. Insert/upsert DB theo batch transaction.
7. Ghi lỗi row vào bảng lỗi hoặc error file.
8. Cập nhật progress định kỳ.
9. Đổi status `completed` hoặc `failed`.

### 2.5 Data model gợi ý

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

CREATE TABLE import_job_errors (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL,
  row_number INT NOT NULL,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  raw_data JSONB
);
```

Target table cần unique constraint theo business key để retry không tạo duplicate.

### 2.6 Idempotency và retry

Worker có thể crash hoặc message có thể duplicate.

Cần:

- Job status machine rõ: `uploaded`, `pending`, `processing`, `completed`, `failed`.
- Unique constraint trên target data.
- Batch transaction.
- Checkpoint nếu file rất lớn.
- Idempotent consumer.
- Error row không retry vô hạn.

Nếu duplicate row:

- Skip.
- Update/upsert.
- Ghi lỗi.

Phải clarify requirement trước.

### 2.7 UI progress

UI có thể:

- Poll `GET /import-jobs/:id` mỗi 1-3 giây.
- Dùng SSE nếu muốn server push đơn giản.
- Dùng WebSocket nếu app đã có realtime infrastructure.

Thông tin hiển thị:

- Status.
- Processed rows.
- Success rows.
- Failed rows.
- Estimated time nếu có.
- Download error report.

Polling thường đủ và đơn giản hơn WebSocket cho import job.

### 2.8 Bottleneck

- Memory nếu đọc toàn bộ file.
- DB write throughput.
- Validation quá nặng.
- Transaction quá dài.
- Duplicate/retry tạo dữ liệu trùng.
- Queue backlog.
- Object storage/network throughput.

### 2.9 Câu trả lời ngắn khi phỏng vấn

> Với file 1 triệu dòng, em không xử lý trong một request và không load toàn bộ vào memory. Em upload file lên object storage, backend chỉ stream một phần đầu để preview và mapping cột. Khi user submit, backend tạo job và đẩy vào queue. Worker đọc file bằng stream, validate theo row, insert/upsert theo batch transaction, cập nhật progress và lưu error rows riêng. UI poll hoặc dùng SSE để hiển thị progress. Điểm quan trọng là stream/backpressure, batch transaction, retry/idempotency và error report cho user.

## 3. Case: Hệ thống 10 triệu user dùng đồng thời

### 3.1 Clarify trước

"10 triệu user dùng đồng thời" có thể nghĩa khác nhau:

- 10 triệu active connection realtime?
- 10 triệu active user trong một khoảng thời gian?
- 10 triệu DAU/MAU?
- Peak RPS là bao nhiêu?
- Workload read-heavy hay write-heavy?
- Có realtime/chat/feed/video không?
- Latency target?
- Một region hay multi-region?
- Data consistency cần mạnh hay eventual consistency?
- Data nào public cache được, data nào user-specific?

### 3.2 Kiến trúc tổng quan

Với web/API read-heavy:

```text
Client
-> CDN / WAF / Rate limit
-> Load Balancer
-> Stateless API services
-> Redis cache
-> Database primary + read replicas
-> Queue/event stream
-> Workers
-> Observability
```

Nguyên tắc:

- API service stateless để scale ngang.
- CDN cache static/public content.
- Redis/cache cho hot read.
- DB primary xử lý write, read replica xử lý read nếu phù hợp.
- Queue cho tác vụ async.
- Rate limit/backpressure bảo vệ hệ thống.

### 3.3 Read path

```text
Client
-> CDN
-> API
-> Redis cache
-> cache miss: read replica/search service
-> return response
```

Cần tối ưu:

- Cache key đúng.
- TTL/invalidation rõ.
- Query có index.
- Cursor pagination.
- Response nhỏ.
- Không trả payload lớn.
- Tránh N+1.

### 3.4 Write path

```text
Client
-> API
-> validate/auth
-> primary DB transaction
-> outbox/event queue
-> workers update notification/search/counter/analytics
```

Cần chú ý:

- Idempotency key cho create/payment/order.
- Transaction ngắn.
- Outbox nếu cần đảm bảo event không mất.
- Async processing cho tác vụ phụ.
- Backpressure nếu DB/queue quá tải.

### 3.5 Database scaling

Không nhảy ngay vào sharding.

Thứ tự nên nói:

1. Schema/index/query tốt.
2. Connection pool hợp lý.
3. Cache hot read.
4. Read replica cho read-heavy.
5. Partition table nếu data rất lớn theo time/tenant.
6. Sharding khi write/storage vượt khả năng một cluster.

Sharding trade-off:

- Cross-shard query khó.
- Transaction cross-shard khó.
- Rebalancing phức tạp.
- Chọn shard key sai gây hot shard.

### 3.6 Nếu là realtime connection

Nếu 10 triệu là WebSocket connections:

```text
Client WebSocket
-> WebSocket Gateway nodes
-> Pub/Sub or event bus
-> Backend services
-> Gateway fanout
```

Cần:

- Tách API service và gateway.
- Gateway stateless hoặc state externalized.
- Presence/session store trong Redis/distributed store.
- Heartbeat/ping-pong.
- Reconnect strategy.
- Backpressure per connection/user.
- Rate limit message.
- Theo dõi active connections, messages/sec, fanout latency, disconnect rate.

### 3.7 Observability

Metric cần có:

- RPS.
- Error rate.
- p95/p99 latency.
- CPU/memory.
- DB connection pool.
- Slow query.
- Cache hit rate.
- Queue lag.
- WebSocket active connections nếu realtime.
- External dependency latency/error.

Alert theo symptom:

- Error rate tăng.
- Latency tăng.
- Queue lag tăng.
- DB pool waiting tăng.
- Cache cluster lỗi.

### 3.8 Câu trả lời ngắn

> Em sẽ clarify trước 10 triệu là active connection hay active user, workload read/write ra sao, latency và consistency requirement. Về kiến trúc, em đặt CDN/WAF/LB phía trước, API stateless để scale ngang, cache cho hot read, DB primary/read replica, queue/event stream cho tác vụ async và observability đầy đủ. Nếu là realtime, em tách WebSocket gateway, lưu presence ở distributed store và fanout qua pub/sub. Em không sharding ngay từ đầu; em tối ưu query/index/cache/replica trước, rồi mới partition/sharding khi có bottleneck thật.

## 4. Case: Feed video như TikTok

### 4.1 Requirement cần hỏi

- Feed cá nhân hóa hay chỉ trending?
- Có upload video không?
- Video dài bao lâu, dung lượng bao nhiêu?
- DAU/CCU và read/write ratio?
- Latency target khi scroll?
- Có like/comment/share/follow không?
- Counter có cần realtime tuyệt đối không?
- Có moderation không?
- Multi-region không?

### 4.2 Kiến trúc tổng quan

```text
Video upload
-> Object Storage
-> Transcoding pipeline
-> CDN

Client feed request
-> Feed API
-> Candidate generation
-> Ranking service
-> Metadata service
-> Return video metadata + CDN URL

Interactions
-> Interaction API
-> Event stream
-> Counter/ranking/notification workers
```

Video bytes không nên đi qua API server. API trả metadata/playback URL, video được stream qua CDN.

### 4.3 Upload/transcoding

Flow:

1. Client upload video lên object storage bằng presigned URL.
2. API tạo video record status `uploaded`.
3. Queue job transcode.
4. Worker tạo nhiều resolution/bitrate.
5. Lưu output vào storage.
6. Update status `ready`.
7. CDN phục vụ video.

Bottleneck:

- Transcoding CPU/GPU.
- Storage bandwidth.
- CDN cache miss.
- Moderation delay.

### 4.4 Feed read path

```text
Client request feed
-> Feed API
-> lấy candidates từ follow graph/trending/interest
-> ranking score
-> diversify
-> fetch metadata
-> return page with next cursor
```

Tối ưu:

- Cursor pagination.
- Cache candidate list ngắn hạn.
- Prefetch next videos.
- CDN video.
- Fallback trending nếu personalization lỗi.

### 4.5 Interaction write path

Like/view/share:

```text
Client
-> Interaction API
-> append event vào Kafka/queue
-> async update counters
-> update ranking signals
-> notification nếu cần
```

Counter như view/like có thể eventual consistency. Không cần transaction mạnh như payment.

### 4.6 Câu trả lời ngắn

> Với feed video, em tách media delivery khỏi API. Video upload lên object storage, xử lý transcode async, phục vụ qua CDN. Feed API trả metadata và CDN URL. Candidate generation/ranking tạo danh sách video, dùng cursor pagination và cache ngắn hạn. Interaction như view/like đi qua event stream để update counter/ranking/notification async. Counter có thể eventual consistency, còn hệ thống cần monitoring CDN latency, feed latency, event lag và transcode backlog.

## 5. Case: Notification system

### 5.1 Requirement cần hỏi

- Channel nào: in-app, push, email, SMS?
- Notification transactional hay marketing?
- Có user preference không?
- Có template không?
- Có cần realtime không?
- Số lượng recipient mỗi event?
- Có retry/DLQ không?
- Có cần dedup không?

### 5.2 Kiến trúc

```text
Producer service
-> Notification event
-> Notification service
-> Preference/template
-> Queue per channel
-> Workers
-> Provider: FCM/APNs/Email/SMS
-> Notification inbox DB
```

Tách queue theo channel để email chậm không ảnh hưởng push/in-app.

### 5.3 In-app, push, email

In-app:

- Ghi inbox DB.
- User đọc list notification.
- Có unread count.

Push:

- Dùng FCM/APNs.
- Cần device token.
- Token invalid phải cleanup.

Email:

- Dùng provider.
- Có bounce, unsubscribe.
- Có rate limit provider.

### 5.4 Fanout-on-write vs fanout-on-read

Fanout-on-write:

- Ghi notification cho từng recipient khi event xảy ra.
- Đọc inbox nhanh.
- Ghi rất nặng nếu recipient lớn.

Fanout-on-read:

- Khi user mở inbox mới tính từ event source.
- Ghi nhẹ hơn.
- Đọc phức tạp/chậm hơn.

Hybrid:

- User bình thường fanout-on-write.
- Celebrity/large audience fanout-on-read hoặc batch async.

### 5.5 Idempotency và retry

Notification dễ bị gửi trùng khi retry.

Cần key:

```text
notification:{event_id}:{recipient_id}:{channel}
```

Nếu gửi email/push thất bại tạm thời:

- Retry với backoff.
- Sau số lần tối đa đưa vào DLQ.
- Alert nếu DLQ tăng.

### 5.6 Câu trả lời ngắn

> Em thiết kế notification theo event-driven. Producer phát event, notification service kiểm tra preference/template, rồi đẩy vào queue theo channel như in-app, push, email. Worker từng channel xử lý retry/DLQ riêng. Với fanout lớn, em cân nhắc fanout-on-write, fanout-on-read hoặc hybrid. Để tránh gửi trùng, mỗi notification có idempotency key theo event, recipient và channel.

## 6. Case: Rate limit login/API

### 6.1 Requirement cần hỏi

- Rate limit endpoint nào?
- Login/register/OTP hay public API?
- Giới hạn theo IP, user, email hay API key?
- Nếu vượt limit thì block, delay hay captcha?
- Redis down thì fail open hay fail closed?
- Có cần audit/security alert không?

### 6.2 Thiết kế login rate limit

```text
Request login
-> check IP limiter
-> check email/account limiter
-> verify credential
-> fail: increment counters
-> too many fail: captcha/delay/temp lock
-> success: reset counters phù hợp
```

Key:

```text
login_fail:ip:1.2.3.4
login_fail:email_hash:abc123
login_fail:user:42
```

Không nên chỉ limit theo IP vì NAT/shared network.

Không nên chỉ limit theo account vì attacker có thể lock account người khác.

### 6.3 Algorithm

Fixed window:

- Đơn giản.
- Dễ burst ở biên window.

Sliding window:

- Chính xác hơn.
- Tốn tài nguyên hơn.

Token bucket:

- Cho phép burst có kiểm soát.
- Phù hợp public API.

### 6.4 Security detail

- Response login fail nên chung chung.
- Không tiết lộ account tồn tại.
- Log security event.
- Có alert khi fail tăng bất thường.
- Có captcha hoặc MFA challenge nếu risk cao.

### 6.5 Câu trả lời ngắn

> Với login, em rate limit theo nhiều chiều: IP, account/email hash và user/device nếu có. Sau nhiều lần fail thì tăng delay, captcha hoặc lock tạm thời. Redis lưu counter TTL. Response phải chung chung để không leak account tồn tại. Nếu Redis down, tùy security requirement có thể fail open kèm alert hoặc dùng local limiter tạm thời.

## 7. Case: API chậm cần tối ưu

### 7.1 Câu cần hỏi

- Endpoint nào chậm?
- Chậm p50 hay p95/p99?
- Tăng từ khi nào?
- Có deploy gần đây không?
- Tỉ lệ lỗi có tăng không?
- User nào/region nào bị ảnh hưởng?
- Traffic có tăng không?

### 7.2 Cách debug

```text
Client/network
-> API app
-> DB
-> cache
-> external API
-> queue/worker nếu async
```

Quy trình:

1. Nhìn dashboard latency/error/traffic.
2. Dùng tracing tách thời gian.
3. Check slow query/N+1/index.
4. Check external API timeout.
5. Check payload size/serialization.
6. Check event loop block/CPU.
7. Check DB pool/lock.
8. Check cache hit rate.
9. Fix bottleneck thật.
10. Đo lại.

### 7.3 Cách tối ưu theo nguyên nhân

DB chậm:

- Thêm/chỉnh index.
- Sửa query.
- Tránh N+1.
- Cursor pagination.

External API chậm:

- Timeout.
- Retry có backoff.
- Circuit breaker.
- Cache nếu phù hợp.

Payload lớn:

- Pagination.
- Chỉ trả field cần.
- Compression nếu phù hợp.

CPU-bound:

- Worker thread.
- Queue.
- Tối ưu thuật toán.

### 7.4 Câu trả lời ngắn

> Em không tối ưu theo cảm tính. Em đo p95/p99, error rate, dùng tracing để tách latency ở app, DB, cache, external API. Sau đó kiểm tra slow query, N+1, payload lớn, event loop block, DB pool hoặc queue lag. Fix theo bottleneck thật và đo lại sau khi fix.

## 8. Case: Thiết kế tính năng follow user

### 8.1 Requirement cần hỏi

- Follow public hay cần approve nếu private account?
- Có block/mute không?
- Có notification khi follow không?
- Có follower/following count không?
- List followers cần pagination không?
- Có ảnh hưởng feed không?

### 8.2 API

```http
POST   /users/:id/follow
DELETE /users/:id/follow
GET    /users/:id/followers
GET    /users/:id/following
```

### 8.3 Data model

```sql
CREATE TABLE follows (
  follower_id BIGINT NOT NULL,
  following_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX idx_follows_following
ON follows(following_id, created_at DESC);
```

Unique/primary key giúp follow idempotent và không duplicate.

### 8.4 Flow

```text
POST follow
-> auth
-> validate target user exists
-> check cannot follow self
-> check block/privacy
-> insert follows
-> publish UserFollowed event
-> async update counters/notification/feed
```

Nếu đã follow rồi, có thể trả success để client retry an toàn.

### 8.5 Scale

- Cursor pagination cho followers/following.
- Cache follower/following count.
- Counter update async nếu traffic lớn.
- Event stream để feed/notification xử lý.
- Với celebrity user, fanout feed cần strategy riêng.

### 8.6 Câu trả lời ngắn

> Em thiết kế bảng `follows(follower_id, following_id)` với primary key để tránh duplicate. API follow/unfollow nên idempotent. Khi follow, service check auth, target user, self-follow, block/privacy rồi insert. Sau đó publish event để update counter, notification hoặc feed async. List followers/following dùng cursor pagination và index theo access pattern.
