# Fullstack Interview Guide - Part 2

# Databases, DevOps, Behavioral

> **Part 1:** React, Next.js → `FULLSTACK_GUIDE_PART1.md`
> **NestJS:** → `NESTJS_MASTERY_GUIDE.md`

---

## VII. Databases

### 1. MySQL (SQL)

**Transaction Isolation Levels:**

| Level            | Dirty Read | Non-Repeatable Read | Phantom Read | Hiệu năng  |
| ---------------- | ---------- | ------------------- | ------------ | ---------- |
| Read Uncommitted | ✅ Có thể  | ✅ Có thể           | ✅ Có thể    | Nhanh nhất |
| Read Committed   | ❌         | ✅ Có thể           | ✅ Có thể    | Nhanh      |
| Repeatable Read  | ❌         | ❌                  | ✅ Có thể    | Trung bình |
| Serializable     | ❌         | ❌                  | ❌           | Chậm nhất  |

- **Dirty Read**: Đọc data chưa commit từ transaction khác.
- **Non-Repeatable Read**: Đọc cùng row 2 lần, ra 2 kết quả khác nhau.
- **Phantom Read**: Query ra số lượng row khác nhau giữa 2 lần đọc.
- MySQL InnoDB mặc định: **Repeatable Read**.

**Clustered vs Non-Clustered Index:**

- **Clustered**: Sắp xếp data vật lý trên disk theo index. Mỗi bảng chỉ có 1 (thường là Primary Key). Tìm kiếm range rất nhanh.
- **Non-Clustered**: Tạo cấu trúc riêng trỏ về data. Mỗi bảng có nhiều. Tốn thêm bộ nhớ nhưng tăng tốc query trên cột thường WHERE.

**Schema Design - Many-to-Many với thuộc tính:**

```sql
-- Bảng trung gian có thuộc tính riêng
CREATE TABLE enrollments (
  student_id INT REFERENCES students(id),
  course_id INT REFERENCES courses(id),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  grade VARCHAR(2),          -- Thuộc tính trên bảng trung gian
  status ENUM('active','completed','dropped'),
  PRIMARY KEY (student_id, course_id)
);
```

**Stored Procedures vs Triggers:**

- **Stored Procedure**: Logic SQL lưu sẵn trên DB, gọi thủ công. Ưu: Giảm network roundtrip, tái sử dụng. Nhược: Khó debug, khó version control, lock-in DB.
- **Trigger**: Tự động chạy khi INSERT/UPDATE/DELETE. Ưu: Tự động hóa audit log. Nhược: Ẩn logic, khó trace bug, giảm hiệu năng.

### 2. MongoDB (NoSQL)

**Aggregation Pipeline:**

```javascript
db.orders.aggregate([
  {
    $match: { status: "completed", createdAt: { $gte: ISODate("2024-01-01") } },
  },
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.category",
      totalRevenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
      avgPrice: { $avg: "$items.price" },
      orderCount: { $sum: 1 },
    },
  },
  { $sort: { totalRevenue: -1 } },
  { $limit: 10 },
]);
```

**Embedded vs Referenced Documents:**

- **Embedded** (lồng nhau): Data luôn đọc cùng nhau, quan hệ 1-1 hoặc 1-ít. VD: User chứa Address.
  - Ưu: 1 query lấy hết, nhanh.
  - Nhược: Document size limit 16MB, data trùng lặp.
- **Referenced** (tham chiếu): Data độc lập, quan hệ nhiều-nhiều, cần truy cập riêng. VD: Post tham chiếu Author.
  - Ưu: Không trùng lặp, linh hoạt.
  - Nhược: Cần nhiều query ($lookup).

**Replica Sets & Sharding:**

- **Replica Set**: 1 Primary + N Secondary. Mục đích: High Availability. Primary sập → Secondary tự lên thay.
- **Sharding**: Chia data ra nhiều server (shard) theo shard key. Mục đích: Scale horizontal khi data quá lớn cho 1 server.

**Transactions trong MongoDB:**

- Hỗ trợ multi-document transactions từ v4.0 (replica set) và v4.2 (sharded cluster).
- Hạn chế: Performance giảm, timeout 60s mặc định, không nên dùng cho mọi operation.

