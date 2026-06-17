# Kiến Thức Master Database cho Backend Developer

File này là tài liệu canonical cho database trong lộ trình phỏng vấn fullstack/backend. Mục tiêu là hiểu bản chất, biết trade-off, đọc được query plan ở mức cơ bản và nói được cách xử lý vấn đề thực tế.

Các phần liên quan:

- Redis/cache: `06-backend-core-knowledge.md`
- Docker/CI/CD/migration rollout: `04-kiến thức-database-devops.md`
- Transaction boundary trong NestJS: `02-nodejs-NESTJS_MASTERY_GUIDE.md`

## 1. Mức độ cần nắm

### Bắt buộc phải chắc

- Relational database là gì, NoSQL là gì.
- Table, row, column, primary key, foreign key, unique constraint.
- Index là gì, trade-off của index.
- B-tree index, compound index, leftmost prefix.
- `EXPLAIN` dùng để làm gì.
- Transaction và ACID.
- Isolation level và các lỗi concurrency: dirty read, non-repeatable read, phantom read, lost update.
- Locking, optimistic locking.
- N+1 query.
- Offset pagination vs cursor pagination.
- Migration production.

### Nên biết để trả lời senior hơn

- Normalization vs denormalization.
- Read replica, partitioning, sharding.
- Materialized view/report table.
- Connection pool.
- Deadlock.
- Expand/contract migration.
- Idempotency key và unique constraint cho workflow có retry.

## 2. Relational database

### 2.1 Relational database là gì?

Relational database lưu dữ liệu theo bảng, hàng và cột. Các bảng có thể liên kết với nhau bằng khóa chính và khóa ngoại.

Ví dụ:

```text
users
  id
  email

orders
  id
  user_id -> users.id
  status
```

Relational DB phù hợp khi:

- Dữ liệu có quan hệ rõ.
- Cần transaction mạnh.
- Cần constraint để bảo vệ tính đúng đắn.
- Cần query linh hoạt với filter, join, sort, aggregate.

Ví dụ use case:

- User/order/payment.
- Accounting.
- Inventory.
- Permission.
- Booking.

Câu trả lời:

> Relational database phù hợp với dữ liệu có quan hệ và cần consistency mạnh. Điểm mạnh là transaction, constraint, join và query linh hoạt. Với backend business như order, payment, inventory, em thường ưu tiên relational DB nếu không có lý do rõ để chọn NoSQL.

### 2.2 Table, row, column

Table là bảng dữ liệu.

Row là một bản ghi.

Column là thuộc tính của bản ghi.

Ví dụ:

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Điểm cần chú ý:

- Chọn type đúng.
- Không dùng string cho mọi thứ.
- Field bắt buộc nên `NOT NULL`.
- Field có business invariant nên có constraint.
- Cần `created_at`, `updated_at` cho audit/debug.

### 2.3 Primary key, foreign key, unique constraint

Primary key định danh duy nhất một row.

Foreign key đảm bảo quan hệ giữa bảng.

Unique constraint đảm bảo giá trị không bị trùng.

