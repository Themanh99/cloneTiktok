# Backend Core Knowledge

File này tập trung vào phần cần hiểu thật sự khi học backend: bản chất, ví dụ thực tế, lỗi hay gặp khi triển khai. Không đi quá sâu vào lý thuyết hàn lâm.

---

# 1. Database

## 1.1 Index là gì?

Index là cấu trúc dữ liệu giúp database tìm dữ liệu nhanh hơn.

Nếu không có index, database thường phải đọc nhiều dòng trong bảng để tìm dữ liệu. Việc này gọi là full table scan.

Ví dụ:

```sql
SELECT * FROM users WHERE email = 'a@gmail.com';
```

Nếu bảng `users` có 10 triệu dòng và không có index trên `email`, database có thể phải quét rất nhiều dòng.

Nếu có index:

```sql
CREATE INDEX idx_users_email ON users(email);
```

Database có thể tìm theo `email` nhanh hơn nhiều.

### Cốt lõi cần nhớ

- Index giúp tăng tốc đọc dữ liệu.
- Index làm chậm ghi dữ liệu vì mỗi lần `INSERT`, `UPDATE`, `DELETE`, database phải cập nhật thêm index.
- Không phải cứ thêm nhiều index là tốt.
- Nên index các cột thường dùng trong `WHERE`, `JOIN`, `ORDER BY`.
- Không nên index cột có quá ít giá trị khác nhau, ví dụ `gender`, `is_active`, nếu query không đủ chọn lọc.

### Ví dụ thực tế

Trong app video:

```sql
SELECT * FROM videos
WHERE user_id = 10
ORDER BY created_at DESC
LIMIT 20;
```

Query này nên có index:

```sql
CREATE INDEX idx_videos_user_created_at
ON videos(user_id, created_at DESC);
```

Vì database cần lọc theo `user_id` rồi sắp xếp theo `created_at`.

### Vấn đề khi triển khai

- Thêm index sai làm tốn RAM/disk.
- Query vẫn chậm nếu index không khớp cách query.
- Index làm tốc độ insert giảm khi hệ thống ghi nhiều.
- Với bảng lớn, tạo index có thể lock bảng hoặc tốn tài nguyên mạnh nếu không dùng cách tạo index phù hợp.

---

## 1.2 B-tree Index

B-tree là loại index phổ biến nhất trong relational database như PostgreSQL, MySQL.

B-tree lưu dữ liệu theo dạng cây cân bằng, giúp tìm kiếm, so sánh, sort, range query nhanh.

Ví dụ B-tree phù hợp với:

```sql
WHERE age = 20
WHERE age > 20
WHERE created_at BETWEEN '2026-01-01' AND '2026-02-01'
ORDER BY created_at DESC
```

### Cốt lõi cần nhớ

B-tree mạnh với:

- Tìm bằng `=`.
- So sánh `>`, `<`, `>=`, `<=`.
- Range query.
- Sort theo thứ tự index.
- Prefix trong compound index.

B-tree không luôn hiệu quả với:

- `LIKE '%abc'` vì wildcard ở đầu.
- Query dùng function trên cột nếu không có functional index.

Ví dụ query này có thể không dùng index thường:

```sql
SELECT * FROM users WHERE LOWER(email) = 'a@gmail.com';
```

Nếu cần query như vậy thường xuyên, nên tạo functional index:

```sql
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
```

---

## 1.3 Compound Index

Compound index là index gồm nhiều cột.

Ví dụ:

```sql
CREATE INDEX idx_videos_user_status_created
ON videos(user_id, status, created_at DESC);
```

Index này hữu ích cho query:

```sql
SELECT * FROM videos
WHERE user_id = 10
AND status = 'PUBLIC'
ORDER BY created_at DESC;
```

### Quy tắc quan trọng: leftmost prefix

Với index:

```sql
(user_id, status, created_at)
```

Database dễ dùng index cho:

```sql
WHERE user_id = 10
```

```sql
WHERE user_id = 10 AND status = 'PUBLIC'
```

```sql
WHERE user_id = 10 AND status = 'PUBLIC'
ORDER BY created_at DESC
```

Nhưng có thể không dùng tốt index nếu query bỏ qua cột đầu:

```sql
WHERE status = 'PUBLIC'
```

