# TikTok Clone — Backend (NestJS)

> Backend API cho dự án TikTok Clone, xây dựng bằng **NestJS + PostgreSQL + Prisma + Redis**.

---

## 📋 Yêu cầu môi trường

Trước khi cài đặt, đảm bảo máy đã có:

| Công cụ | Phiên bản tối thiểu | Ghi chú |
|---------|-------------------|---------|
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) |
| npm | 10.x | Đi kèm Node.js |
| Docker Desktop | 24.x+ | Dùng để chạy PostgreSQL & Redis |
| Git | 2.x+ | |

---

## 🚀 Cài đặt dự án

### 1. Clone repository

```bash
git clone <repo-url>
cd tiktokweb/backend
```

### 2. Cài đặt dependencies

> Tất cả package đã được **pin cứng version** để tránh lỗi khi cài lại.

```bash
npm install
```

### 3. Tạo file `.env`

Tạo file `.env` tại thư mục `backend/` (copy từ `.env.example` nếu có):

```bash
cp .env.example .env
```

Nội dung `.env` cần thiết:

```env
# ===== Database =====
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tiktokdb"

# ===== Redis =====
REDIS_HOST=localhost
REDIS_PORT=6379

# ===== JWT =====
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ===== Google OAuth =====
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# ===== AWS S3 =====
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name

# ===== App =====
PORT=3000
NODE_ENV=development
```

---

## 🐳 Khởi động Database & Redis bằng Docker

Tạo file `docker-compose.yml` tại thư mục gốc dự án (hoặc `backend/`) nếu chưa có:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: tiktok_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: tiktokdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: tiktok_redis
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

Chạy Docker:

```bash
docker compose up -d
```

Kiểm tra containers đang chạy:

```bash
docker compose ps
```

---

## 🗄️ Setup Prisma & Database

### Tạo bảng từ schema (migration)

```bash
npx prisma migrate dev --name init
```

### Tạo Prisma Client

```bash
npx prisma generate
```

### Seed dữ liệu ban đầu (tùy chọn)

```bash
npx prisma db seed
```

### Mở Prisma Studio (GUI quản lý DB)

```bash
npx prisma studio
```

---

## ▶️ Chạy ứng dụng

```bash
# Development (watch mode — tự reload khi code thay đổi)
npm run start:dev

# Development (không watch)
npm run start

# Production
npm run start:prod
```

Server chạy tại: **http://localhost:3000**

---

## 🧪 Chạy tests

```bash
# Unit tests
npm run test

# Unit tests (watch mode)
npm run test:watch

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## 🔧 Các lệnh hữu ích khác

```bash
# Format code
npm run format

# Lint & auto-fix
npm run lint

# Build production bundle
npm run build
```

---

## 📦 Tech Stack

| Package | Version | Vai trò |
|---------|---------|---------|
| `@nestjs/core` | 11.1.19 | Framework chính |
| `@prisma/client` | 5.22.0 | ORM — query database |
| `prisma` | 5.22.0 | CLI — migrate, generate, seed |
| `@nestjs/jwt` | 11.0.2 | JWT authentication |
| `@nestjs/passport` | 11.0.5 | Passport strategies |
| `ioredis` | 5.10.1 | Redis client |
| `@aws-sdk/client-s3` | 3.1035.0 | AWS S3 upload |
| `typescript` | 6.0.3 | Ngôn ngữ |

---

## 📂 Cấu trúc thư mục

```
backend/
├── prisma/
│   ├── schema.prisma      # Định nghĩa toàn bộ DB schema
│   ├── seed.ts            # Dữ liệu seed ban đầu
│   └── migrations/        # Lịch sử migrations
├── src/
│   ├── app.module.ts      # Root module
│   ├── main.ts            # Entry point
│   ├── auth/              # Authentication module (JWT, Google OAuth)
│   ├── user/              # User module
│   ├── prisma/            # PrismaService (global)
│   ├── redis/             # RedisService (global)
│   └── common/            # Guards, Decorators, Filters dùng chung
├── test/                  # E2E tests
├── .env                   # Biến môi trường (KHÔNG commit)
├── .env.example           # Template biến môi trường
└── package.json
```

---

## ⚠️ Lưu ý quan trọng

> **Prisma version:** Dự án đang dùng Prisma **5.22.0** (pin cứng). Không tự ý nâng lên Prisma 6+ hoặc 7+ vì có breaking changes về import path và cách cấu hình.

> **Pin version:** Tất cả package đã được pin exact version (không có `^` hay `~`). Khi cần nâng cấp, dùng `ncu` để kiểm tra trước, sau đó test kỹ.

> **@prisma/client** là `dependency` (không phải `devDependency`) vì cần thiết ở cả runtime production.

---

## 🐛 Troubleshooting

### Lỗi: `PrismaClient not found` hoặc `Cannot find module '@prisma/client'`

```bash
# Chạy lại generate
npx prisma generate
```

### Lỗi: `P1001: Can't reach database server`

- Kiểm tra Docker container PostgreSQL đang chạy: `docker compose ps`
- Kiểm tra `DATABASE_URL` trong `.env` đúng không

### Lỗi: `connect ECONNREFUSED 127.0.0.1:6379`

- Kiểm tra Redis container: `docker compose ps`
- Restart: `docker compose restart redis`

### Reset database hoàn toàn

```bash
npx prisma migrate reset
```

> ⚠️ Lệnh này sẽ **xóa toàn bộ dữ liệu** và chạy lại migrations + seed từ đầu.
