# Kiến Thức Backend Core và Production Patterns

File này là tài liệu canonical cho các kiến thức backend production ngoài Node.js/NestJS core và database theory. Mục tiêu là đọc để hiểu bản chất, biết trade-off, biết lỗi thực tế và nói được trong phỏng vấn.

Các phần liên quan:

- Node.js, TypeScript, NestJS: `02-nodejs-NESTJS_MASTERY_GUIDE.md`
- Database/index/transaction: `05-kiến thức master database.md`
- Docker/CI/CD/monitoring: `04-kiến thức-database-devops.md`
- System design cases: `07-system-design-cases.md`

## 1. REST API Design

### 1.1 REST API là gì?

REST là phong cách thiết kế API xoay quanh resource. Client thao tác với resource thông qua HTTP method như `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

Ví dụ resource:

```text
users
orders
products
notifications
```

Ví dụ API:

```http
GET    /users/123
POST   /users
PATCH  /users/123
DELETE /users/123
```

Điểm cần hiểu:

- URL nên biểu diễn resource, không nên biểu diễn action quá nhiều.
- HTTP method thể hiện hành động.
- Status code phải nhất quán.
- Request/response contract phải ổn định.
- API cần validation, auth, error format và versioning nếu đã có client dùng thật.

Câu trả lời phỏng vấn:

> REST API nên thiết kế quanh resource. Ví dụ `GET /orders/:id` để lấy order, `POST /orders` để tạo order. Em cố gắng dùng HTTP method và status code đúng nghĩa, response/error format nhất quán, có validation và auth rõ ràng.

### 1.2 HTTP method

`GET`: lấy dữ liệu, không tạo side effect.

`POST`: tạo resource hoặc trigger action không idempotent.

`PUT`: replace toàn bộ resource, thường idempotent.

`PATCH`: cập nhật một phần resource.

`DELETE`: xóa resource, thường nên idempotent ở góc nhìn client.

Ví dụ:

```http
GET /products?keyword=phone
POST /orders
PATCH /users/me/profile
DELETE /cart/items/123
```

Lỗi thường gặp:

- Dùng `GET` để tạo/sửa dữ liệu.
- Dùng `POST /get-user`.
- Không phân biệt `PUT` và `PATCH`.
- Delete gọi lại lần hai trả lỗi gây khó retry, trong khi có thể trả `204` nếu resource đã không còn.

### 1.3 HTTP status code

Các status code nên nắm:

- `200 OK`: thành công, có body.
- `201 Created`: tạo mới thành công.
- `204 No Content`: thành công, không cần body.
- `400 Bad Request`: request sai format.
- `401 Unauthorized`: chưa xác thực hoặc token không hợp lệ.
- `403 Forbidden`: đã xác thực nhưng không có quyền.
- `404 Not Found`: resource không tồn tại hoặc không được phép tiết lộ.
- `409 Conflict`: xung đột business state, ví dụ email đã tồn tại.
- `422 Unprocessable Entity`: validation/domain rule fail nếu team dùng convention này.
- `429 Too Many Requests`: bị rate limit.
- `500 Internal Server Error`: lỗi server không mong đợi.
- `503 Service Unavailable`: service/dependency tạm thời không sẵn sàng.

Câu trả lời:

> Em phân biệt rõ `401` và `403`: `401` là chưa xác thực, `403` là không có quyền. Business conflict như duplicate email nên là `409`, validation input có thể dùng `400` hoặc `422` tùy convention team, nhưng phải nhất quán.

### 1.4 API versioning

API versioning dùng khi contract đã có client phụ thuộc và cần thay đổi breaking change.

Cách phổ biến:

```http
/api/v1/users
/api/v2/users
```

Hoặc version bằng header:

```http
Accept: application/vnd.company.v2+json
```

Nguyên tắc:

- Không tạo version mới cho thay đổi backward-compatible.
- Add field mới thường không cần version mới.
- Đổi meaning field, xóa field, đổi response shape lớn thường cần versioning hoặc migration plan.
- Có deprecation policy cho version cũ.

### 1.5 Error response chuẩn

Một API production nên có error format ổn định:

```json
{
  "code": "ORDER_OUT_OF_STOCK",
  "message": "Product is out of stock",
  "requestId": "req_123",
  "details": [
    {
      "field": "productId",
      "reason": "Not enough stock"
    }
  ]
}
```

Lợi ích:

- Frontend xử lý lỗi dễ.
- Log/trace theo `requestId`.
- Không leak internal error.
- Client không phải parse text message.

Không nên:

- Trả raw SQL error.
- Trả stack trace ra client.
- Mỗi endpoint một format lỗi.
- Dùng `500` cho mọi lỗi.

## 2. Idempotency

### 2.1 Idempotency là gì?

Idempotency nghĩa là cùng một request logic gọi nhiều lần vẫn chỉ tạo một kết quả/side effect như gọi một lần.

Ví dụ dễ hiểu:

- `GET /users/1` gọi nhiều lần không thay đổi dữ liệu.
- `DELETE /users/1` gọi lại có thể vẫn trả thành công nếu user đã bị xóa.
- `POST /orders` mặc định không idempotent, gọi lại có thể tạo hai order.

### 2.2 Khi nào cần idempotency?

Cần idempotency khi:

- Create order.
- Payment/charge/refund.
- Webhook từ bên thứ ba.
- Retry từ client.
- Retry từ queue consumer.
- Network timeout nhưng server có thể đã xử lý thành công.

Ví dụ vấn đề:

```text
Client gọi POST /orders
Server tạo order thành công
Response bị timeout trên đường về
Client retry POST /orders
Nếu không có idempotency -> tạo 2 order
```

### 2.3 Cách thiết kế idempotency key

Client gửi key:

```http
POST /orders
Idempotency-Key: user_123:create_order:cart_456
```

Server lưu key:

```sql
CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  status VARCHAR(30) NOT NULL,
  response_body JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Flow:

