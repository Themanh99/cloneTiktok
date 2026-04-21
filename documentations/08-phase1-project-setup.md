# 🚀 Phase 1: Project Setup & Infrastructure (Chi tiết từng bước)

> **Thời gian ước tính:** 2-3 ngày
> **Mục tiêu:** NestJS project chạy được với đầy đủ config, Docker, logging, error handling

---

## Bước 1.1: Cài đặt Dependencies

### 🔧 Core Dependencies (Runtime — app cần để chạy)

```bash
cd d:\Code\tiktokweb\backend
```

**Từng lệnh và giải thích:**

```bash
npm install @nestjs/config
```
> **Tại sao:** Module đọc file `.env` và inject vào toàn bộ app. Không có cái này, bạn phải `process.env.XXX` thủ công khắp nơi, rất dễ sai. Với `ConfigModule`, bạn dùng `ConfigService.get('DATABASE_URL')` — type-safe và testable.

```bash
npm install @nestjs/jwt
```
> **Tại sao:** Module wrap thư viện `jsonwebtoken` cho NestJS. Dùng để tạo (sign) và xác thực (verify) JWT Access Token và Refresh Token. Không cần cài `jsonwebtoken` riêng.

```bash
npm install @nestjs/passport passport
```
> **Tại sao:** `passport` là thư viện authentication phổ biến nhất Node.js (hàng triệu download/tuần). `@nestjs/passport` là adapter để dùng passport trong NestJS với decorator `@UseGuards()`. Nó cho phép bạn tạo nhiều "strategy" (JWT, Google, Facebook...) và switch dễ dàng.

```bash
npm install passport-jwt
```
> **Tại sao:** Strategy cụ thể cho JWT. Khi request đến, nó tự động đọc token từ header `Authorization: Bearer xxx`, verify, và trả về user object.

```bash
npm install passport-google-oauth20
```
> **Tại sao:** Strategy cho Google SSO. Tuy nhiên trong dự án này, ta sẽ dùng cách **verify idToken trực tiếp** (FE gửi idToken, BE verify) thay vì redirect flow truyền thống. Vẫn cài để có option.

```bash
npm install @nestjs/schedule
```
> **Tại sao:** Module cho CronJob/Scheduled Tasks. Dùng để chạy batch update (gom view count từ Redis → DB mỗi 5 phút). Dùng decorator `@Cron('*/5 * * * *')` rất tiện.

```bash
npm install @nestjs/platform-socket.io @nestjs/websockets
```
> **Tại sao:** 2 package đi kèm nhau. `@nestjs/websockets` cung cấp decorator (`@WebSocketGateway`, `@SubscribeMessage`), còn `@nestjs/platform-socket.io` là adapter dùng Socket.io làm engine. Socket.io hỗ trợ auto-reconnect, room, namespace — cần cho comment realtime.

```bash
npm install @prisma/client
```
> **Tại sao:** Prisma Client là thư viện để query database. Khi bạn chạy `npx prisma generate`, nó sẽ tạo ra TypeScript types dựa trên schema của bạn. Mỗi khi code `prisma.user.findMany()`, bạn được autocomplete đầy đủ.

```bash
npm install ioredis
```
> **Tại sao:** Client kết nối Redis cho Node.js. Chọn `ioredis` thay vì `redis` (official) vì `ioredis` hỗ trợ cluster, pipeline, và API dễ dùng hơn. Dùng cho: cache view count, rate limiting, Socket.io adapter.