Ví dụ:

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  status VARCHAR(30) NOT NULL
);
```

Tại sao constraint quan trọng?

- Backend validation có thể có bug.
- Race condition có thể vượt qua check ở application.
- Constraint là lớp bảo vệ cuối cùng ở database.

Ví dụ race condition:

```text
Request A check email chưa tồn tại
Request B check email chưa tồn tại
A insert email
B insert email
```

Nếu không có unique constraint, duplicate email có thể xảy ra.

### 2.4 Normalization

Normalization là thiết kế dữ liệu để giảm duplicate và tránh update anomaly.

Ví dụ tốt:

```text
users(id, email, name)
orders(id, user_id, total)
```

Không lưu `user_email`, `user_name` lặp lại trong mọi order nếu không có lý do.

Ưu điểm:

- Dữ liệu nhất quán hơn.
- Ít duplicate.
- Update một nơi.

Nhược điểm:

- Query có thể cần join.
- Với read-heavy path, join nhiều có thể chậm nếu không tối ưu.

### 2.5 Denormalization

Denormalization là cố tình lưu trùng dữ liệu để tối ưu read path.

Ví dụ:

- Lưu `author_name` trong `posts`.
- Lưu `comment_count`, `like_count`.
- Tạo bảng `daily_order_summary`.
- Materialized view cho báo cáo.

Ưu điểm:

- Đọc nhanh hơn.
- Giảm join/aggregate nặng.

Nhược điểm:

- Ghi phức tạp hơn.
- Có thể stale data.
- Cần job/event để đồng bộ.

Câu trả lời:

> Em ưu tiên normalization cho dữ liệu core cần consistency. Với read-heavy path như counter, feed, report, em có thể denormalize nhưng phải chấp nhận trade-off là ghi phức tạp hơn và cần cơ chế đồng bộ/eventual consistency.

## 3. SQL query cơ bản nhưng phải chắc

### 3.1 SELECT, INSERT, UPDATE, DELETE

Ví dụ:

```sql
SELECT id, email
FROM users
WHERE email = 'a@example.com';

INSERT INTO users(email, display_name)
VALUES ('a@example.com', 'Alice');

UPDATE users
SET display_name = 'Alice Nguyen'
WHERE id = 1;

DELETE FROM users
WHERE id = 1;
```

Cần chú ý:

- Tránh `SELECT *` trong API nếu không cần tất cả field.
- `UPDATE`/`DELETE` luôn phải cẩn thận với `WHERE`.
- Với soft delete, query phải filter `deleted_at IS NULL`.

### 3.2 JOIN

`INNER JOIN`: chỉ lấy row match ở hai bảng.

`LEFT JOIN`: lấy tất cả row ở bảng trái, bảng phải không có thì null.

Ví dụ:

```sql
SELECT orders.id, users.email, orders.total_amount
FROM orders
INNER JOIN users ON users.id = orders.user_id
WHERE orders.status = 'paid';
```

Join chậm thường do:

- Thiếu index trên join key.
- Join quá nhiều row trước khi filter.
- Query trả quá nhiều column.
- Statistics sai/cũ.
- N+1 ở ORM thay vì join/batch đúng cách.

### 3.3 Aggregation

Ví dụ:

```sql
SELECT user_id, COUNT(*) AS total_orders
FROM orders
WHERE status = 'paid'
GROUP BY user_id;
```

Aggregation trên bảng lớn có thể nặng. Cách xử lý:

- Index/filter tốt.
- Pre-aggregate theo ngày/tháng.
- Materialized view.
- Report table cập nhật async.

## 4. NoSQL

### 4.1 NoSQL là gì?

NoSQL là nhóm database không theo mô hình relational truyền thống. Có nhiều loại:

- Document DB: MongoDB.
- Key-value: Redis, DynamoDB style.
- Wide-column: Cassandra.
- Graph DB: Neo4j.
- Search engine: Elasticsearch/OpenSearch.

Không nên nói NoSQL luôn nhanh hơn SQL. NoSQL nhanh khi data model và access pattern phù hợp.

### 4.2 MongoDB/document database

MongoDB lưu dữ liệu dạng document.

Phù hợp khi:

- Dữ liệu dạng aggregate/document.
- Schema thay đổi nhanh.
- Đọc/ghi theo document là chính.
- Quan hệ không quá phức tạp.

Ví dụ:

```json
{
  "_id": "post_1",
  "title": "Hello",
  "author": {
    "id": "user_1",
    "name": "Alice"
  },
  "tags": ["nodejs", "backend"]
}
```

Ưu điểm:

- Linh hoạt schema.
- Lưu aggregate tự nhiên.
- Tránh join cho một số use case.

Nhược điểm:

- Quan hệ phức tạp khó hơn relational DB.
- Document quá lớn gây vấn đề.
- Consistency/transaction tùy cách dùng.
- Query không có index vẫn chậm.

### 4.3 SQL vs NoSQL chọn thế nào?

Chọn theo:

- Access pattern.
- Consistency requirement.
- Quan hệ dữ liệu.
- Transaction requirement.
- Scale pattern.
- Team experience.

Câu trả lời:

> Nếu dữ liệu có quan hệ rõ và cần transaction/constraint mạnh, em chọn SQL. Nếu dữ liệu theo document aggregate, schema linh hoạt và access pattern rõ, NoSQL có thể phù hợp. Em không chọn NoSQL chỉ vì nghĩ nó nhanh hơn; phải dựa vào cách đọc/ghi dữ liệu.

## 5. Index

### 5.1 Index là gì?

Index là cấu trúc dữ liệu giúp database tìm row nhanh hơn thay vì scan toàn bộ bảng.

Ví dụ:

```sql
SELECT *
FROM users
WHERE email = 'a@example.com';
```

Nếu bảng có 10 triệu row và không có index trên `email`, database có thể phải đọc rất nhiều row.

Tạo index:

```sql
CREATE INDEX idx_users_email ON users(email);
```

Ưu điểm:

- Tăng tốc query đọc.
- Tăng tốc filter/join/sort nếu index phù hợp.
- Giúp unique constraint hoạt động hiệu quả.

Nhược điểm:

- Làm chậm write vì insert/update/delete phải cập nhật index.
- Tốn disk/RAM.
- Index sai không giúp query.
- Quá nhiều index làm database nặng hơn.

Câu trả lời:

> Index giúp database tìm dữ liệu nhanh hơn, nhưng không miễn phí. Nó tăng tốc đọc nhưng làm chậm ghi và tốn storage. Em tạo index dựa trên query thật: WHERE, JOIN, ORDER BY, không tạo theo cảm tính.

### 5.2 B-tree index

B-tree là loại index phổ biến trong PostgreSQL/MySQL.

Phù hợp với:

- Equality: `email = ?`
- Range: `created_at >= ?`
- Sort: `ORDER BY created_at`
- Prefix của compound index.

Ví dụ:

```sql
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

