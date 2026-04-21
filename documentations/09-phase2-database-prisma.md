# 🗄️ Phase 2: Database & Prisma (Chi tiết từng bước)

> **Thời gian ước tính:** 2 ngày
> **Mục tiêu:** Schema hoàn chỉnh, migration, seed data, PrismaService + RedisService global
> **Điều kiện:** Phase 1 đã hoàn thành, Docker PostgreSQL + Redis đang chạy

---

## Bước 2.1: Viết Prisma Schema

Mở file `prisma/schema.prisma` và viết toàn bộ schema.

### Thứ tự viết (quan trọng — viết model nào trước?)

Prisma cần các model được khai báo trước khi tham chiếu. Thứ tự đề xuất:

```
1. Enums (AuthProvider, AccountStatus, VideoVisibility, NotificationType)
2. Master Data (Language, SystemSetting)
3. Core Models (User, Video, Sound, Comment)
4. Junction Tables (Follow, Like, Bookmark, VideoHashtag)
5. Support Models (Hashtag, RefreshToken, Notification)
```

### Phần 1: Generator & Datasource + Enums

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ================= ENUMS =================
// Tại sao dùng enum thay vì string?
// 1. Database-level validation: DB từ chối nếu giá trị không hợp lệ
// 2. TypeScript type-safe: IDE autocomplete, compiler báo lỗi
// 3. Performance: Enum lưu dạng int trong PostgreSQL, nhẹ hơn string

enum AuthProvider {
  LOCAL     // Đăng ký bằng email/password
  GOOGLE    // Google SSO
  FACEBOOK  // Facebook SSO (tương lai)
  APPLE     // Apple SSO (tương lai)
}

enum AccountStatus {
  ACTIVE    // Tài khoản hoạt động bình thường
  BANNED    // Bị ban vĩnh viễn
  SUSPENDED // Tạm khóa (có thể mở lại)
}

enum VideoVisibility {
  PUBLIC       // Ai cũng xem được
  FRIENDS_ONLY // Chỉ followers xem được
  PRIVATE      // Chỉ mình xem
}

enum NotificationType {
  LIKE     // Ai đó like video của bạn
  COMMENT  // Ai đó comment video của bạn
  FOLLOW   // Ai đó follow bạn
  MENTION  // Ai đó mention @bạn trong comment
}
```

### Phần 2: Master Data

```prisma
// ================= MASTER DATA =================
// Master data = dữ liệu tĩnh, ít thay đổi, seed 1 lần

model Language {
  id       Int      @id @default(autoincrement())
  // autoincrement thay vì UUID: master data ít record, int tiết kiệm hơn
  code     String   @unique @db.VarChar(10)  // "vi", "en", "jp"
  name     String   @db.VarChar(50)          // "Vietnamese", "English"
  isActive Boolean  @default(true)
  users    User[]

  @@map("languages") // Table name trong PostgreSQL = "languages" (snake_case)
}

model SystemSetting {
  id          Int      @id @default(autoincrement())
  key         String   @unique @db.VarChar(100) // "max_upload_size", "maintenance_mode"
  value       String   @db.Text                 // Text vì value có thể rất dài
  description String?  @db.VarChar(255)         // Mô tả cho dev hiểu
  updatedAt   DateTime @updatedAt               // Tự động cập nhật khi edit

  @@map("system_settings")
}
```

### Phần 3: User & Authentication

```prisma
// ================= USER =================