```bash
npm install @socket.io/redis-adapter
```
> **Tại sao:** Khi bạn chạy nhiều server instances (scale horizontal), mỗi instance có Socket.io riêng. Redis Adapter đồng bộ event giữa các instances qua Redis Pub/Sub. User A kết nối server 1, User B kết nối server 2, cả 2 vẫn nhận được comment realtime.

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```
> **Tại sao:** `client-s3` là SDK chính thức của AWS để tương tác với S3 (hoặc S3-compatible như Cloudflare R2). `s3-request-presigner` dùng để tạo Pre-signed URL — cho phép FE upload trực tiếp lên S3 mà không cần đi qua backend. Quan trọng: Cloudinary cũng dùng được nhưng API khác, ta sẽ abstract qua StorageService.

```bash
npm install class-validator class-transformer
```
> **Tại sao:** 2 thư viện validation cho DTO (Data Transfer Object). `class-validator` dùng decorator (`@IsEmail()`, `@IsString()`, `@MinLength(8)`) để validate request body. `class-transformer` chuyển đổi plain object thành class instance. NestJS `ValidationPipe` cần cả 2 để hoạt động.

```bash
npm install bcrypt
```
> **Tại sao:** Hash password. KHÔNG BAO GIỜ lưu password dạng plain text. `bcrypt` dùng salt + nhiều round hash (10 rounds mặc định) khiến brute-force cực kỳ chậm. Một password hash mất ~100ms để tạo → hacker cần hàng trăm năm để brute-force.

```bash
npm install winston
```
> **Tại sao:** Logger chuyên nghiệp thay cho `console.log`. Hỗ trợ log levels (error, warn, info, debug), format JSON (dễ parse bằng tools), ghi ra file, và tích hợp với monitoring services. Production app PHẢI có structured logging.

```bash
npm install @nestjs/throttler
```
> **Tại sao:** Rate limiting toàn cục. Ví dụ: giới hạn 100 request/phút/IP để chống DDoS và abuse. Khác với rate limit comment (dùng Redis), cái này protect toàn bộ API.

```bash
npm install google-auth-library
```
> **Tại sao:** Thư viện chính thức của Google để verify `idToken` từ Google Sign-In. Khi FE dùng Google SDK để login, nó nhận được 1 `idToken`. BE dùng thư viện này để verify token đó có hợp lệ không (chống giả mạo).

---

### 🔧 Dev Dependencies (Chỉ dùng khi develop, không vào production)

```bash
npm install -D prisma
```
> **Tại sao:** CLI tool cho Prisma (migration, generate, seed...). Cài dev vì production chỉ cần `@prisma/client`. Lệnh quan trọng: `npx prisma migrate dev`, `npx prisma generate`, `npx prisma studio`.

```bash
npm install -D @types/passport-jwt @types/passport-google-oauth20 @types/bcrypt
```
> **Tại sao:** TypeScript type definitions cho các thư viện trên. Không có thì TypeScript sẽ báo lỗi "Could not find declaration file". Chỉ cần khi compile, không vào runtime.

---

## Bước 1.2: Khởi tạo Prisma

```bash
npx prisma init
```

**Lệnh này tạo ra:**
- `prisma/schema.prisma` — File khai báo database schema (models, relations, indexes)
- `.env` — File chứa `DATABASE_URL` (nếu chưa có)

> **⚠️ Chưa viết schema vội!** Phase 2 mới viết. Bước này chỉ tạo cấu trúc thư mục.

Mở file `prisma/schema.prisma`, đảm bảo nó có:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Bước 1.3: Tạo file `.env` và `.env.example`

### Tạo `.env.example` (commit lên Git — KHÔNG chứa giá trị thật)

```bash
# Tạo file tại: d:\Code\tiktokweb\backend\.env.example
```

```env
# ============================================
# APP
# ============================================
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# ============================================
# DATABASE (PostgreSQL)
# ============================================
DATABASE_URL="postgresql://user:password@localhost:5432/tiktok_db?schema=public"

# ============================================
# REDIS
# ============================================
REDIS_URL="redis://localhost:6379"

# ============================================
# STORAGE (S3 / Cloudflare R2)
# ============================================
AWS_S3_BUCKET=
AWS_S3_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_ENDPOINT=

# ============================================
# CLOUDINARY (Video processing)
# ============================================
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ============================================
# JWT
# ============================================
JWT_ACCESS_SECRET=change_me_to_random_string_64chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=change_me_to_another_random_string_64chars
JWT_REFRESH_EXPIRATION=7d

# ============================================
# GOOGLE OAuth
# ============================================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# ============================================
# CRON & RATE LIMITING
# ============================================
VIEW_BATCH_INTERVAL_MINUTES=5
LIKE_BATCH_INTERVAL_MINUTES=5
COMMENT_RATE_LIMIT=5
COMMENT_RATE_WINDOW_SECONDS=60
```

### Tạo `.env` (KHÔNG commit — .gitignore phải có)

Copy `.env.example` thành `.env`, điền giá trị thật cho local development:

```bash
# Local dev — dùng Docker Compose cho PostgreSQL + Redis
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/tiktok_db?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="dev_access_secret_khong_dung_tren_production"
JWT_REFRESH_SECRET="dev_refresh_secret_khong_dung_tren_production"
```

### Kiểm tra `.gitignore`

Mở `d:\Code\tiktokweb\backend\.gitignore`, đảm bảo có:
```
.env
node_modules/
dist/
```

> **⚠️ Đặc biệt quan trọng:** `.env` KHÔNG BAO GIỜ được commit lên Git. Nó chứa secrets (JWT keys, DB password, API keys). Chỉ commit `.env.example`.

---

## Bước 1.4: Tạo Docker files

### Tạo `Dockerfile` tại `d:\Code\tiktokweb\backend\Dockerfile`

```dockerfile
# ============================================
# Stage 1: Build (Image lớn ~800MB, có source code)
# ============================================
FROM node:18-alpine AS builder
WORKDIR /app