Query dùng tốt:

```sql
SELECT *
FROM orders
WHERE created_at >= '2026-01-01'
ORDER BY created_at DESC;
```

Không hiệu quả trong một số trường hợp:

```sql
WHERE LOWER(email) = 'a@example.com'
```

Nếu dùng function trên column, index thường có thể không dùng được trừ khi có functional index:

```sql
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
```

### 5.3 Compound index

Compound index là index gồm nhiều cột.

Ví dụ:

```sql
CREATE INDEX idx_videos_user_status_created
ON videos(user_id, status, created_at DESC);
```

Query phù hợp:

```sql
SELECT id, title
FROM videos
WHERE user_id = 10
  AND status = 'published'
ORDER BY created_at DESC
LIMIT 20;
```

Vì:

- `user_id` và `status` là equality filter.
- `created_at DESC` hỗ trợ sort và limit.

### 5.4 Leftmost prefix

Với index `(user_id, status, created_at)`:

Dùng tốt:

```sql
WHERE user_id = ?
WHERE user_id = ? AND status = ?
WHERE user_id = ? AND status = ? ORDER BY created_at
```

Không tốt bằng:

```sql
WHERE status = ?
WHERE created_at > ?
```

Vì query không bắt đầu từ cột trái nhất của index.

Câu trả lời:

> Với compound index, thứ tự cột rất quan trọng. Database thường dùng tốt prefix từ trái sang phải. Em đặt các equality filter có selectivity tốt trước, sau đó đến range/sort field tùy query.

### 5.5 Selectivity

Selectivity là độ chọn lọc của column.

Column có selectivity cao:

- email.
- phone.
- user_id trong bảng lớn.

Column có selectivity thấp:

- gender.
- boolean `is_active` nếu 99% là true.
- status nếu chỉ vài giá trị và phân bố lệch.

Index trên column selectivity thấp có thể không hiệu quả nếu query trả về phần lớn bảng.

## 6. EXPLAIN và query tuning

### 6.1 EXPLAIN dùng để làm gì?

`EXPLAIN` cho biết database dự định chạy query như thế nào. `EXPLAIN ANALYZE` chạy query thật và cho thời gian thực tế.

