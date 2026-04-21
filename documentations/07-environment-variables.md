# 🔐 Environment Variables — TikTok Clone Backend

> **Nguồn gốc:** Tổng hợp từ [detail-project.md](./detail-project.md) mục 2

---

## 1. Nguyên tắc

> [!IMPORTANT]
> Code NestJS **tuyệt đối không được biết** nó đang chạy ở đâu (Render, VPS, Local).
> Mọi kết nối đều phải đọc qua biến môi trường `.env`.

---

## 2. File `.env` mẫu

```env
# ============================================
# 🔧 APP
# ============================================
PORT=3000
NODE_ENV=development          # development | production
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# ============================================
# 🗄️ DATABASE (PostgreSQL)
# ============================================
# Supabase / NeonDB / Local
DATABASE_URL="postgresql://user:password@host:5432/tiktok_db?schema=public"

# ============================================
# ⚡ REDIS
# ============================================
# Upstash / Local
REDIS_URL="redis://default:password@host:6379"

# ============================================
# ☁️ STORAGE (S3 / Cloudflare R2)
# ============================================
AWS_S3_BUCKET="my-tiktok-clone"
AWS_S3_REGION="ap-southeast-1"
AWS_ACCESS_KEY_ID="xxxxx"
AWS_SECRET_ACCESS_KEY="yyyyy"
AWS_S3_ENDPOINT=""            # Để trống nếu dùng AWS S3, điền URL nếu dùng R2

# ============================================
# 🎥 CLOUDINARY (Alternative cho Video)
# ============================================
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="xxxxx"
CLOUDINARY_API_SECRET="yyyyy"

# ============================================
# 🔑 JWT
# ============================================
JWT_ACCESS_SECRET="super_secret_access_key_change_me"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_SECRET="super_secret_refresh_key_change_me"
JWT_REFRESH_EXPIRATION="7d"

# ============================================
# 🔐 GOOGLE OAuth (SSO)
# ============================================
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="yyyyy"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# ============================================
# ⏰ CRON JOBS
# ============================================
VIEW_BATCH_INTERVAL_MINUTES=5    # Gom view từ Redis → DB
LIKE_BATCH_INTERVAL_MINUTES=5    # Gom like từ Redis → DB

# ============================================
# 🚫 RATE LIMITING
# ============================================
COMMENT_RATE_LIMIT=5             # Max comments per user
COMMENT_RATE_WINDOW_SECONDS=60   # Per window (60s = 1 phút)
```

---

## 3. Bảng chi tiết biến môi trường

### 3.1 App Core

| Biến | Bắt buộc | Default | Mô tả |
|------|----------|---------|--------|
| `PORT` | ❌ | `3000` | Port app lắng nghe |
| `NODE_ENV` | ✅ | — | `development` hoặc `production` |
| `APP_URL` | ✅ | — | URL backend |
| `FRONTEND_URL` | ✅ | — | URL frontend (CORS) |

### 3.2 Database

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL (bao gồm pooling) |

> [!TIP]
> **Connection Pooling:** Nếu dùng Supabase, nhớ dùng URL có chứa `pgbouncer=true`:
> ```
> postgresql://user:pass@host:6543/db?pgbouncer=true&schema=public
> ```
> Port `6543` là port PgBouncer, khác với port Postgres mặc định `5432`.

### 3.3 Redis

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `REDIS_URL` | ✅ | Connection string Redis |

### 3.4 Storage

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `AWS_S3_BUCKET` | ✅* | Tên bucket S3 |
| `AWS_S3_REGION` | ✅* | Region (vd: `ap-southeast-1`) |
| `AWS_ACCESS_KEY_ID` | ✅* | S3 Access Key |
| `AWS_SECRET_ACCESS_KEY` | ✅* | S3 Secret Key |
| `AWS_S3_ENDPOINT` | ❌ | Custom endpoint (cho Cloudflare R2) |
| `CLOUDINARY_CLOUD_NAME` | ✅** | Cloudinary account name |
| `CLOUDINARY_API_KEY` | ✅** | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | ✅** | Cloudinary API Secret |

> \* Bắt buộc nếu dùng S3/R2  
> \** Bắt buộc nếu dùng Cloudinary

### 3.5 Authentication

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `JWT_ACCESS_SECRET` | ✅ | Secret key cho Access Token |
| `JWT_ACCESS_EXPIRATION` | ❌ | Thời hạn Access Token (default: `15m`) |
| `JWT_REFRESH_SECRET` | ✅ | Secret key cho Refresh Token |
| `JWT_REFRESH_EXPIRATION` | ❌ | Thời hạn Refresh Token (default: `7d`) |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | ❌ | Google OAuth Callback URL |

### 3.6 Operational

| Biến | Bắt buộc | Default | Mô tả |
|------|----------|---------|--------|
| `VIEW_BATCH_INTERVAL_MINUTES` | ❌ | `5` | Tần suất gom view vào DB |
| `LIKE_BATCH_INTERVAL_MINUTES` | ❌ | `5` | Tần suất gom like vào DB |
| `COMMENT_RATE_LIMIT` | ❌ | `5` | Giới hạn comment/user/window |
| `COMMENT_RATE_WINDOW_SECONDS` | ❌ | `60` | Rate limit window (giây) |

---

## 4. Cấu hình theo môi trường

| Biến | Local (Dev) | Render.com | VPS (Prod) |
|------|-------------|------------|------------|
| `NODE_ENV` | `development` | `production` | `production` |
| `DATABASE_URL` | `localhost:5432` | Supabase URL | Supabase URL *(hoặc local PG)* |
| `REDIS_URL` | `localhost:6379` | Upstash URL | Upstash URL *(hoặc local Redis)* |
| `Storage` | S3/Cloudinary | S3/Cloudinary | S3/Cloudinary |
| `JWT_*` | Test keys | Production keys | Production keys |

> [!WARNING]
> **KHÔNG BAO GIỜ** commit file `.env` lên Git.
> Thay vào đó, tạo file `.env.example` chứa tên biến (không có giá trị) để team biết cần configure gì.

---

## 5. File `.env.example`

```env
# App
PORT=3000
NODE_ENV=
APP_URL=
FRONTEND_URL=

# Database
DATABASE_URL=

# Redis
REDIS_URL=

# Storage (Chọn 1 trong 2: S3 hoặc Cloudinary)
AWS_S3_BUCKET=
AWS_S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_ENDPOINT=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# JWT
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

# Operational
VIEW_BATCH_INTERVAL_MINUTES=5
LIKE_BATCH_INTERVAL_MINUTES=5
COMMENT_RATE_LIMIT=5
COMMENT_RATE_WINDOW_SECONDS=60
```

---

## 6. Liên kết

| Tài liệu | Link |
|-----------|------|
| Docker & Deploy | [06-docker-va-deployment.md](./06-docker-va-deployment.md) |
| Lộ trình Phases | [03-lo-trinh-phases.md](./03-lo-trinh-phases.md) |