# Trick: Copy package*.json TRƯỚC, rồi mới install
# → Docker cache layer: nếu package.json không đổi, npm install sẽ skip
COPY package*.json ./
RUN npm ci
# npm ci thay vì npm install: ci = clean install
# - Xóa node_modules cũ
# - Install chính xác version trong package-lock.json
# - Nhanh hơn npm install trong CI/CD

COPY . .
RUN npx prisma generate
RUN npm run build

# ============================================
# Stage 2: Production (Image nhỏ ~200MB)
# ============================================
FROM node:18-alpine
WORKDIR /app

# Chỉ copy artifacts cần thiết, bỏ source code + dev dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Chạy migration trước khi start app
# prisma migrate deploy: chạy pending migrations (không tạo migration mới)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

> **Tại sao multi-stage build?** Stage 1 có TypeScript compiler, source code, devDependencies (~800MB). Stage 2 chỉ có compiled JS + runtime deps (~200MB). Giảm 75% size → deploy nhanh hơn.

### Tạo `docker-compose.yml` tại `d:\Code\tiktokweb\backend\docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL cho local development
  postgres:
    image: postgres:15-alpine
    container_name: tiktok-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: tiktok_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    volumes:
      - pgdata:/var/lib/postgresql/data
    # volumes giữ data khi container restart
    # Không có volumes → mỗi lần restart mất hết data

  # Redis cho local development
  redis:
    image: redis:7-alpine
    container_name: tiktok-redis
    ports:
      - "6379:6379"
    # Redis mặc định không cần password ở local
    # Production phải set password

volumes:
  pgdata:
    # Named volume — Docker quản lý location trên disk
    # Data persist giữa các lần docker-compose down/up
```

### Tạo `.dockerignore` tại `d:\Code\tiktokweb\backend\.dockerignore`

```
node_modules
dist
.env
.git
*.md
```

> **Tại sao cần `.dockerignore`?** Khi Docker build, nó COPY toàn bộ thư mục vào image. `.dockerignore` loại bỏ files không cần thiết → build nhanh hơn, image nhỏ hơn.

### Khởi động DB + Redis local:

```bash
docker-compose up -d
# -d = detached mode (chạy background)
# Kiểm tra: docker-compose ps
# Kết quả: postgres + redis đều "Up"
```

---

## Bước 1.5: Cấu hình `app.module.ts` (File gốc của ứng dụng)

Mở `src/app.module.ts` và sửa thành:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // 1. ConfigModule: Đọc file .env
    // isGlobal: true → Không cần import lại trong từng module con
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. ThrottlerModule: Rate limiting toàn cục
    // ttl: 60000ms = 1 phút
    // limit: 100 = tối đa 100 requests / 1 phút / 1 IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // 3. ScheduleModule: Cho phép dùng @Cron() decorator
    ScheduleModule.forRoot(),

    // Các module sẽ thêm dần ở các Phase sau:
    // PrismaModule,     ← Phase 2
    // RedisModule,      ← Phase 2
    // AuthModule,       ← Phase 3
    // UserModule,       ← Phase 4
    // VideoModule,      ← Phase 5
    // ...
  ],
})
export class AppModule {}
```

> **Giải thích thứ tự import:** ConfigModule phải đứng ĐẦU TIÊN vì các module khác (Prisma, Redis...) cần đọc env variables. Nếu ConfigModule chưa load xong mà PrismaModule đã cố đọc `DATABASE_URL` → crash.

---

## Bước 1.6: Cấu hình `main.ts` (Entry point)