Cần nhìn:

- Scan type: full table scan, index scan, bitmap scan.
- Rows estimated vs actual.
- Cost.
- Sort.
- Filter.
- Join order.
- Actual time.

Ví dụ:

```sql
EXPLAIN ANALYZE
SELECT *
FROM orders
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 10;
```

Nếu thấy full table scan trên bảng lớn, có thể cần index:

```sql
CREATE INDEX idx_orders_user_created
ON orders(user_id, created_at DESC);
```

### 6.2 Quy trình tối ưu query chậm

1. Xác định query nào chậm bằng log/APM.
2. Chạy `EXPLAIN` hoặc `EXPLAIN ANALYZE`.
3. Kiểm tra query có dùng index không.
4. Kiểm tra rows scan quá nhiều không.
5. Kiểm tra sort/join có đắt không.
6. Kiểm tra N+1 từ ORM.
7. Thêm/chỉnh index theo access pattern.
8. Giảm column trả về, tránh `SELECT *`.
9. Đổi pagination nếu offset quá lớn.
10. Đo lại sau khi fix.

Câu trả lời:

> Em không tối ưu query theo cảm tính. Em tìm slow query bằng log/APM, chạy EXPLAIN để xem scan type, rows, sort, join order, rồi mới quyết định thêm index, sửa query, tránh N+1 hoặc đổi pagination.

### 6.3 N+1 query

N+1 xảy ra khi lấy N record rồi query thêm một lần cho mỗi record.

Ví dụ:

```ts
const posts = await postRepository.findMany();

for (const post of posts) {
  post.author = await userRepository.findById(post.authorId);
}
```

Nếu có 100 posts, sẽ có 101 queries.

Cách xử lý:

- Join/eager loading có kiểm soát.
- Batch query theo list id.
- DataLoader pattern với GraphQL.
- Cache reference data nếu phù hợp.

Ví dụ batch:

```ts
const posts = await postRepository.findMany();
const authorIds = [...new Set(posts.map((post) => post.authorId))];
const authors = await userRepository.findByIds(authorIds);
```

### 6.4 Offset pagination vs cursor pagination

Offset pagination:

```sql
SELECT *
FROM posts
ORDER BY created_at DESC
LIMIT 20 OFFSET 100000;
```

Ưu điểm:

- Đơn giản.
- Hỗ trợ nhảy tới page cụ thể.

Nhược điểm:

- Offset càng lớn càng chậm.
- Dễ bị duplicate/missing item nếu data thay đổi trong lúc paging.

Cursor pagination:

```sql
SELECT *
FROM posts
WHERE created_at < '2026-06-01T10:00:00Z'
ORDER BY created_at DESC
LIMIT 20;
```

Ưu điểm:

- Hiệu quả hơn cho feed/list lớn.
- Ổn định hơn khi data thay đổi.

Nhược điểm:

- Khó nhảy page tùy ý.
- Cần cursor field/index phù hợp.

Câu trả lời:

> Offset phù hợp với list nhỏ hoặc admin page cần nhảy trang. Với feed hoặc bảng lớn, em ưu tiên cursor pagination vì offset lớn làm DB phải bỏ qua nhiều row và chậm dần.

## 7. Transaction và ACID

### 7.1 Transaction là gì?

Transaction là nhóm thao tác database được thực hiện như một đơn vị. Hoặc tất cả thành công, hoặc rollback.

Ví dụ:

```sql
BEGIN;

UPDATE accounts
SET balance = balance - 100
WHERE id = 1;

UPDATE accounts
SET balance = balance + 100
WHERE id = 2;

COMMIT;
```

Nếu bước giữa fail, cần rollback để không mất tiền.

### 7.2 ACID

Atomicity: tất cả hoặc không gì.

Consistency: dữ liệu chuyển từ trạng thái hợp lệ sang trạng thái hợp lệ.

Isolation: transaction song song không phá nhau theo mức isolation.

Durability: commit rồi thì dữ liệu được lưu bền vững.

Câu trả lời:

> Transaction giúp đảm bảo một business action gồm nhiều thao tác DB thành công hoặc thất bại cùng nhau. ACID là atomicity, consistency, isolation và durability. Với order/payment/inventory, transaction và constraint rất quan trọng.

### 7.3 Khi nào cần transaction?

Cần transaction khi:

- Tạo order và order items.
- Trừ inventory và tạo order.
- Chuyển tiền giữa hai account.
- Update nhiều bảng trong một business action.
- Cần ghi business data và outbox event cùng nhau.

Không nên:

- Mở transaction quá lâu.
- Gọi external API trong transaction dài.
- Giữ transaction trong lúc user chờ thao tác.

## 8. Isolation level và concurrency

### 8.1 Dirty read

Dirty read là đọc dữ liệu chưa commit từ transaction khác.

Ví dụ:

```text
Transaction A update balance nhưng chưa commit
Transaction B đọc balance đó
A rollback
B đã đọc dữ liệu không bao giờ tồn tại thật
```

### 8.2 Non-repeatable read

Non-repeatable read là trong cùng transaction, đọc cùng một row hai lần ra kết quả khác nhau vì transaction khác đã commit update.

### 8.3 Phantom read

Phantom read là trong cùng transaction, query một range hai lần thấy thêm/bớt row vì transaction khác insert/delete row match điều kiện.

### 8.4 Lost update

Lost update xảy ra khi hai transaction cùng đọc một giá trị rồi ghi đè lên nhau.

Ví dụ inventory:

```text
Stock = 1
Request A đọc stock = 1
Request B đọc stock = 1
A update stock = 0
B update stock = 0
Kết quả bán 2 đơn nhưng chỉ trừ 1 stock
```

Cách xử lý:

```sql
UPDATE products
SET stock = stock - 1
WHERE id = 123
  AND stock > 0;
```

Sau đó check affected rows. Nếu `0`, hết hàng.

Hoặc optimistic locking:

```sql
UPDATE products
SET stock = stock - 1,
    version = version + 1
WHERE id = 123
  AND version = 7
  AND stock > 0;
```

### 8.5 Các isolation level phổ biến

Read Uncommitted:

- Có thể dirty read.
- Ít dùng cho business critical.

Read Committed:

- Tránh dirty read.
- Mỗi statement thấy dữ liệu đã commit tại thời điểm statement chạy.
- Phổ biến trong PostgreSQL.

Repeatable Read:

- Trong transaction, cùng row thường đọc ổn định hơn.
- Giảm non-repeatable read.
- MySQL InnoDB default thường là Repeatable Read.

Serializable:

- Mạnh nhất, gần như transaction chạy tuần tự.
- Chi phí cao hơn, có thể tăng conflict/retry.

Câu trả lời:

> Isolation càng mạnh thì consistency tốt hơn nhưng chi phí và khả năng conflict cao hơn. Thực tế em chọn theo use case. Với counter/inventory/payment, ngoài isolation level còn cần lock, optimistic locking, constraint hoặc atomic update.

## 9. Locking, deadlock và optimistic locking

### 9.1 Pessimistic lock

Pessimistic lock khóa row khi đọc/sửa, giả định conflict có thể xảy ra.

Ví dụ:

```sql
BEGIN;

SELECT *
FROM products
WHERE id = 123
FOR UPDATE;

UPDATE products
SET stock = stock - 1
WHERE id = 123;

COMMIT;
```

Ưu điểm:

- Bảo vệ tốt khi conflict cao.
- Logic dễ hiểu.

Nhược điểm:

- Có thể làm request chờ lock.
- Transaction dài gây contention.
- Dễ deadlock nếu lock nhiều resource sai thứ tự.

### 9.2 Optimistic locking

Optimistic locking giả định conflict ít, không khóa trước. Khi update, kiểm tra version.

Ví dụ:

```sql
UPDATE documents
SET content = 'new content',
    version = version + 1
WHERE id = 1
  AND version = 3;
```

Nếu affected rows = 0, nghĩa là có người khác đã update trước.

Ưu điểm:

- Ít lock.
- Tốt khi conflict thấp.
- Phù hợp edit document/profile.

Nhược điểm:

- Cần xử lý retry/conflict.
- User có thể phải reload/merge thay đổi.

### 9.3 Deadlock

Deadlock xảy ra khi hai transaction chờ lock của nhau.

Ví dụ:

```text
Transaction A lock row 1, chờ row 2
Transaction B lock row 2, chờ row 1
```

Cách giảm:

- Lock resource theo thứ tự nhất quán.
- Transaction ngắn.
- Không gọi external API trong transaction.
- Có retry cho deadlock lỗi tạm thời.

## 10. Connection pool

### 10.1 Connection pool là gì?

Connection pool là tập connection DB được tái sử dụng thay vì mở connection mới cho mỗi query.

Vì mở connection DB tốn chi phí, app backend thường dùng pool.

Các metric cần theo dõi:

- Active connections.
- Idle connections.
- Waiting requests.
- Query latency.
- DB CPU/memory.

Pool quá nhỏ:

- Request phải chờ connection.
- Latency tăng.

Pool quá lớn:

- DB bị quá nhiều connection.
- Context switching/lock contention tăng.
- Nhiều app instance nhân với pool size có thể vượt limit DB.

Câu trả lời:

> Em cấu hình pool dựa trên số instance app và khả năng DB. Không chỉ tăng pool size khi chậm, vì pool quá lớn có thể làm DB quá tải. Cần nhìn waiting count, query latency và DB resource.

## 11. Read replica, partitioning, sharding

### 11.1 Read replica

Read replica là bản sao DB phục vụ query đọc.

Ưu điểm:

- Giảm tải read cho primary.
- Phù hợp read-heavy system.

Nhược điểm:

- Có replication lag.
- Không giải quyết write bottleneck.
- Query cần dữ liệu vừa ghi có thể đọc stale nếu đọc từ replica.

### 11.2 Partitioning

Partitioning chia một bảng lớn thành nhiều phần logic.

Ví dụ partition theo thời gian:

- `orders_2026_01`
- `orders_2026_02`

Phù hợp:

- Bảng rất lớn.
- Query thường theo time range.
- Cần archive/drop data cũ dễ hơn.

Nhược điểm:

- Thiết kế phức tạp hơn.
- Query không theo partition key có thể vẫn chậm.

### 11.3 Sharding

Sharding chia dữ liệu qua nhiều database/node.

Ví dụ shard theo `user_id`.

Ưu điểm:

- Scale write/storage vượt một node.
- Tách tải theo shard.

Nhược điểm:

- Cross-shard query khó.
- Transaction cross-shard phức tạp.
- Rebalancing khó.
- Chọn shard key sai gây hot shard.

Câu trả lời:

> Em không nhảy ngay vào sharding. Thứ tự thường là tối ưu query/index, cache, read replica, partitioning nếu phù hợp, rồi mới sharding khi write/storage vượt khả năng một cluster. Sharding tăng complexity rất nhiều nên phải có lý do rõ.

## 12. Migration production

### 12.1 Migration là gì?

Migration là thay đổi schema database có version, ví dụ add column, create index, create table, alter type.

Migration production cần cẩn thận vì:

- Data thật.
- Downtime có thể ảnh hưởng user.
- Rollback schema/data không luôn đơn giản.
- Rolling deploy có thể chạy code cũ và mới cùng lúc.

### 12.2 Expand/contract migration

Ví dụ đổi field `full_name` thành `first_name`, `last_name`:

1. Expand: thêm `first_name`, `last_name` nullable.
2. Deploy code ghi cả field cũ và mới.
3. Backfill dữ liệu cũ.
4. Deploy code đọc field mới.
5. Theo dõi ổn định.
6. Contract: drop `full_name` sau khi chắc chắn không còn dùng.

Ưu điểm:

- Giảm rủi ro downtime.
- Compatible với rolling deploy.
- Rollback code dễ hơn.

Nhược điểm:

- Nhiều bước hơn.
- Cần quản lý trạng thái tạm thời.

### 12.3 Create index trên bảng lớn