1. Nhận request.
2. Check idempotency key đã tồn tại chưa.
3. Nếu đã completed, trả lại response cũ.
4. Nếu chưa có, xử lý request trong transaction.
5. Lưu key và kết quả.
6. Nếu request retry, trả lại kết quả đã lưu.

Điểm cần chú ý:

- Key nên gắn với user/account để tránh reuse key sai.
- Có TTL hoặc cleanup key cũ.
- Với request đang processing, cần quyết định trả `409`, chờ, hoặc trả status processing.
- Unique constraint là lớp bảo vệ quan trọng.

Câu trả lời:

> Với request có side effect như payment hoặc create order, em dùng idempotency key. Server lưu key cùng trạng thái/kết quả. Nếu client retry do timeout, server trả lại kết quả cũ thay vì tạo side effect mới.

## 3. Cache và Redis

### 3.1 Cache là gì?

Cache là lớp lưu dữ liệu tạm thời để đọc nhanh hơn và giảm tải cho database hoặc external service.

Cache phù hợp khi:

- Data đọc nhiều, ghi ít hơn.
- Query nặng hoặc external API chậm.
- Chấp nhận stale data trong một khoảng thời gian.
- Có hot data/hot endpoint.

Không nên dùng cache để che thiết kế database/query quá tệ nếu có thể sửa gốc.

### 3.2 Redis là gì?

Redis là in-memory data store, thường dùng cho:

- Cache.
- Session store.
- Rate limit counter.
- Distributed lock.
- Pub/sub đơn giản.
- Queue backend cho một số thư viện.
- Temporary token/OTP.

Ưu điểm:

- Rất nhanh vì lưu trong memory.
- Hỗ trợ TTL.
- Có nhiều data structure: string, hash, list, set, sorted set.

Nhược điểm:

- Memory đắt hơn disk.
- Dữ liệu có thể mất nếu cấu hình persistence/replication không phù hợp.
- Hot key có thể làm nghẽn một shard.
- Redis down có thể ảnh hưởng app nếu không có fallback.