model User {
  id             String        @id @default(uuid())
  // UUID thay vì autoincrement vì:
  // 1. Không lộ tổng số user (id=1000 → biết có ~1000 user)
  // 2. Không đoán được URL (/users/1, /users/2...)
  // 3. Merge data từ nhiều DB dễ hơn (không conflict id)

  // --- Login Info ---
  email          String?       @unique
  // Nullable vì: user đăng nhập bằng phone hoặc SSO không cấp email
  phone          String?       @unique
  password       String?
  // Nullable vì: SSO users không có password (login bằng Google token)
  provider       AuthProvider  @default(LOCAL)
  providerId     String?
  // ID từ Google/Facebook. VD: Google trả "1234567890", lưu ở đây
  // Dùng để check user đã từng login bằng Google chưa

  // --- Profile Info ---
  username       String        @unique @db.VarChar(50)
  // @unique: không ai trùng username
  // @db.VarChar(50): giới hạn 50 ký tự ở DB level (ngoài validation ở app)
  displayName    String        @db.VarChar(100)
  avatarUrl      String?       @db.Text
  // Text thay vì VarChar vì URL có thể rất dài (Cloudinary URL ~200 chars)
  bio            String?       @db.VarChar(200) // Giới hạn 200 ký tự như TikTok
  dob            DateTime?     @db.Date         // Chỉ lưu ngày, không cần giờ
  gender         Int?          // 0: Khác, 1: Nam, 2: Nữ
  isVerified     Boolean       @default(false)  // Tích xanh
  status         AccountStatus @default(ACTIVE)

  // --- Settings ---
  languageId     Int?
  language       Language?     @relation(fields: [languageId], references: [id])

  // --- Denormalized Counters ---
  // Tại sao lưu counter trong User thay vì COUNT(*) mỗi lần?
  // SELECT COUNT(*) FROM follows WHERE followingId = 'xxx' → FULL TABLE SCAN
  // Với 1 triệu followers → mỗi request profile mất 500ms+
  // Lưu counter → query O(1), chỉ cần WHERE id = 'xxx'
  followerCount  Int           @default(0)
  followingCount Int           @default(0)
  totalLikes     Int           @default(0)

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  // --- Relations ---
  videos         Video[]
  comments       Comment[]
  likes          Like[]
  bookmarks      Bookmark[]
  followers      Follow[]        @relation("UserFollowers")
  following      Follow[]        @relation("UserFollowing")
  sounds         Sound[]         @relation("UserUploadedSounds")
  refreshTokens  RefreshToken[]
  sentNotifications     Notification[] @relation("NotificationSender")
  receivedNotifications Notification[] @relation("NotificationReceiver")

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  // Token hash (không lưu token gốc, tương tự password)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // onDelete: Cascade → Xóa user → tự động xóa tất cả refresh tokens
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  // Index vì hay query: "tìm token của user này"
  @@index([expiresAt])
  // Index vì cần cleanup: "xóa tokens hết hạn"
  @@map("refresh_tokens")
}
```

### Phần 4: Follow (Junction Table)

```prisma
model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower    User @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  following   User @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)

  // Composite Primary Key: 1 cặp (follower, following) chỉ tồn tại 1 lần
  // → Không thể follow cùng 1 người 2 lần (DB level constraint)
  @@id([followerId, followingId])
  @@index([followingId])
  // Index followingId vì hay query: "ai follow user này?" (lấy danh sách followers)
  // followerId đã có index (là phần đầu của composite PK)
  @@map("follows")
}
```

### Phần 5: Video & Sound

```prisma
model Sound {
  id         String   @id @default(uuid())
  name       String   @db.VarChar(200)
  audioUrl   String   @db.Text
  duration   Int      // Giây
  coverUrl   String?  @db.Text

  uploaderId String?
  uploader   User?    @relation("UserUploadedSounds", fields: [uploaderId], references: [id], onDelete: SetNull)
  // onDelete: SetNull → Xóa user → sound vẫn còn (nhưng uploader = null)
  // Vì nhiều video khác đang dùng sound này, không nên xóa

  useCount   Int      @default(0) // Số video dùng nhạc này

  createdAt  DateTime @default(now())
  videos     Video[]

  @@map("sounds")
}