Vì `status` không phải cột đầu tiên của index.

### Thứ tự cột trong compound index

Thường đặt theo thứ tự:

1. Cột lọc bằng `=`.
2. Cột có độ chọn lọc cao.
3. Cột dùng range hoặc sort.

Ví dụ feed:

```sql
SELECT * FROM videos
WHERE status = 'PUBLIC'
AND created_at < '2026-06-01'
ORDER BY created_at DESC
LIMIT 20;
```

Index hợp lý:

```sql
CREATE INDEX idx_videos_status_created
ON videos(status, created_at DESC);
```

### Lỗi hay gặp

- Tạo index `(created_at, user_id)` nhưng query lại `WHERE user_id = ? ORDER BY created_at`.
- Tạo quá nhiều compound index gần giống nhau.
- Không kiểm tra bằng `EXPLAIN`.
- Dùng index nhưng vẫn sort lại vì thứ tự index không khớp `ORDER BY`.

---

## 1.4 EXPLAIN

`EXPLAIN` cho biết database định chạy query như thế nào.

Ví dụ:

```sql
EXPLAIN ANALYZE
SELECT * FROM videos
WHERE user_id = 10
ORDER BY created_at DESC
LIMIT 20;
```

### Khi đọc EXPLAIN cần nhìn gì?

#### 1. Scan type

Các kiểu thường gặp:

- `Seq Scan`: quét tuần tự toàn bảng. Có thể chậm nếu bảng lớn.
- `Index Scan`: dùng index để tìm dữ liệu.
- `Index Only Scan`: chỉ đọc index, không cần đọc bảng. Thường rất nhanh.
- `Bitmap Index Scan`: dùng index để gom danh sách dòng rồi đọc bảng.

#### 2. Rows

Xem database ước lượng bao nhiêu dòng và thực tế trả bao nhiêu dòng.

Nếu estimate sai quá nhiều, query planner có thể chọn plan xấu.

#### 3. Cost

Cost là chi phí ước lượng, không phải thời gian thật. Dùng để database so sánh các plan.

#### 4. Actual time

Với `EXPLAIN ANALYZE`, đây là thời gian chạy thật.

#### 5. Sort

Nếu thấy database phải sort nhiều dòng, có thể cần index hỗ trợ `ORDER BY`.

#### 6. Filter

Nếu thấy database đọc nhiều dòng rồi filter bỏ nhiều dòng, index có thể chưa đủ tốt.

### Ví dụ vấn đề

Query:

```sql
SELECT * FROM comments
WHERE video_id = 100
ORDER BY created_at DESC
LIMIT 50;
```

Nếu `EXPLAIN` cho thấy:

```text
Seq Scan on comments
Sort
```

Nghĩa là database đang quét nhiều comments rồi sort. Index nên có:

```sql
CREATE INDEX idx_comments_video_created
ON comments(video_id, created_at DESC);
```

---

## 1.5 Transaction

Transaction là nhóm nhiều thao tác database được coi như một đơn vị. Hoặc tất cả thành công, hoặc tất cả rollback.

Ví dụ chuyển tiền:

```sql
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

COMMIT;
```

Nếu dòng thứ hai lỗi, cần rollback để không bị mất tiền:

```sql
ROLLBACK;
```

### ACID

Transaction có 4 tính chất:

- Atomicity: tất cả thành công hoặc tất cả thất bại.
- Consistency: dữ liệu sau transaction vẫn hợp lệ.
- Isolation: transaction không làm hỏng nhau khi chạy đồng thời.
- Durability: commit rồi thì dữ liệu được lưu bền vững.

### Ví dụ thực tế

User like video:

1. Thêm record vào `likes`.
2. Tăng `like_count` trong `videos`.

Nếu chỉ insert like thành công nhưng tăng count fail, dữ liệu lệch. Nên dùng transaction.

```sql
BEGIN;

INSERT INTO likes(user_id, video_id) VALUES (1, 10);
UPDATE videos SET like_count = like_count + 1 WHERE id = 10;

COMMIT;
```

### Lỗi hay gặp

- Transaction quá dài, giữ lock lâu.
- Gọi API bên ngoài trong transaction, làm transaction chậm và dễ timeout.
- Không xử lý retry khi deadlock.
- Không dùng transaction cho flow cập nhật nhiều bảng liên quan.