Tạo index trên bảng lớn có thể:

- Tốn CPU/I/O.
- Lock hoặc ảnh hưởng write tùy DB/cách tạo.
- Làm production chậm nếu chạy sai thời điểm.

Cần:

- Dùng cách tạo index online/concurrently nếu DB hỗ trợ.
- Chạy ngoài giờ cao điểm nếu cần.
- Theo dõi lock, CPU, replication lag.
- Có plan rollback.

## 13. Common pitfalls

- Không có unique constraint, chỉ check duplicate bằng code.
- Thiếu index cho filter/join/sort quan trọng.
- Có quá nhiều index làm write chậm.
- Query `SELECT *` trả quá nhiều dữ liệu.
- Offset pagination sâu trên bảng lớn.
- N+1 query từ ORM.
- Transaction dài vì gọi external API bên trong.
- Không xử lý lost update.
- Không có migration backward-compatible.
- Soft delete nhưng quên filter `deleted_at`.
- Connection pool cấu hình không theo số instance.

## 14. Câu hỏi phỏng vấn hay gặp

### Index là gì và trade-off là gì?

Index là cấu trúc dữ liệu giúp database tìm row nhanh hơn. Nó tăng tốc query đọc nếu khớp access pattern, nhưng làm chậm insert/update/delete vì phải cập nhật index và tốn thêm storage. Vì vậy không tạo index theo cảm tính, mà dựa vào query thật và EXPLAIN.

### Vì sao query chậm dù có index?

Index có thể không khớp điều kiện query, thứ tự compound index sai, query dùng function trên column, wildcard ở đầu, selectivity thấp, statistics cũ, sort không dùng index, hoặc query trả quá nhiều row nên optimizer chọn scan.

### Compound index và leftmost prefix là gì?

Compound index là index nhiều cột. Với index `(user_id, status, created_at)`, database dùng tốt các query bắt đầu từ `user_id`, rồi `status`, rồi `created_at`. Query chỉ theo `status` thường không tận dụng tốt index này vì không dùng leftmost prefix.

### Transaction dùng khi nào?

Dùng khi một business action gồm nhiều thao tác DB phải thành công hoặc rollback cùng nhau, ví dụ tạo order và order items, trừ inventory, chuyển tiền, ghi outbox event. Không nên giữ transaction quá lâu hoặc gọi external API trong transaction.

### Isolation level giải quyết vấn đề gì?

Isolation level quyết định transaction song song nhìn thấy dữ liệu của nhau như thế nào. Nó liên quan đến dirty read, non-repeatable read, phantom read và lost update. Isolation mạnh hơn tăng consistency nhưng có thể tăng lock/conflict/chi phí.

### Lost update là gì và xử lý thế nào?

Lost update xảy ra khi hai transaction cùng đọc một giá trị rồi ghi đè lên nhau, ví dụ stock = 1 nhưng hai request cùng bán. Cách xử lý là atomic update với điều kiện `stock > 0`, row lock `FOR UPDATE`, optimistic locking với `version`, và constraint phù hợp.

### SQL vs NoSQL chọn thế nào?

Chọn theo access pattern, quan hệ dữ liệu, transaction/consistency requirement và team experience. SQL phù hợp dữ liệu quan hệ, transaction, constraint. NoSQL phù hợp document/aggregate/schema linh hoạt hoặc scale pattern cụ thể. Không chọn NoSQL chỉ vì nghĩ nó nhanh hơn.

### Offset pagination có vấn đề gì?

Offset lớn làm DB phải bỏ qua nhiều row nên càng về sau càng chậm. Nếu data thay đổi trong lúc paging còn có thể duplicate/missing item. Với feed/list lớn nên dùng cursor pagination dựa trên field có index như `created_at`, `id`.

### Migration production cần lưu ý gì?

Migration phải review kỹ, backward-compatible nếu rolling deploy, tránh destructive change trực tiếp, dùng expand/contract cho thay đổi lớn, có backup/rollback plan và theo dõi lock/latency khi chạy migration nặng như create index trên bảng lớn.