### 3.3 Cache-aside pattern

Cache-aside là pattern phổ biến nhất.

Flow đọc:

```text
App đọc cache
-> cache hit: trả data
-> cache miss: đọc DB
-> ghi data vào cache với TTL
-> trả data
```

Ví dụ:

```ts
async function getUserProfile(userId: string) {
  const key = `user_profile:${userId}`;
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const profile = await userRepository.findProfile(userId);
  await redis.set(key, JSON.stringify(profile), "EX", 300);
  return profile;
}
```

Khi update:

```ts
await userRepository.updateProfile(userId, input);
await redis.del(`user_profile:${userId}`);
```

Vì sao thường delete cache thay vì update cache?

- Đơn giản hơn.
- Tránh cache và DB lệch nếu update cache fail.
- Request sau sẽ rebuild từ DB.

### 3.4 TTL và invalidation

TTL là thời gian cache sống.

TTL ngắn:

- Data fresh hơn.
- Cache hit rate thấp hơn.
- DB load cao hơn.

TTL dài:

- Cache hit rate cao.
- DB load thấp.
- Rủi ro stale data cao.

Invaldiation là xóa/làm mới cache khi data thay đổi.

Cần trả lời được:

- Cache key là gì?
- TTL bao lâu?
- Khi update data thì invalidation ở đâu?
- Nếu cache stale, business có chấp nhận không?

### 3.5 Cache stale

Cache stale là cache trả dữ liệu cũ.

Ví dụ:

```text
User đổi display name
DB đã update
Cache profile vẫn là tên cũ
UI hiển thị sai
```

Cách xử lý:

- TTL hợp lý.
- Delete cache sau write.
- Event-based invalidation.
- Versioned key nếu cần.
- Với data critical, không dùng cache hoặc chỉ cache read model được kiểm soát.

### 3.6 Cache stampede

Cache stampede xảy ra khi một key hot hết hạn, nhiều request cùng miss cache và cùng query DB.

Ví dụ:

```text
homepage_feed hết TTL
1000 request cùng lúc miss cache
1000 request cùng query DB
DB spike
```

Cách xử lý:

- TTL jitter: thêm random TTL để key không hết hạn cùng lúc.
- Lock khi rebuild cache: chỉ một request rebuild, request khác chờ hoặc dùng stale data.
- Serve stale while revalidate.
- Pre-warm cache cho key cực hot.

### 3.7 Hot key

Hot key là key bị truy cập quá nhiều, ví dụ video viral counter hoặc homepage feed.

Rủi ro:

- Một Redis shard quá tải.
- Latency tăng.
- Cache cluster mất cân bằng.

Cách xử lý:

- Local cache ngắn hạn.
- Chia key thành nhiều shard key.
- Batch update counter.
- CDN/edge cache nếu là public content.

### 3.8 Cache penetration và cache avalanche

Cache penetration: request hỏi data không tồn tại, cache miss liên tục, DB bị đánh.

Cách xử lý:

- Cache negative result với TTL ngắn.
- Bloom filter cho hệ thống rất lớn.
- Validate input sớm.

Cache avalanche: nhiều key hết hạn cùng lúc hoặc cache cluster down, DB nhận traffic lớn.

Cách xử lý:

- TTL jitter.
- Preload/warm cache.
- Rate limit/backpressure.
- Fallback/degrade.

## 4. Session, token và Redis

### 4.1 Session server-side

Session server-side lưu trạng thái đăng nhập ở server/cache, client giữ session id trong cookie.

Ưu điểm:

- Server revoke session dễ.
- Không phải đưa nhiều claim vào token.
- Phù hợp khi cần kiểm soát session tập trung.

Nhược điểm:

- Cần session store như Redis.
- Redis down có thể ảnh hưởng login/session.
- Cần scale session store.

### 4.2 JWT stateless

JWT chứa claim và server verify bằng secret/public key, không nhất thiết lookup DB mỗi request.

Ưu điểm:

- Stateless ở API layer.
- Phù hợp distributed service.
- Dễ scale API stateless.

Nhược điểm:

- Revoke khó hơn nếu không có denylist/version.
- Token lộ thì dùng được đến khi hết hạn.
- Payload lớn làm request nặng hơn.

Thực tế thường dùng:

- Access token ngắn hạn.
- Refresh token có rotation/revoke.
- Redis/DB lưu denylist hoặc token version nếu cần revoke.

### 4.3 OTP và temporary token

Redis phù hợp lưu OTP:

```text
otp:login:user_123 -> 123456 TTL 5 minutes
```

Cần chú ý:

- TTL ngắn.
- Rate limit gửi/verify OTP.
- Không log OTP.
- Hash OTP nếu security requirement cao.
- Giới hạn số lần nhập sai.

## 5. Rate limit

### 5.1 Rate limit là gì?

Rate limit giới hạn số request trong một khoảng thời gian để bảo vệ hệ thống khỏi abuse, brute force hoặc traffic spike.

Dùng cho:

- Login.
- Register.
- OTP.
- Password reset.
- Public API.
- Expensive endpoint.

### 5.2 Rate limit key

Key có thể theo:

- IP.
- User id.
- API key/client id.
- Email/account.
- Route/action.
- Device/session.

Không nên chỉ dùng một key cho mọi trường hợp.

Ví dụ login:

```text
login_fail:ip:1.2.3.4
login_fail:email_hash:abc123
login_fail:user:42
```

### 5.3 Algorithms

Fixed window:

- Đếm request trong window cố định.
- Đơn giản.
- Có thể burst ở biên window.

Sliding window:

- Đếm request trong khoảng thời gian trượt.
- Chính xác hơn fixed window.
- Tốn tài nguyên hơn.

Token bucket:

- Bucket có token refill theo thời gian.
- Request dùng token.
- Cho phép burst có kiểm soát.

Leaky bucket:

- Request chảy ra với tốc độ ổn định.
- Làm mượt traffic.

### 5.4 Thiết kế rate limit login

Flow:

```text
login request
-> check IP limiter
-> check account/email limiter
-> verify credential
-> nếu fail: increment counters
-> nếu fail nhiều: delay/captcha/lock tạm thời
-> nếu success: reset counter phù hợp
```

Cần chú ý:

- Chỉ limit theo IP không đủ vì NAT/shared office.
- Chỉ limit theo account có thể bị attacker lock account người khác.
- Response không nên tiết lộ email tồn tại hay không.
- Log security event.
- Có fallback nếu Redis down.

Câu trả lời:

> Với login, em rate limit theo nhiều chiều: IP, account/email và có thể device/session. Sau nhiều lần fail thì tăng delay, captcha hoặc lock tạm thời. Response phải chung chung để không leak account existence. Redis thường dùng để lưu counter TTL.

## 6. Distributed lock

### 6.1 Distributed lock là gì?

Distributed lock là cơ chế để nhiều instance cùng chạy nhưng chỉ một instance được xử lý một resource/critical section tại một thời điểm.

Dùng khi:

- Chỉ một worker rebuild cache hot key.
- Job scheduled chỉ nên chạy một instance.
- Xử lý cùng một order/webhook tránh trùng.
- Critical section ngắn và có thể retry.

### 6.2 Lưu ý khi dùng lock

Lock phải có TTL để tránh dead lock nếu process chết.

Critical section phải ngắn.

Lock release phải đúng owner.

Không nên chỉ dựa vào lock cho consistency quan trọng. DB constraint/idempotency vẫn cần là lớp bảo vệ cuối.

Ví dụ:

```text
try acquire lock order:123 TTL 30s
-> success: process order
-> release lock nếu còn owner
-> fail: retry later
```

### 6.3 Khi không nên dùng distributed lock

Không nên dùng lock để che thiết kế dữ liệu sai.

Nếu bài toán có thể giải bằng:

- Unique constraint.
- Atomic update.
- Transaction.
- Idempotency key.