---

## 1.6 Isolation Level

Isolation level quyết định transaction này nhìn thấy dữ liệu của transaction khác như thế nào.

Các vấn đề thường gặp:

### Dirty Read

Transaction A đọc dữ liệu chưa commit từ transaction B. Nếu B rollback, A đã đọc dữ liệu sai.

### Non-repeatable Read

Transaction A đọc cùng một dòng 2 lần nhưng ra kết quả khác nhau vì transaction B đã update và commit giữa chừng.

### Phantom Read

Transaction A chạy cùng một query 2 lần nhưng lần sau xuất hiện thêm dòng mới do transaction B insert.

### Lost Update

Hai transaction cùng đọc một giá trị, cùng update, update sau ghi đè update trước.

Ví dụ:

- Like count ban đầu = 10.
- Request A đọc 10, tính thành 11.
- Request B đọc 10, tính thành 11.
- Cả hai update thành 11.
- Đúng ra phải là 12.

### Các isolation level phổ biến

#### Read Uncommitted

Ít dùng. Có thể đọc dữ liệu chưa commit.

#### Read Committed

Chỉ đọc dữ liệu đã commit. Đây là mức phổ biến trong nhiều database.

#### Repeatable Read

Trong cùng transaction, đọc lại cùng dữ liệu thường thấy cùng kết quả.

#### Serializable

Mức chặt nhất, gần như các transaction chạy tuần tự. An toàn hơn nhưng chậm hơn và dễ conflict hơn.

### Cách xử lý thực tế

Với counter:

```sql
UPDATE videos
SET like_count = like_count + 1
WHERE id = 10;
```

Cách này tốt hơn đọc count ra app rồi ghi lại.

Với nghiệp vụ cần chắc chắn không trùng:

- Dùng unique constraint.
- Dùng transaction.
- Dùng row lock nếu cần.
- Retry khi deadlock hoặc serialization failure.

Ví dụ tránh like trùng:

```sql
CREATE UNIQUE INDEX unique_user_video_like
ON likes(user_id, video_id);
```

---

## 1.7 Relational DB vs Non-relational DB

## Relational DB

Ví dụ: PostgreSQL, MySQL, SQL Server.

Dữ liệu lưu theo bảng, có schema rõ ràng, quan hệ qua foreign key.

Phù hợp khi:

- Dữ liệu có quan hệ chặt.
- Cần transaction mạnh.
- Cần query phức tạp.
- Cần consistency cao.

Ví dụ:

- User, order, payment.
- Banking.
- E-commerce.
- Hệ thống cần báo cáo bằng SQL.

Ưu điểm:

- Query mạnh với SQL.
- ACID tốt.
- Dữ liệu nhất quán.
- Dễ enforce constraint.

Nhược điểm:

- Scale ngang phức tạp hơn.
- Schema thay đổi cần migration.
- Không phải lúc nào cũng phù hợp với dữ liệu phi cấu trúc.

## Non-relational DB

Ví dụ: MongoDB, Cassandra, DynamoDB, Redis.

Dữ liệu không nhất thiết theo bảng quan hệ. Có thể là document, key-value, wide-column, graph.

Phù hợp khi:

- Dữ liệu linh hoạt, thay đổi nhiều.
- Cần scale ngang lớn.
- Truy cập theo pattern đơn giản.
- Cần tốc độ cao với key-value.

Ví dụ:

- Redis cho cache/session/rate limit.
- MongoDB cho document linh hoạt.
- Cassandra/DynamoDB cho workload ghi cực lớn.

Ưu điểm:

- Linh hoạt schema.
- Scale ngang tốt hơn trong nhiều use case.
- Tối ưu cho một số pattern cụ thể.

Nhược điểm:

- Join yếu hoặc không có.
- Transaction có thể hạn chế hơn tùy loại DB.
- Dễ duplicate dữ liệu.
- Query phức tạp không tiện bằng SQL.

### Cách chọn nhanh

Nếu dữ liệu có quan hệ rõ, cần transaction, cần query linh hoạt: chọn PostgreSQL/MySQL.

Nếu cần cache/session/rate limit: chọn Redis.

