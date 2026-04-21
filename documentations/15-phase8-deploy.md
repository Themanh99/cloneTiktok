# 🚢 Phase 8: Deploy & Optimization (Chi tiết từng bước)

> **Thời gian ước tính:** 3-4 ngày
> **Mục tiêu:** Deploy cả FE + BE lên Render.com, tối ưu performance, load testing
> **Điều kiện:** Phase 6 + 7 hoàn thành, app chạy local thành công

---

## Bước 8.1: Chuẩn bị External Services

### 1. PostgreSQL — Supabase (hoặc NeonDB)

```
1. Vào https://supabase.com → Tạo project
2. Lấy Connection String:
   Settings → Database → Connection string → URI
   
   Format: postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   
3. ⚠️ QUAN TRỌNG: Dùng port 6543 (PgBouncer) thay vì 5432
   postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true

   Tại sao PgBouncer? Connection pooling — tránh "too many connections" error
   khi app có nhiều request cùng lúc.
```

### 2. Redis — Upstash

```
1. Vào https://upstash.com → Tạo Redis database
2. Chọn Region gần nhất (Singapore nếu ở VN)
3. Lấy Connection URL:
   redis://default:[PASSWORD]@[HOST]:6379
   
4. Upstash miễn phí: 10,000 commands/ngày (đủ cho MVP)
```

### 3. Storage — Cloudinary (hoặc S3)

```
1. Vào https://cloudinary.com → Tạo account
2. Dashboard → Copy: Cloud Name, API Key, API Secret
3. Settings → Upload → Upload Presets → Tạo preset cho video
   - Tự động convert MP4 → HLS (M3U8)
   - Tự động tạo thumbnail

HOẶC dùng Cloudflare R2:
1. Vào Cloudflare Dashboard → R2 → Tạo bucket
2. Manage R2 API Tokens → Tạo token
3. Lấy: Account ID, Access Key, Secret Key
4. Endpoint: https://[ACCOUNT_ID].r2.cloudflarestorage.com
```

### 4. Google OAuth

```
1. Vào https://console.cloud.google.com
2. Tạo Project → APIs & Services → OAuth consent screen
3. Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URIs:
   - http://localhost:3000/auth/google/callback (dev)
   - https://your-api.onrender.com/auth/google/callback (prod)
5. Copy: Client ID, Client Secret
```

---

## Bước 8.2: Deploy Backend lên Render.com

```
1. Push code lên GitHub (nếu chưa)
   cd d:\Code\tiktokweb\backend
   git init
   git add .
   git commit -m "Initial backend"
   git remote add origin https://github.com/[your-username]/tiktok-backend.git
   git push -u origin main

2. Đăng nhập https://render.com
   
3. New → Web Service
   - Connect GitHub repo
   - Name: tiktok-api
   - Region: Singapore (gần VN nhất)
   - Environment: Docker (Render đọc Dockerfile)
   - Instance Type: Free (hoặc Starter $7/month)

4. Environment Variables — Nhập TẤT CẢ biến .env:
   PORT=3000
   NODE_ENV=production
   APP_URL=https://tiktok-api.onrender.com
   FRONTEND_URL=https://tiktok-web.onrender.com
   DATABASE_URL=postgresql://... (từ Supabase)
   REDIS_URL=redis://... (từ Upstash)
   JWT_ACCESS_SECRET=<random 64 chars>
   JWT_REFRESH_SECRET=<random 64 chars>
   ... (tất cả biến khác)

   Cách tạo random secret:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

5. Click Deploy → Đợi 3-5 phút build Docker
   
6. Test:
   curl https://tiktok-api.onrender.com/api/auth/login
   → Phải trả response (dù là error 400 vì thiếu body)
```

> **⚠️ Render Free Tier:** Server ngủ sau 15 phút không có request. Request đầu tiên sau khi ngủ mất ~30s. Starter plan ($7/month) không ngủ.

---

## Bước 8.3: Deploy Frontend lên Render.com

```
1. Push frontend code lên GitHub

2. Render → New → Web Service (hoặc Static Site)
   
   Option A: Web Service (SSR — recommended)
   - Environment: Node
   - Build Command: npm run build
   - Start Command: npm start
   - Tốt cho SEO (Server-Side Rendering)
   
   Option B: Static Site
   - Build Command: npm run build
   - Publish Directory: out
   - Cần thêm next.config.js: output: 'export'
   - KHÔNG có SSR, chỉ phù hợp nếu không cần SEO

3. Environment Variables:
   NEXT_PUBLIC_API_URL=https://tiktok-api.onrender.com/api
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
   NEXT_PUBLIC_SOCKET_URL=https://tiktok-api.onrender.com

4. Deploy → Test:
   Mở https://tiktok-web.onrender.com
   → Phải thấy trang login/home
```

---

## Bước 8.4: Tối ưu Database

### Kiểm tra indexes:

```bash
# Kết nối DB qua Prisma Studio hoặc psql
npx prisma studio

# Hoặc chạy raw SQL kiểm tra indexes:
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
```