### 3. Redis

**Use Cases ngoài Caching:**

- **Session Store**: Lưu session user, TTL tự hết hạn.
- **Pub/Sub**: Real-time messaging giữa services.
- **Distributed Lock**: `SET lock_key value NX EX 30` → Chỉ 1 process giữ lock.
- **Leaderboard**: Sorted Set (`ZADD`, `ZREVRANGE`) → Top N ranking.
- **Rate Limiting**: `INCR` + `EXPIRE` → Đếm request/giây.
- **Queue**: `LPUSH` + `BRPOP` → Simple job queue.

**Cache Invalidation Strategies:**

- **TTL (Time-to-Live)**: Set expiry time. Đơn giản nhưng data có thể cũ trong khoảng TTL.
- **Write-Through**: Ghi DB xong ghi cache luôn. Data luôn fresh nhưng chậm hơn.
- **Write-Behind**: Ghi cache trước, async ghi DB sau. Nhanh nhưng rủi ro mất data.
- **Cache-Aside**: App đọc cache → miss → đọc DB → ghi cache. Phổ biến nhất.

**Redis Persistence:**

- **RDB (Snapshot)**: Chụp snapshot data theo interval (mỗi 5 phút). Nhỏ gọn, khởi động nhanh. Có thể mất data giữa 2 snapshot.
- **AOF (Append Only File)**: Log mỗi write command. An toàn hơn (mất tối đa 1 giây data). File lớn hơn, khởi động chậm hơn.
- **Thực tế**: Bật cả hai. RDB cho backup, AOF cho durability.

---

## VIII. DevOps & Tooling

### 1. Git Nâng Cao

**Rollback commit đã push:**

```bash
# Cách 1: Revert (an toàn, tạo commit ngược lại)
git revert <commit-hash>
git push origin main

# Cách 2: Reset (nguy hiểm, xóa lịch sử)
git reset --hard <commit-hash>
git push --force origin main  # ⚠️ Chỉ dùng branch riêng
```

**Git Hooks:**
Script tự động chạy ở các sự kiện git. Lưu trong `.git/hooks/`.

- `pre-commit`: Chạy linter, format code trước khi commit.
- `pre-push`: Chạy test trước khi push.
- `commit-msg`: Kiểm tra format commit message.
- Dùng `husky` + `lint-staged` cho team consistency.

**Submodules vs Subtrees:**

- **Submodule**: Repo con bên trong repo cha. Git track bằng commit hash. Phức tạp khi cập nhật.
- **Subtree**: Merge code repo con vào repo cha. Đơn giản hơn, không cần init riêng. Khó tách ngược.

### 2. Docker

**Volumes vs Bind Mounts:**

- **Volume**: Docker quản lý, lưu trong Docker area. Dùng cho production (DB data, persistent storage).
- **Bind Mount**: Mount thư mục host vào container. Dùng cho development (hot reload source code).

**Docker Networking:**

- **bridge** (mặc định): Container giao tiếp qua mạng ảo. Dùng cho đa số trường hợp.
- **host**: Container dùng chung network với host. Hiệu năng cao, mất isolation.
- **none**: Không có mạng. Dùng cho batch job cô lập.

**Tối ưu Docker Image:**

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

- Dùng Alpine base image (nhỏ).
- Multi-stage build (chỉ copy artifact).
- `.dockerignore` loại bỏ `node_modules`, `.git`.
- `npm ci` thay `npm install` (deterministic).

**Debug container:**

```bash
docker exec -it <container_id> sh     # Vào shell
docker logs -f <container_id>         # Xem log realtime
docker inspect <container_id>         # Xem config chi tiết
docker stats                          # Xem CPU/RAM usage
```

### 3. CI/CD

**Pipeline cho Fullstack (Next.js + NestJS):**

```
1. Trigger: Push to main/PR
2. Install: npm ci (cache node_modules)
3. Lint: ESLint + Prettier check
4. Test: Unit tests + E2E tests (parallel)
5. Build: next build + nest build
6. Docker: Build & push images to registry
7. Deploy: Update staging → smoke test → production
```

**Blue/Green vs Canary:**