Nếu dữ liệu document linh hoạt và query theo document: có thể chọn MongoDB.

Nếu hệ thống event/log cực lớn, cần ghi và đọc phân tán: cân nhắc Cassandra/DynamoDB/Elasticsearch tùy bài toán.

---

# 2. Node.js

## 2.1 Event Loop là gì?

Node.js chạy JavaScript trên một main thread. Nhưng Node.js vẫn xử lý được nhiều request cùng lúc vì các tác vụ I/O như đọc file, gọi database, gọi network được giao cho hệ thống/libuv xử lý bất đồng bộ.

Event loop là cơ chế giúp Node.js nhận callback từ các tác vụ async và đưa chúng vào chạy đúng thời điểm.

### Cốt lõi cần nhớ

- JavaScript trong Node.js chạy trên một thread chính.
- I/O async không block main thread.
- CPU-heavy task vẫn block event loop.
- Promise callback chạy trong microtask queue, thường được ưu tiên hơn các callback của phase khác.

Ví dụ:

```js
console.log('start');

setTimeout(() => console.log('timeout'), 0);

Promise.resolve().then(() => console.log('promise'));

console.log('end');
```

Kết quả:

```text
start
end
promise
timeout
```

Vì code sync chạy trước, sau đó microtask của Promise, rồi mới tới timer.

---

## 2.2 6 phase của Event Loop

Event loop trong Node.js thường được mô tả qua 6 phase chính:

## 1. Timers

Chạy callback của `setTimeout` và `setInterval` khi tới hạn.

```js
setTimeout(() => {
  console.log('timer');
}, 1000);
```

## 2. Pending callbacks

Chạy một số callback I/O bị hoãn từ vòng trước.

Phần này ít khi làm việc trực tiếp, nhưng cần biết nó tồn tại.

## 3. Idle, prepare

Dùng nội bộ bởi Node.js/libuv. Thường không cần quan tâm khi code app.

## 4. Poll

Phase quan trọng nhất cho I/O.

Node.js chờ và xử lý callback từ:

- File system.
- Network.
- Database driver.
- HTTP request.

Ví dụ:

```js
fs.readFile('a.txt', () => {
  console.log('file read done');
});
```

Callback này thường được xử lý trong poll phase.

## 5. Check

Chạy callback của `setImmediate`.

```js
setImmediate(() => {
  console.log('immediate');
});
```

## 6. Close callbacks

Chạy callback khi socket/handle bị đóng.

```js
socket.on('close', () => {
  console.log('socket closed');
});
```

### Microtask nằm ở đâu?

Microtask không phải một phase trong 6 phase trên.

Microtask gồm:

- `Promise.then`
- `queueMicrotask`
- `process.nextTick`

Node.js sẽ xử lý microtask sau khi chạy xong một đoạn JavaScript/callback, trước khi chuyển tiếp sang phase khác.

`process.nextTick` còn được ưu tiên rất cao, cao hơn Promise microtask.

Ví dụ:

```js
console.log('start');

setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));

Promise.resolve().then(() => console.log('promise'));

process.nextTick(() => console.log('nextTick'));

console.log('end');
```

Thường thấy:

```text
start
end
nextTick
promise
timeout/immediate
```

Thứ tự giữa `setTimeout(..., 0)` và `setImmediate` có thể thay đổi tùy context. Nếu gọi bên trong I/O callback, `setImmediate` thường chạy trước timer.

---

## 2.3 Promise

Promise đại diện cho một kết quả sẽ có trong tương lai: thành công hoặc thất bại.

Promise có 3 trạng thái:

- Pending.
- Fulfilled.
- Rejected.

Ví dụ:

```js
function getUser() {
  return new Promise((resolve, reject) => {
    resolve({ id: 1, name: 'An' });
  });
}

getUser()
  .then(user => console.log(user))
  .catch(error => console.error(error));
```

Với `async/await`:

```js
async function main() {
  try {
    const user = await getUser();
    console.log(user);
  } catch (error) {
    console.error(error);
  }
}
```

### Cốt lõi cần nhớ

- `async` function luôn trả về Promise.
- `await` chỉ được dùng trong `async` function hoặc top-level module phù hợp.
- `await` không block toàn bộ Node.js, nó chỉ tạm dừng function hiện tại.
- Promise callback chạy trong microtask queue.