### Indexes đã có trong schema (tự động tạo khi migrate):
```
✅ videos.createdAt       — Sort feed
✅ videos.authorId        — Videos của user
✅ videos.soundId         — Videos dùng cùng sound
✅ follows.followingId    — Followers list
✅ likes.videoId          — Likes của video
✅ comments.[videoId+createdAt] — Comments sort
✅ comments.parentId      — Replies
✅ notifications.[receiverId+read+createdAt] — Notifications
```

### Tối ưu Prisma queries:

```typescript
// ❌ SAI: Lấy tất cả fields
const user = await prisma.user.findUnique({ where: { id } });

// ✅ ĐÚNG: Chỉ lấy fields cần thiết
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, username: true, avatarUrl: true },
});

// ❌ SAI: N+1 Query (loop query trong loop)
const videos = await prisma.video.findMany();
for (const video of videos) {
  const author = await prisma.user.findUnique({ where: { id: video.authorId } });
}

// ✅ ĐÚNG: Include (JOIN trong 1 query)
const videos = await prisma.video.findMany({
  include: { author: { select: { id: true, username: true } } },
});
```

---

## Bước 8.5: Load Testing

### Cài K6:

```bash
# Windows
choco install k6
# hoặc download từ https://k6.io/docs/getting-started/installation/
```

### Tạo test script `load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up 20 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

const BASE_URL = 'https://tiktok-api.onrender.com/api';

export default function () {
  // Test Feed endpoint (most critical)
  const feedRes = http.get(`${BASE_URL}/videos/feed?limit=10`);
  check(feedRes, {
    'feed status 200': (r) => r.status === 200,
    'feed response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // Simulate user pause between scrolls
}
```

### Chạy:
```bash
k6 run load-test.js
```

### Mục tiêu performance:
```
✅ Feed API: < 200ms (p95)
✅ Auth API: < 300ms (p95)  
✅ Upload API: < 500ms (p95)
✅ Comment API: < 200ms (p95)
✅ WebSocket connection: < 100ms
✅ Error rate: < 0.1%
```

---

## Bước 8.6: Security Checklist

```
✅ CORS chỉ allow FRONTEND_URL (không wildcard *)
✅ Rate limiting toàn cục (100 req/min/IP)
✅ Rate limiting comment (5/min/user)
✅ JWT secrets khác nhau cho access vs refresh
✅ Password hash bằng bcrypt (10 rounds)
✅ ValidationPipe whitelist (chặn field injection)
✅ .env KHÔNG commit lên Git
✅ SQL injection: Prisma ORM (parameterized queries)
✅ XSS: Next.js auto-escape (React)
✅ HTTPS (Render tự cấp SSL)
```

---

## Bước 8.7: Custom Domain (Optional)

```
1. Mua domain (Namecheap, Cloudflare, Google Domains)

2. Backend: api.yourdomain.com
   Render → Settings → Custom Domains → Add
   DNS: CNAME api → tiktok-api.onrender.com

3. Frontend: yourdomain.com
   Render → Settings → Custom Domains → Add  
   DNS: CNAME www → tiktok-web.onrender.com
   DNS: A @ → Render IP (check Render docs)

4. Cập nhật .env:
   APP_URL=https://api.yourdomain.com
   FRONTEND_URL=https://yourdomain.com
```

---

## ✅ Output Phase 8:
```
✅ Backend chạy trên Render.com (Docker)
✅ Frontend chạy trên Render.com (SSR)
✅ External services: Supabase + Upstash + Cloudinary
✅ Database indexes tối ưu
✅ N+1 queries fixed
✅ Load test pass (p95 < 500ms)
✅ Security checklist hoàn thành
✅ Custom domain (optional)
```

---

## 🎉 Dự án hoàn thành!

### Tổng kết toàn bộ 8 Phases:

| Phase | Thời gian | Nội dung | Files chính |
|-------|-----------|----------|-------------|
| **1** | 3 ngày | Setup & Config | Dockerfile, docker-compose, .env, common/ |
| **2** | 2 ngày | Database & Prisma | schema.prisma, PrismaModule, RedisModule |
| **3** | 4 ngày | Auth Module | auth/, strategies/, DTOs, JWT Guard |
| **4** | 3 ngày | User & Follow | user/, Follow Transaction, Search |
| **5** | 5 ngày | Video & Feed | video/, storage/, tasks/, Sound, Hashtag |
| **6** | 5 ngày | Interaction & RT | interaction/, comment/, WebSocket Gateway |
| **7** | 14 ngày | Frontend | Next.js, design system, pages, components |
| **8** | 4 ngày | Deploy & Optimize | Render.com, indexes, load test, security |

**Tổng:** ~40 ngày (5-6 tuần) cho solo developer

### Đường dẫn migrate sang VPS (Phase sau):
Xem [06-docker-va-deployment.md](./06-docker-va-deployment.md#4-migrate-sang-vps--zero-downtime)