Thì nên ưu tiên các cơ chế database chắc chắn hơn.

## 7. Queue và background job

### 7.1 Queue là gì?

Queue là hàng đợi để tách producer và consumer. Producer đẩy job/message vào queue, consumer xử lý sau.

Dùng queue khi:

- Task chậm không nên block request.
- Cần retry.
- Cần absorb traffic spike.
- Cần xử lý async.
- Cần fanout sang nhiều worker.

Ví dụ:

- Send email.
- Push notification.
- Process uploaded file.
- Generate report.
- Sync external service.
- Resize image/video.

### 7.2 Request sync vs async

Xử lý sync khi:

- User cần kết quả ngay.
- Task nhanh và ổn định.
- Failure phải trả ngay cho user.

Xử lý async khi:

- Task lâu.
- Có thể retry.
- User chỉ cần job id/status.
- Task phụ không ảnh hưởng kết quả chính.

Ví dụ import file:

```text
Client upload file
-> API tạo import_job
-> API push job vào queue
-> API trả jobId
-> Worker xử lý file
-> UI poll progress
```

### 7.3 Retry, backoff và DLQ

Retry dùng cho lỗi tạm thời:

- Network timeout.
- External service 503.
- DB deadlock transient.

Không nên retry vô hạn lỗi permanent:

- Email format sai.
- Data validation fail.
- Permission denied.

Backoff:

- Retry lần sau chậm hơn lần trước.
- Thêm jitter để tránh retry storm.

DLQ - Dead Letter Queue:

- Nơi chứa message xử lý thất bại sau số lần retry tối đa.
- Cần alert/dashboard.
- Có quy trình reprocess hoặc discard.

### 7.4 Idempotent consumer

Consumer phải idempotent vì message có thể duplicate.

Cách làm:

- Message có `eventId`.
- Lưu processed event id.
- Dùng unique constraint.
- Upsert thay vì insert mù.
- Check business state trước khi update.

Ví dụ:

```sql
CREATE TABLE processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Flow:

```text
BEGIN
insert event_id vào processed_events
nếu duplicate -> bỏ qua
xử lý side effect
COMMIT
```

Câu trả lời:

> Queue thường đảm bảo at-least-once delivery, nên consumer có thể nhận duplicate message. Vì vậy consumer phải idempotent bằng event id, unique constraint, upsert hoặc kiểm tra state trước khi side effect.

## 8. Kafka và event streaming

### 8.1 Kafka là gì?

Kafka là distributed event streaming platform. Kafka lưu event theo topic, chia topic thành partition, consumer đọc event theo offset.

Kafka phù hợp khi:

- Throughput cao.
- Nhiều consumer cùng đọc một dòng event.
- Cần event log/audit.
- Cần xử lý stream dữ liệu.
- Cần ordering theo key trong partition.

Không nhất thiết cần Kafka khi:

- Chỉ có vài background job đơn giản.
- Team chưa có kinh nghiệm vận hành.
- Workload phù hợp với queue đơn giản như SQS/RabbitMQ/BullMQ.

### 8.2 Topic, partition, producer, consumer

Topic là dòng event, ví dụ `order-events`.

Producer ghi event vào topic.

Consumer đọc event từ topic.

Partition là đơn vị scale và ordering.

Consumer group cho phép nhiều consumer chia nhau đọc partition.

Offset là vị trí consumer đã đọc.

### 8.3 Ordering trong Kafka

Kafka đảm bảo thứ tự trong cùng một partition, không đảm bảo global ordering trên toàn topic.

Nếu muốn event của cùng một order đúng thứ tự:

```text
key = order_id
```

Các event cùng `order_id` sẽ vào cùng partition.

Trade-off:

- Key quá hot làm một partition nóng.
- Tăng partition giúp throughput nhưng không có global order.

### 8.4 Kafka duplicate và exactly-once

Trong thực tế, vẫn nên thiết kế consumer idempotent.

Lý do:

- Producer retry có thể duplicate.
- Consumer xử lý xong nhưng commit offset fail.
- Rebalance consumer group có thể xử lý lại.

Câu trả lời:

> Dù Kafka có nhiều cơ chế delivery guarantee, trong thiết kế backend em vẫn coi message có thể duplicate. Consumer phải idempotent, dùng event id/unique constraint/upsert để retry an toàn.

### 8.5 Kafka vs RabbitMQ vs queue đơn giản

Kafka:

- Mạnh về event streaming, throughput cao, nhiều consumer, retention event log.
- Vận hành phức tạp hơn.

RabbitMQ:

- Mạnh về message routing, work queue, ack/retry.
- Phù hợp job/message queue truyền thống.

SQS/BullMQ/queue đơn giản:

- Dễ dùng hơn cho background job.
- Ít phù hợp hơn nếu cần event streaming phức tạp.

Không nên chọn Kafka chỉ vì "hệ thống lớn". Chọn theo workload.

## 9. Transactional Outbox

### 9.1 Vấn đề outbox giải quyết

Vấn đề:

```text
Service update DB thành công
Service publish event thất bại
```

Kết quả: business data đã thay đổi nhưng service khác không nhận được event.

Ví dụ:

- Order đã tạo.
- Event `OrderCreated` không publish.
- Notification/search/analytics không biết order mới.

### 9.2 Outbox pattern là gì?

Outbox pattern ghi business data và event vào cùng DB transaction.

Flow:

```text
BEGIN
insert order
insert outbox_events(OrderCreated)
COMMIT