### Lỗi hay gặp

#### Quên await

```js
const user = getUser();
console.log(user.name);
```

`user` ở đây là Promise, không phải object user.

Đúng:

```js
const user = await getUser();
console.log(user.name);
```

#### Dùng await tuần tự khi có thể chạy song song

Chậm:

```js
const user = await getUser();
const videos = await getVideos();
```

Nhanh hơn nếu hai tác vụ độc lập:

```js
const [user, videos] = await Promise.all([
  getUser(),
  getVideos(),
]);
```

#### Không catch lỗi async

```js
app.get('/users', async (req, res) => {
  const users = await userService.findAll();
  res.json(users);
});
```

Nếu framework không tự handle error async, request có thể lỗi không kiểm soát. Nên dùng error middleware hoặc wrapper tùy framework.

### Khi nào dùng Promise.all?

Dùng khi các tác vụ độc lập và muốn chạy song song.

```js
const [profile, stats, settings] = await Promise.all([
  getProfile(userId),
  getStats(userId),
  getSettings(userId),
]);
```

Nếu một Promise fail, `Promise.all` fail ngay.

Nếu muốn lấy cả thành công lẫn thất bại:

```js
const results = await Promise.allSettled([
  sendEmail(),
  sendNotification(),
  writeLog(),
]);
```

---

# 3. Redis

Redis là in-memory data store. Dữ liệu chủ yếu nằm trong RAM nên rất nhanh.

Redis thường được dùng làm:

- Cache.
- Session store.
- Rate limiter.
- Distributed lock.
- Pub/Sub.
- Queue nhẹ.
- Counter.

## 3.1 Cache

Cache dùng để giảm tải database và tăng tốc response.

Ví dụ:

```text
Client -> API -> Redis
              -> nếu miss thì query DB
              -> lưu lại Redis
              -> trả response
```

Pseudo code:

```js
async function getUserProfile(userId) {
  const key = `user:${userId}:profile`;

  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const user = await db.user.findUnique({ where: { id: userId } });
  await redis.set(key, JSON.stringify(user), 'EX', 300);

  return user;
}
```

### Cốt lõi cần nhớ

- Cache hit: lấy được từ cache.
- Cache miss: không có cache, phải query DB.
- TTL: thời gian sống của cache.
- Cache invalidation: xóa/cập nhật cache khi dữ liệu gốc thay đổi.

### Vấn đề thực tế

#### Cache stale

User đổi avatar nhưng Redis vẫn lưu avatar cũ.

Cách xử lý:

- Xóa cache khi update.
- Dùng TTL ngắn.
- Dùng version key nếu cần.

#### Cache stampede

Một key hot hết hạn, nhiều request cùng lúc query DB.

Cách xử lý:

- Lock khi rebuild cache.
- Random TTL để key không hết hạn cùng lúc.
- Background refresh.

#### Memory eviction

Redis đầy RAM và phải xóa key theo policy.

Cần cấu hình:

- `maxmemory`.
- `maxmemory-policy`, ví dụ `allkeys-lru`, `volatile-lru`.

---

## 3.2 Session

Redis hay dùng để lưu session vì nhanh và có TTL.

Ví dụ:

```text
session:abc123 -> { userId: 1, role: 'admin' }
```

Khi user logout, xóa key session.

Ưu điểm:

- Dễ revoke session.
- Phù hợp hệ thống nhiều server.
- Có TTL tự hết hạn.

Vấn đề:

- Redis down có thể làm user bị logout hoặc không xác thực được.
- Cần backup/replica nếu session quan trọng.

---

## 3.3 Rate Limit

Giới hạn số request theo user/IP.

Ví dụ: mỗi IP chỉ được login sai 5 lần/phút.

```text
rate:login:ip:1.2.3.4 -> 5
```

Pseudo:

```js
const key = `rate:login:${ip}`;
const count = await redis.incr(key);

if (count === 1) {
  await redis.expire(key, 60);
}

if (count > 5) {
  throw new Error('Too many requests');
}
```

Vấn đề:

- Cần set TTL đúng.
- Cần tránh race condition, dùng lệnh atomic như `INCR`.
- Với nhiều endpoint, cần key rõ ràng.

---

## 3.4 Distributed Lock