model Video {
  id              String          @id @default(uuid())
  title           String?         @db.VarChar(500) // Caption

  // --- Video Source ---
  originalUrl     String          @db.Text  // MP4 gốc trên S3/Cloudinary
  hlsUrl          String?         @db.Text  // M3U8 cho HLS streaming
  // Tại sao cần cả 2?
  // originalUrl: file gốc, dùng cho download
  // hlsUrl: file đã convert sang HLS, chia thành chunks 2-3s
  //         → stream mượt, adaptive bitrate, tiết kiệm data
  thumbnailUrl    String?         @db.Text  // GIF/JPG preview khi hover
  coverUrl        String?         @db.Text  // Ảnh tĩnh
  duration        Float           // Giây (Float vì có thể 15.5s)
  width           Int             // 1080
  height          Int             // 1920
  sizeBytes       BigInt          // Dung lượng file
  // BigInt vì video có thể > 2GB (Int max = 2.1GB)

  // --- Settings ---
  visibility      VideoVisibility @default(PUBLIC)
  allowComments   Boolean         @default(true)
  allowDuet       Boolean         @default(true)
  allowDownload   Boolean         @default(true)

  // --- Denormalized Metrics ---
  // Tất cả counter đều được cập nhật qua Transaction hoặc Batch Update
  // KHÔNG BAO GIỜ dùng COUNT(*) để tính
  viewCount       Int   @default(0) // Cập nhật qua Redis CronJob (batch)
  likeCount       Int   @default(0) // Cập nhật qua Transaction
  commentCount    Int   @default(0) // Cập nhật qua Transaction
  shareCount      Int   @default(0) // Cập nhật qua Transaction
  bookmarkCount   Int   @default(0) // Cập nhật qua Transaction
  completionRate  Float @default(0) // % user xem hết video → dùng cho feed algorithm

  // --- Foreign Keys ---
  authorId  String
  author    User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  soundId   String?
  sound     Sound? @relation(fields: [soundId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // --- Relations ---
  comments  Comment[]
  likes     Like[]
  bookmarks Bookmark[]
  hashtags  VideoHashtag[]

  // --- Indexes ---
  @@index([createdAt])  // Sort feed theo thời gian
  @@index([authorId])   // Lấy video của 1 user
  @@index([soundId])    // Lấy video dùng cùng 1 sound

  @@map("videos")
}
```

### Phần 6: Hashtag

```prisma
model Hashtag {
  id       String         @id @default(uuid())
  name     String         @unique @db.VarChar(100)
  // Lưu KHÔNG có dấu #. VD: "xuhuong", "fyp"
  // @unique: không trùng tên hashtag
  useCount Int            @default(0) // Số video dùng tag này
  videos   VideoHashtag[]

  @@map("hashtags")
}

model VideoHashtag {
  videoId   String
  hashtagId String
  video     Video   @relation(fields: [videoId], references: [id], onDelete: Cascade)
  hashtag   Hashtag @relation(fields: [hashtagId], references: [id], onDelete: Cascade)

  @@id([videoId, hashtagId]) // 1 video không gắn 1 hashtag 2 lần
  @@map("video_hashtags")
}
```

### Phần 7: Interactions

```prisma
model Like {
  userId    String
  videoId   String
  createdAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  video Video @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@id([userId, videoId]) // 1 user chỉ like 1 video 1 lần
  @@index([videoId])      // Lấy ai đã like video này
  @@map("likes")
}

model Bookmark {
  userId    String
  videoId   String
  createdAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  video Video @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@id([userId, videoId])
  @@map("bookmarks")
}

model Comment {
  id        String   @id @default(uuid())
  content   String   @db.Text
  likeCount Int      @default(0) // Comment cũng có thể "thả tim"

  videoId   String
  video     Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  // --- Nested Comments (Reply) ---
  // parentId = null → comment gốc (top-level)
  // parentId = "xxx" → reply cho comment "xxx"
  parentId  String?
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")

  // --- Mentions ---
  mentions  String[] // Mảng UserID. VD: ["uuid1", "uuid2"]
  // Tại sao String[] thay vì relation table?
  // → Đơn giản hơn cho MVP, mention chỉ cần hiển thị, không cần query ngược

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([videoId, createdAt]) // Lấy comments của video, sort thời gian
  @@index([parentId])           // Lấy replies của 1 comment
  @@map("comments")
}
```

### Phần 8: Notification

```prisma
model Notification {
  id         String           @id @default(uuid())
  type       NotificationType
  read       Boolean          @default(false)

  senderId   String
  sender     User @relation("NotificationSender", fields: [senderId], references: [id], onDelete: Cascade)
  receiverId String
  receiver   User @relation("NotificationReceiver", fields: [receiverId], references: [id], onDelete: Cascade)

  // Optional references — tuỳ loại notification
  videoId    String?   // Like/Comment nào, trên video nào
  commentId  String?   // Comment nào (nếu type = COMMENT/MENTION)

  createdAt  DateTime  @default(now())

  @@index([receiverId, read, createdAt])
  // Composite index cho query: "lấy thông báo chưa đọc của user, sort mới nhất"
  @@map("notifications")
}
```

---

## Bước 2.2: Chạy Migration

```bash
# Tạo migration đầu tiên
npx prisma migrate dev --name init
```

**Lệnh này làm gì:**
1. So sánh schema mới vs DB hiện tại (trống)
2. Tạo file SQL migration trong `prisma/migrations/20260422_init/migration.sql`
3. Chạy SQL đó trên PostgreSQL
4. Chạy `prisma generate` → tạo TypeScript types

**Kết quả mong đợi:**
```
✅ Created migration: 20260422_init
✅ Applied 1 migration
✅ Generated Prisma Client
```

**Kiểm tra:**
```bash
# Mở Prisma Studio — giao diện web xem DB
npx prisma studio
# → Trình duyệt mở localhost:5555
# → Thấy tất cả 13 tables (trống, chưa có data)
```

---

## Bước 2.3: Tạo Seed Data

### Tạo file `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Languages
  console.log('🌐 Seeding Languages...');
  await prisma.language.createMany({
    data: [
      { code: 'vi', name: 'Tiếng Việt' },
      { code: 'en', name: 'English' },
      { code: 'jp', name: '日本語' },
      { code: 'ko', name: '한국어' },
    ],
    skipDuplicates: true, // Không lỗi nếu chạy seed lại
  });

  // 2. Seed System Settings
  console.log('⚙️ Seeding System Settings...');
  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'max_upload_size_mb',
        value: '100',
        description: 'Maximum video upload size in MB',
      },
      {
        key: 'max_video_duration_seconds',
        value: '180',
        description: 'Maximum video duration in seconds (3 minutes)',
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Enable/disable maintenance mode',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Cấu hình seed trong `package.json`

Thêm vào `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### Chạy seed:

```bash
npx prisma db seed
# → "✅ Seed completed!"

# Kiểm tra bằng Prisma Studio
npx prisma studio
# → Bảng Language có 4 records
# → Bảng SystemSetting có 3 records
```

---

## Bước 2.4: Tạo PrismaModule (Global)

### File `src/prisma/prisma.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global(): Module này chỉ cần import 1 lần ở AppModule
// Tất cả module khác tự động dùng được PrismaService
// Không cần import PrismaModule ở AuthModule, UserModule, VideoModule...
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export để module khác inject được
})
export class PrismaModule {}
```

### File `src/prisma/prisma.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient         // Kế thừa tất cả methods: findMany, create, update...
  implements OnModuleInit, OnModuleDestroy
{
  // OnModuleInit: Tự động kết nối DB khi NestJS khởi động
  async onModuleInit() {
    await this.$connect();
  }

  // OnModuleDestroy: Ngắt kết nối khi NestJS shutdown
  // Quan trọng cho graceful shutdown — tránh connection leak
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// Cách sử dụng trong Service khác:
// constructor(private prisma: PrismaService) {}
// const users = await this.prisma.user.findMany();
```

---

## Bước 2.5: Tạo RedisModule (Global)

### File `src/redis/redis.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

### File `src/redis/redis.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.client = new Redis(redisUrl);

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      this.logger.error('❌ Redis error:', err.message);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // === Wrapper methods ===
  // Tại sao wrap thay vì expose client trực tiếp?
  // 1. Dễ test (mock RedisService thay vì mock Redis client)
  // 2. Dễ thay đổi implementation (đổi ioredis sang redis, chỉ sửa 1 file)
  // 3. Thêm logging/metrics dễ dàng

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  // Scan pattern — dùng cho batch update view count
  // SCAN thay vì KEYS vì KEYS block Redis khi data lớn
  async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, foundKeys] = await this.client.scan(
        cursor, 'MATCH', pattern, 'COUNT', 100,
      );
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');
    return keys;
  }

  // Expose raw client cho Socket.io Adapter
  getClient(): Redis {
    return this.client;
  }
}
```

---

## Bước 2.6: Import vào AppModule

Mở `src/app.module.ts`, thêm import:

```typescript
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,  // ← THÊM
    RedisModule,   // ← THÊM
  ],
})
export class AppModule {}
```

---

## Bước 2.7: Kiểm tra Phase 2 hoàn thành

```bash
# 1. Migration đã chạy thành công
npx prisma migrate status
# → "Database schema is up to date"

# 2. Prisma Studio mở được, thấy tất cả tables
npx prisma studio

# 3. Seed data có trong DB
# → Language table: 4 records
# → SystemSetting table: 3 records

# 4. NestJS start không lỗi, kết nối được DB + Redis
npm run start:dev
# → "✅ Redis connected"
# → Không có lỗi Prisma connection

# 5. Build không lỗi
npm run build
```

### ✅ Output Phase 2:
```
✅ Prisma schema: 13 models, tất cả enums, indexes, relations
✅ Migration init chạy thành công
✅ Seed data: Languages + SystemSettings
✅ PrismaModule + PrismaService (Global, auto-connect)
✅ RedisModule + RedisService (Global, wrapper methods)
✅ Cả 2 module đã import vào AppModule
```

---

## ⏭️ Tiếp theo: [Phase 3 — Auth Module](./10-phase3-auth-module.md)