Mở `src/main.ts` và sửa thành:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Global Prefix: Tất cả API bắt đầu bằng /api
  // VD: /api/auth/login, /api/videos/feed
  // Tại sao: Phân biệt API routes vs Frontend routes khi deploy chung domain
  app.setGlobalPrefix('api');

  // 2. CORS: Cho phép Frontend gọi API
  // Nếu không bật CORS, browser sẽ chặn request từ localhost:3001 → localhost:3000
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true, // Cho phép gửi cookies/auth header
  });

  // 3. Validation Pipe: Tự động validate request body theo DTO
  // whitelist: true → Tự động strip các field không khai báo trong DTO
  // VD: DTO chỉ có {email, password}, client gửi {email, password, isAdmin: true}
  //     → isAdmin bị strip bỏ, chống injection
  // forbidNonWhitelisted: true → Trả lỗi nếu client gửi field lạ
  // transform: true → Tự động chuyển type (string "123" → number 123)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 4. Global Exception Filter: Format lỗi trả về thống nhất
  // Mọi lỗi (400, 401, 404, 500...) đều trả về format:
  // { statusCode, message, error, timestamp, path }
  app.useGlobalFilters(new HttpExceptionFilter());

  // 5. Shutdown hooks: Graceful shutdown
  // Khi server tắt (deploy mới, restart), nó sẽ đợi request đang xử lý xong
  // rồi mới tắt, thay vì cắt ngang → tránh mất data
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  Logger.log(`🚀 Server running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
```

---

## Bước 1.7: Tạo thư mục `common/` (Shared utilities)

### Cấu trúc thư mục:
```
src/common/
├── decorators/
│   └── current-user.decorator.ts
├── filters/
│   └── http-exception.filter.ts
├── guards/
│   └── jwt-auth.guard.ts
├── interceptors/
│   └── transform.interceptor.ts
└── dto/
    └── pagination.dto.ts
```

### File 1: `src/common/filters/http-exception.filter.ts`

```typescript
import {
  ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

// @Catch(HttpException): Bắt TẤT CẢ HttpException
// Tại sao cần? Mặc định NestJS trả lỗi format khác nhau tùy loại exception.
// Filter này đảm bảo MỌI lỗi đều có cùng format → Frontend dễ handle.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Format chuẩn cho MỌI response lỗi
    response.status(status).json({
      statusCode: status,
      message: typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message,
      error: HttpStatus[status],        // VD: "NOT_FOUND", "UNAUTHORIZED"
      timestamp: new Date().toISOString(),
      path: request.url,                 // VD: "/api/auth/login"
    });
  }
}
```

### File 2: `src/common/interceptors/transform.interceptor.ts`

```typescript
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interceptor này wrap TẤT CẢ response thành công thành format chuẩn:
// { data: ..., statusCode: 200, timestamp: "..." }
//
// Tại sao? Consistency. Frontend luôn biết response.data là data thật.
// Không cần đoán "field nào là data, field nào là metadata?"
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        data,
        statusCode: context.switchToHttp().getResponse().statusCode,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### File 3: `src/common/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Custom decorator: Lấy user hiện tại từ request
// Thay vì viết: request.user (phải import Request, cast type...)
// Bạn chỉ cần: @CurrentUser() user: User
//
// Cách hoạt động:
// 1. JWT Guard verify token → gắn user vào request.user
// 2. @CurrentUser() đọc request.user và trả về
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    // Nếu truyền field name: @CurrentUser('id') → chỉ trả user.id
    return data ? user?.[data] : user;
  },
);
```

### File 4: `src/common/dto/pagination.dto.ts`

```typescript
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// DTO cho Cursor-based Pagination
// Tại sao cursor thay vì offset/limit?
// - Feed video thêm mới liên tục
// - Offset: load page 2 → video mới insert → page 2 bị lặp video page 1
// - Cursor: "cho tôi 10 video SAU video có id=xxx" → không bao giờ lặp
export class PaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string; // ID của item cuối cùng ở page trước

  @IsOptional()
  @Type(() => Number) // Query params luôn là string, cần transform sang number
  @IsInt()
  @Min(1)
  @Max(50) // Giới hạn tối đa 50 items/page, chống abuse
  limit?: number = 10; // Default 10 items/page
}
```

---

## Bước 1.8: Xóa files mặc định không cần

Xóa các file mặc định do `nest new` tạo ra (không cần nữa):
- `src/app.controller.ts` — Sẽ không dùng, mỗi module có controller riêng
- `src/app.controller.spec.ts` — Test file của controller đã xóa
- `src/app.service.ts` — Sẽ không dùng

> **Lưu ý:** Sau khi xóa, phải sửa `app.module.ts` bỏ import `AppController` và `AppService`.

---

## Bước 1.9: Kiểm tra Phase 1 hoàn thành

### Checklist:

```bash
# 1. Docker Compose chạy được
docker-compose up -d
docker-compose ps
# → postgres: Up, redis: Up

# 2. NestJS build không lỗi
npm run build
# → Không có TypeScript errors

# 3. NestJS start được
npm run start:dev
# → "🚀 Server running on http://localhost:3000"

# 4. Test health check
curl http://localhost:3000/api
# → Sẽ trả 404 (chưa có route nào) — nhưng server phải respond, KHÔNG crash

# 5. .env đang được đọc
# Thêm console.log tạm trong main.ts:
# Logger.log(`Frontend URL: ${configService.get('FRONTEND_URL')}`);
# → Phải in ra giá trị từ .env
```

### ✅ Output Phase 1:
```
✅ Tất cả dependencies đã cài (16 runtime + 4 dev)
✅ Prisma init xong (chưa có schema)
✅ Docker Compose chạy PostgreSQL + Redis local
✅ .env + .env.example
✅ Dockerfile multi-stage build
✅ ConfigModule (global) + ThrottlerModule + ScheduleModule
✅ main.ts: CORS, ValidationPipe, ExceptionFilter, Logger
✅ common/: decorators, filters, interceptors, dto
✅ .gitignore + .dockerignore
```

---

## ⏭️ Tiếp theo: [Phase 2 — Database & Prisma](./09-phase2-database-prisma.md)