Redis lock dùng để đảm bảo chỉ một worker xử lý một việc tại một thời điểm.

Ví dụ: chỉ một server được chạy job tạo report mỗi ngày.

Ý tưởng:

```text
SET lock:daily-report worker-1 NX EX 60
```

Nghĩa là chỉ set key nếu chưa tồn tại, TTL 60 giây.

Vấn đề:

- Lock phải có TTL để tránh chết worker làm kẹt lock mãi.
- Thời gian xử lý không được dài hơn TTL nếu không có cơ chế renew.
- Khi unlock phải đảm bảo chỉ owner của lock được xóa lock.

---

# 4. CI/CD

CI/CD là quy trình tự động hóa kiểm tra, build và deploy code.

CI = Continuous Integration. Mỗi lần push/merge code, hệ thống tự chạy check.

CD = Continuous Delivery/Deployment. Code sau khi qua check được đóng gói và deploy.

## 4.1 Pipeline cơ bản

Một pipeline backend thường gồm:

```text
Push code
-> Install dependencies
-> Lint
-> Test
-> Build
-> Build Docker image
-> Push image
-> Deploy
```

Ví dụ với Node.js:

```text
npm ci
npm run lint
npm run test
npm run build
docker build
docker push
deploy
```

## 4.2 Cốt lõi cần nhớ

- CI giúp phát hiện lỗi sớm trước khi merge.
- CD giúp deploy nhất quán, giảm thao tác tay.
- Pipeline phải fail nhanh nếu code lỗi.
- Secrets không được hard-code trong repo.
- Build artifact phải rõ ràng, cùng một artifact nên được dùng qua các môi trường.

## 4.3 Vấn đề thực tế

### Environment khác nhau

Local chạy được nhưng production lỗi vì:

- Node version khác.
- Env thiếu.
- Database URL sai.
- Build command khác.

Cách xử lý:

- Pin version Node.
- Dùng `.env.example`.
- Validate env khi app start.
- Docker hóa môi trường chạy.

### Migration database

Deploy code mới nhưng schema DB chưa update có thể làm app lỗi.

Cách an toàn:

- Migration nên backward compatible.
- Không xóa cột ngay nếu code cũ còn dùng.
- Deploy theo nhiều bước khi thay đổi lớn.
- Backup trước migration nguy hiểm.

### Rollback

Rollback code không phải lúc nào rollback được DB.

Ví dụ đã migration xóa cột, rollback code cũ sẽ lỗi vì cột không còn.

Cần:

- Có version image cũ.
- Có chiến lược migration an toàn.
- Có monitoring sau deploy.

### Secrets

Không commit:

- API key.
- DB password.
- JWT secret.
- Cloud credentials.

Dùng:

- GitHub Actions Secrets.
- Secret manager.
- Env của platform deploy.

---

# 5. Docker

Docker giúp đóng gói app cùng môi trường chạy vào image. Khi chạy image sẽ tạo container.

## 5.1 Image và Container

Image là bản đóng gói bất biến.

Container là process chạy từ image.

Ví dụ:

```text
Image: node-api:1.0
Container: node-api đang chạy port 3000
```

## 5.2 Dockerfile

Dockerfile mô tả cách build image.

Ví dụ Node.js đơn giản:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "run", "start:prod"]
```

### Cốt lõi cần nhớ

- `FROM`: image nền.
- `WORKDIR`: thư mục làm việc.
- `COPY`: copy file vào image.
- `RUN`: chạy lệnh lúc build image.
- `CMD`: lệnh chạy khi container start.
- `.dockerignore`: loại file không cần copy vào image.

## 5.3 Docker Compose

Compose dùng để chạy nhiều service cùng nhau.

Ví dụ:

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

Trong compose network, service `api` gọi database qua hostname `db`, không phải `localhost`.

## 5.4 Volume

Container có thể bị xóa bất kỳ lúc nào. Nếu dữ liệu quan trọng nằm trong container filesystem, có thể mất.

Volume dùng để lưu dữ liệu bền hơn.

Ví dụ PostgreSQL cần volume:

```yaml
volumes:
  - db_data:/var/lib/postgresql/data