- **Blue/Green**: 2 môi trường giống hệt nhau. Deploy lên Green, test xong → switch traffic từ Blue sang Green. Rollback = switch lại. Tốn gấp đôi infra.
- **Canary**: Chuyển 5% traffic sang version mới. Monitor. OK thì tăng dần lên 100%. Tiết kiệm hơn, phát hiện lỗi sớm.

### 4. Monitoring & Logging

**ELK Stack:**

- **Elasticsearch**: Lưu trữ & tìm kiếm log (full-text search).
- **Logstash**: Thu thập, parse, transform log từ nhiều nguồn.
- **Kibana**: Dashboard trực quan hóa log.

**Alternatives:** Datadog, Grafana + Prometheus + Loki, AWS CloudWatch.

**Alerts Setup:**

- Định nghĩa threshold: Error rate > 5%, Response time > 2s, CPU > 80%.
- Channels: Slack, PagerDuty, Email.
- Phân cấp: Warning → Critical → P1 Incident.

**Distributed Tracing:**
Theo dõi 1 request đi qua nhiều services. Mỗi service thêm trace ID/span ID vào headers. Tools: Jaeger, Zipkin, OpenTelemetry.

### 5. Cloud Platforms

**Dịch vụ phổ biến:**

- **Compute**: EC2, ECS, Lambda (serverless), App Engine, Cloud Run.
- **Storage**: S3, Cloud Storage.
- **Database**: RDS, DynamoDB, Cloud SQL.
- **Networking**: VPC, Load Balancer, CloudFront (CDN).

**Deploy & Scale Fullstack:**

```
                    ┌──────────────┐
  User ──→ CDN ──→ │ Load Balancer│
                    └──────┬───────┘
                    ┌──────┴───────┐
              ┌─────┤  Next.js     │ (Auto-scale group)
              │     └──────────────┘
              │     ┌──────────────┐
              └────→│  NestJS API  │ (Auto-scale group)
                    └──────┬───────┘
                    ┌──────┴───────┐
                    │  PostgreSQL  │ (RDS Multi-AZ)
                    │  Redis       │ (ElastiCache)
                    └──────────────┘
```

---

## IX. Behavioral Questions (Gợi ý trả lời)

### 1. Giới thiệu bản thân

**Framework STAR**: Situation → Task → Action → Result.
"Tôi là Fullstack Developer với ~4 năm kinh nghiệm, chuyên React/Next.js (Frontend) và NestJS (Backend). Dự án gần nhất tôi xây dựng [tên dự án] phục vụ [X users], sử dụng [tech stack]. Vai trò của tôi là [cụ thể]."

### 2. Xử lý mâu thuẫn trong team

"Tôi luôn lắng nghe quan điểm đối phương trước. Nếu bất đồng về kỹ thuật, tôi đề xuất POC (Proof of Concept) hoặc benchmark để data quyết định thay vì cảm tính. Với mâu thuẫn cá nhân, tôi trao đổi riêng 1-1."

### 3. Deadline gấp

"Tôi ưu tiên tính năng theo MoSCoW (Must/Should/Could/Won't). Communicate sớm với PM/Lead nếu cần cắt scope. Focus vào MVP, đánh đổi code quality có chủ đích và tạo tech debt ticket để trả sau."

### 4. Dự án khó nhất

Chuẩn bị 1-2 câu chuyện cụ thể:

- **Vấn đề**: "Hệ thống load 10s cho trang danh sách 10k sản phẩm."
- **Giải pháp**: "Thêm Redis cache, implement pagination cursor-based, ISR với Next.js."
- **Kết quả**: "Giảm load time từ 10s xuống 800ms, tăng conversion 15%."

### 5. Agile/Scrum

"Team tôi chạy Sprint 2 tuần. Daily standup 15 phút. Sprint Planning đầu sprint, Retrospective cuối sprint. Tôi dùng Jira/Linear để track task. Tôi thấy Agile giúp phản hồi nhanh và giảm rủi ro delivery."

---

> **Tổng kết 3 files:**
>
> - `FULLSTACK_GUIDE_PART1.md` → Python, FastAPI, Flask, React, Next.js
> - `FULLSTACK_GUIDE_PART2.md` → Database, DevOps, Behavioral
> - `NESTJS_MASTERY_GUIDE.md` → NestJS chuyên sâu