Outbox worker đọc event pending
-> publish vào Kafka/queue
-> mark published
```

Ví dụ table:

```sql
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP
);
```

Ưu điểm:

- Không mất event khi DB commit thành công.
- Event publish có thể retry.
- Tách transaction DB khỏi broker availability.

Nhược điểm:

- Thêm table/worker.
- Event có thể duplicate nếu publish xong nhưng mark published fail.
- Consumer vẫn phải idempotent.

Câu trả lời:

> Outbox đảm bảo business data và ý định publish event được commit cùng nhau. Worker publish event sau. Nếu publish duplicate, consumer idempotent xử lý. Pattern này tránh lỗi DB commit xong nhưng publish event fail.

## 10. Backend performance

### 10.1 Cách debug API chậm

Không tối ưu theo cảm tính. Quy trình:

1. Xác định endpoint nào chậm.
2. Nhìn p95/p99 latency, error rate, time window.
3. Dùng tracing/log để tách thời gian: app, DB, cache, external API.
4. Kiểm tra slow query và N+1.
5. Kiểm tra payload size và serialization.
6. Kiểm tra event loop block/CPU.
7. Kiểm tra connection pool.
8. Kiểm tra queue lag nếu flow async.
9. Fix bottleneck thật.
10. Đo lại sau khi fix.

### 10.2 Nguyên nhân thường gặp

- Query thiếu index.
- N+1 query.
- External API chậm.
- Gọi dependency tuần tự dù độc lập.
- JSON payload quá lớn.
- CPU-bound task block event loop.
- Cache hit rate thấp.
- DB connection pool hết.
- Lock contention.
- Queue lag.
- Log quá nhiều hoặc log sync.

### 10.3 Cách tối ưu

- Tối ưu query/index.
- Batch query.
- Dùng `Promise.all` có kiểm soát cho task độc lập.
- Cache data read-heavy.
- Đưa task lâu vào queue.
- Stream file/payload lớn.
- Cursor pagination.
- Timeout/retry/circuit breaker.
- Giới hạn concurrency.
- Scale ngang stateless service nếu bottleneck là app CPU/RPS.

### 10.4 Timeout, retry và circuit breaker

Timeout:

- Mọi external call nên có timeout.
- Không để request treo vô hạn.

Retry:

- Chỉ retry lỗi tạm thời.
- Dùng exponential backoff và jitter.
- Không retry vô điều kiện request không idempotent.

Circuit breaker:

- Nếu dependency fail liên tục, tạm dừng gọi.
- Fail fast hoặc fallback.
- Tránh cascade failure.

Câu trả lời:

> Với external service, em đặt timeout rõ ràng. Retry chỉ dùng cho lỗi tạm thời và phải có backoff. Với request có side effect thì cần idempotency trước khi retry. Circuit breaker giúp fail fast khi dependency đang lỗi, tránh kéo sập toàn bộ service.

### 10.5 Backpressure

Backpressure là cơ chế làm chậm producer khi consumer/downstream xử lý không kịp.

Ví dụ:

- API nhận request nhanh hơn DB ghi.
- Worker đọc queue nhanh hơn external service xử lý.
- Stream đọc file nhanh hơn DB insert batch.

Cách xử lý:

- Giới hạn concurrency.
- Queue buffer.
- Rate limit.
- Stream backpressure.
- Circuit breaker.
- Trả `429` hoặc degrade khi quá tải.

## 11. Security backend

### 11.1 Input validation

Mọi input từ client/external system đều không đáng tin.

Cần validate:

- Body.
- Query.
- Params.
- Headers quan trọng.
- File upload.
- Webhook payload.

Không chỉ validate format, còn phải validate business rule ở service layer.

### 11.2 Output serialization

Không trả entity nội bộ trực tiếp nếu có field nhạy cảm.

Ví dụ không được leak:

- `passwordHash`
- `refreshTokenHash`
- internal flags
- secret config
- PII không cần thiết

### 11.3 Auth, CORS, CSRF

Cần nắm:

- Auth xác định user là ai.
- Authz xác định user được làm gì.
- CORS không phải cơ chế auth, chỉ là browser policy.
- Nếu dùng cookie-based auth, cần quan tâm CSRF.
- Nếu dùng token trong browser, cần quan tâm XSS.

### 11.4 File upload security

Cần:

- Giới hạn size.
- Kiểm tra MIME/type và extension.
- Không tin file name từ client.
- Scan virus nếu domain yêu cầu.
- Lưu vào object storage, không lưu bừa vào server disk.
- Không cho execute uploaded file.
- Dùng presigned URL nếu phù hợp.

## 12. Câu hỏi phỏng vấn hay gặp

### Khi nào dùng queue thay vì xử lý trực tiếp trong request?

Dùng queue khi task lâu, không cần trả kết quả ngay, cần retry, cần absorb traffic spike hoặc task phụ như email/notification/report/import file. Request chỉ tạo job và trả `jobId`, worker xử lý async và cập nhật trạng thái.

### Làm sao tránh duplicate message?

Thiết kế consumer idempotent. Message có `eventId`, lưu processed event id hoặc dùng unique constraint/upsert. Không giả định queue/Kafka chỉ gửi đúng một lần.

### Redis cache có rủi ro gì?

Rủi ro gồm stale data, cache stampede, hot key, memory eviction, Redis down và cache avalanche. Cần TTL, invalidation, TTL jitter, lock khi rebuild cache, metric hit rate và fallback/degrade strategy.

### Rate limit login nên thiết kế thế nào?

Rate limit theo nhiều chiều: IP, email/account, user/device nếu có. Sau nhiều lần fail thì delay/captcha/lock tạm thời. Response không tiết lộ account tồn tại hay không. Redis lưu counter TTL, có logging security event và fallback khi Redis lỗi.

### Transactional outbox giải quyết vấn đề gì?

Outbox giải quyết lỗi DB commit thành công nhưng publish event thất bại. Ghi business data và outbox event trong cùng transaction, worker publish sau. Consumer vẫn phải idempotent vì event có thể duplicate.

### Debug API chậm như thế nào?

Đầu tiên đo p95/p99, error rate và endpoint bị ảnh hưởng. Dùng tracing/log để tách latency ở app, DB, cache, external API. Kiểm tra slow query, N+1, payload lớn, event loop block, connection pool và queue lag. Fix bottleneck thật rồi đo lại.