```

## 5.5 Vấn đề thực tế

### Image quá nặng

Nguyên nhân:

- Copy cả `node_modules`.
- Không dùng `.dockerignore`.
- Dùng image nền quá lớn.
- Không multi-stage build.

Cách xử lý:

- Dùng `node:alpine` hoặc slim nếu phù hợp.
- Dùng `.dockerignore`.
- Multi-stage build.
- Chỉ copy file cần thiết.

### Container không sẵn sàng dù đã start

`depends_on` chỉ đảm bảo container db đã start, không đảm bảo database đã ready.

Cần:

- Healthcheck.
- Retry connection trong app.
- Script wait-for nếu cần.

### Dùng localhost sai

Bên trong container, `localhost` là chính container đó.

Nếu API container cần gọi DB container, dùng service name:

```text
postgres://user:pass@db:5432/app
```

Không dùng:

```text
postgres://user:pass@localhost:5432/app
```

### Env khác nhau

Không bake secret vào image.

Sai:

```dockerfile
ENV DATABASE_URL=production-secret-url
```

Đúng:

- Truyền env khi chạy container.
- Dùng secret manager/platform env.

---

# 6. Kafka

Kafka là distributed event streaming platform. Hiểu đơn giản: Kafka là hệ thống log/message broker rất mạnh, dùng để truyền event giữa các service.

## 6.1 Khi nào dùng Kafka?

Dùng Kafka khi muốn tách các service bằng event.

Ví dụ user upload video:

```text
Video Service tạo video
-> publish event video.created
-> Notification Service gửi thông báo
-> Analytics Service ghi thống kê
-> Recommendation Service cập nhật đề xuất
```

Video Service không cần gọi trực tiếp từng service.

## 6.2 Thành phần cốt lõi

### Topic

Topic là nơi chứa event cùng loại.

Ví dụ:

```text
video.created
user.followed
payment.completed
```

### Producer

Service gửi message vào Kafka.

Ví dụ:

```text
Video Service -> Kafka topic video.created
```

### Consumer

Service đọc message từ Kafka.

Ví dụ:

```text
Notification Service đọc topic video.created
```

### Partition

Topic được chia thành nhiều partition để scale.

Mỗi message trong một partition có thứ tự.

Quan trọng:

- Kafka chỉ đảm bảo ordering trong cùng một partition.
- Không đảm bảo ordering toàn topic nếu topic có nhiều partition.

### Consumer Group

Nhiều consumer cùng group sẽ chia nhau đọc partitions.

Ví dụ topic có 3 partition, consumer group có 3 consumer:

```text
consumer-1 đọc partition 0
consumer-2 đọc partition 1
consumer-3 đọc partition 2
```

Nếu có 4 consumer nhưng chỉ 3 partition, 1 consumer sẽ rảnh.

### Offset

Offset là vị trí message đã đọc trong partition.

Consumer commit offset để Kafka biết đã xử lý tới đâu.

## 6.3 Cốt lõi cần nhớ

- Kafka lưu message theo log append-only.
- Message trong partition có thứ tự.
- Consumer tự quản lý tiến độ bằng offset.
- Scale bằng partition.
- Một topic có thể có nhiều consumer group độc lập.

Ví dụ:

```text
topic: video.created

consumer group notification-service đọc để gửi notification
consumer group analytics-service đọc để ghi analytics
consumer group search-service đọc để index search
```

Mỗi group có offset riêng.

## 6.4 Duplicate Message

Kafka có thể gửi lại message trong một số trường hợp.

Ví dụ consumer xử lý xong nhưng chưa kịp commit offset thì chết. Khi restart, nó đọc lại message cũ.

Vì vậy consumer nên idempotent.

Idempotent nghĩa là xử lý lại cùng một message nhiều lần vẫn không gây sai dữ liệu.

Ví dụ gửi notification:

Sai:

```text
Cứ đọc event là insert notification mới.
```

Nếu duplicate, user nhận 2 notification.

Tốt hơn:

```text
Dùng event_id unique.
Nếu event_id đã xử lý thì bỏ qua.
```

## 6.5 Ordering

Kafka chỉ giữ thứ tự trong cùng partition.

Nếu muốn event của cùng một user theo đúng thứ tự, dùng key là `user_id`.

Ví dụ:

```text
key = user_id
```

Kafka sẽ đưa các event cùng key vào cùng partition.

Vấn đề:

- Nếu key phân bố không đều, một partition có thể quá tải.
- Nếu cần ordering toàn hệ thống, Kafka không phải lúc nào phù hợp.

## 6.6 Retry và Dead Letter Queue

Nếu consumer xử lý message lỗi, có vài cách:

- Retry ngay.
- Retry sau một khoảng thời gian.
- Đẩy vào dead letter queue nếu lỗi mãi.

Ví dụ:

```text
video.created
-> xử lý fail
-> retry video.created.retry
-> vẫn fail
-> video.created.dlq
```

Dead letter queue giúp giữ message lỗi để debug sau, không làm kẹt toàn bộ consumer.

## 6.7 Consumer Lag

Consumer lag là khoảng cách giữa message mới nhất và message consumer đã xử lý.

Lag cao nghĩa là consumer xử lý không kịp.

Nguyên nhân:

- Consumer xử lý chậm.
- Partition quá ít.
- Message tăng đột biến.
- Downstream service chậm, ví dụ DB chậm.

Cách xử lý:

- Tối ưu consumer.
- Tăng số partition.
- Tăng số consumer trong group.
- Batch xử lý.
- Tối ưu DB/API downstream.

---

# 7. Tóm tắt học nhanh

## Database

- Index giúp đọc nhanh nhưng ghi chậm hơn.
- B-tree mạnh với `=`, range, sort.
- Compound index phải chú ý thứ tự cột và leftmost prefix.
- Dùng `EXPLAIN ANALYZE` để kiểm tra query thật sự chạy thế nào.
- Transaction bảo vệ dữ liệu khi nhiều thao tác phải thành công cùng nhau.
- Isolation level càng cao càng an toàn nhưng càng dễ conflict/chậm.
- Relational DB phù hợp dữ liệu quan hệ, transaction, SQL phức tạp.
- Non-relational DB phù hợp pattern đặc thù, scale ngang, schema linh hoạt.

## Node.js

- Node.js không mạnh với CPU-heavy task trên main thread.
- Event loop giúp xử lý async I/O.
- 6 phase: timers, pending callbacks, idle/prepare, poll, check, close callbacks.
- Promise chạy qua microtask queue.
- `process.nextTick` ưu tiên cao hơn Promise microtask.
- Dùng `Promise.all` cho các task độc lập.

## Redis

- Redis rất nhanh vì chạy chủ yếu trong RAM.
- Use case chính: cache, session, rate limit, lock, pub/sub, counter.
- Luôn nghĩ về TTL, invalidation, memory, Redis down.
- Dùng atomic command như `INCR`, `SET NX EX`.

## CI/CD

- CI kiểm tra code tự động.
- CD deploy tự động hoặc bán tự động.
- Pipeline cơ bản: install, lint, test, build, docker build, deploy.
- Cẩn thận secrets, migration, rollback, env khác nhau.

## Docker

- Image là bản đóng gói, container là instance đang chạy.
- Dockerfile build image.
- Compose chạy nhiều service.
- Volume giữ dữ liệu bền hơn container.
- Trong container, `localhost` là chính container đó.
- Production cần healthcheck, env rõ ràng, image gọn.

## Kafka

- Kafka dùng để truyền event giữa service.
- Topic chứa message, partition giúp scale, consumer group chia tải.
- Ordering chỉ đảm bảo trong cùng partition.
- Consumer cần idempotent vì message có thể bị xử lý lại.
- Theo dõi consumer lag để biết hệ thống có xử lý kịp không.

---

# 8. Cách học nhanh vào trọng tâm

Nếu chỉ có ít thời gian, học theo thứ tự này:

1. Database index, compound index, EXPLAIN.
2. Transaction, isolation, race condition.
3. Node.js event loop, Promise, async/await.
4. Redis cache, TTL, invalidation, rate limit.
5. Docker image/container/compose/volume/network.
6. CI/CD pipeline, env, secret, migration, rollback.
7. Kafka topic/partition/consumer group/offset, duplicate, ordering, retry.

Mỗi phần nên tự trả lời được 3 câu:

1. Nó giải quyết vấn đề gì?
2. Nó hoạt động cốt lõi thế nào?
3. Khi deploy thật thì dễ lỗi ở đâu?
