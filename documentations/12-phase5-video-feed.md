# 🎥 Phase 5: Video, Feed, Sound & Hashtag (Chi tiết từng bước)

> **Thời gian ước tính:** 5 ngày
> **Mục tiêu:** Upload video (Pre-signed URL), Feed algorithm, View counter (Redis batch), Sound & Hashtag
> **Điều kiện:** Phase 4 hoàn thành

---

## Bước 5.1: Tạo Storage Module (S3/Cloudinary)

### Tạo module:
```bash
nest generate module storage
nest generate service storage
```

### File `src/storage/storage.service.ts`

**Nhiệm vụ:** Abstract hóa storage provider (S3, R2, Cloudinary). Modules khác gọi `StorageService` mà không cần biết đang dùng S3 hay Cloudinary.

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get('AWS_S3_BUCKET');
    const endpoint = this.configService.get('AWS_S3_ENDPOINT');

    this.s3Client = new S3Client({
      region: this.configService.get('AWS_S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
      // Nếu có endpoint custom → dùng Cloudflare R2 thay vì AWS S3
      ...(endpoint && { endpoint, forcePathStyle: true }),
    });
  }

  // Tạo Pre-signed URL để Frontend upload trực tiếp
  // Tại sao Pre-signed URL?
  // 1. Video nặng (50-100MB), nếu đi qua backend → timeout, tốn bandwidth
  // 2. Pre-signed URL = "vé vào cửa có thời hạn" cho S3
  // 3. Frontend upload trực tiếp lên S3, nhanh hơn 10x
  async generatePresignedUploadUrl(
    fileKey: string,
    contentType: string,
    expiresInSeconds = 900, // 15 phút
  ): Promise<{ uploadUrl: string; fileKey: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,             // VD: "videos/uuid-123.mp4"
      ContentType: contentType, // VD: "video/mp4"
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return { uploadUrl, fileKey };
  }

  // Lấy public URL của file đã upload
  getPublicUrl(fileKey: string): string {
    const endpoint = this.configService.get('AWS_S3_ENDPOINT');
    if (endpoint) {
      // Cloudflare R2 public URL format
      return `${endpoint}/${this.bucket}/${fileKey}`;
    }
    // AWS S3 public URL format
    return `https://${this.bucket}.s3.${this.configService.get('AWS_S3_REGION')}.amazonaws.com/${fileKey}`;
  }

  // Xóa file từ S3
  async deleteFile(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });
    await this.s3Client.send(command);
  }
}
```

### Đánh dấu `StorageModule` là Global:

```typescript
// src/storage/storage.module.ts
import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
```

**→ Import `StorageModule` vào `AppModule`.**

---

## Bước 5.2: Tạo Video Module

```bash
nest generate module video
nest generate controller video
nest generate service video
```

### DTOs

**`src/video/dto/create-video.dto.ts`:**
```typescript
import {
  IsString, IsOptional, IsNumber, IsEnum, IsArray, Min,
} from 'class-validator';
import { VideoVisibility } from '@prisma/client';

export class CreateVideoDto {
  @IsString()
  fileKey: string;
  // fileKey = path trên S3. VD: "videos/abc-123.mp4"
  // Frontend upload xong sẽ gửi fileKey này xuống để Backend lưu record

  @IsOptional()
  @IsString()
  title?: string; // Caption

  @IsNumber()
  @Min(0)
  duration: number; // Giây (frontend đọc từ video metadata)

  @IsNumber()
  width: number; // VD: 1080

  @IsNumber()
  height: number; // VD: 1920

  @IsNumber()
  sizeBytes: number;

  @IsOptional()
  @IsEnum(VideoVisibility)
  visibility?: VideoVisibility;

  @IsOptional()
  @IsString()
  soundId?: string; // ID sound nếu dùng nhạc nền có sẵn

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];
  // Frontend parse hashtag từ title và gửi riêng
  // VD: ["xuhuong", "fyp", "trending"]
}
```

### Video Service (Core Logic)

**`src/video/video.service.ts`** — các methods quan trọng:

```typescript
@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private storage: StorageService,
  ) {}

  // === GENERATE PRE-SIGNED URL ===
  async getPresignedUrl(userId: string) {
    // Tạo unique fileKey
    const fileKey = `videos/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;

    const result = await this.storage.generatePresignedUploadUrl(
      fileKey,
      'video/mp4',
    );

    return result;
    // FE nhận { uploadUrl, fileKey }
    // FE dùng uploadUrl để PUT file lên S3
    // FE gửi fileKey trong POST /videos để confirm
  }

  // === CONFIRM UPLOAD (Tạo Video record) ===
  async createVideo(userId: string, dto: CreateVideoDto) {
    const videoUrl = this.storage.getPublicUrl(dto.fileKey);

    // Transaction: tạo video + hashtags + update sound useCount
    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo Video
      const video = await tx.video.create({
        data: {
          title: dto.title,
          originalUrl: videoUrl,
          duration: dto.duration,
          width: dto.width,
          height: dto.height,
          sizeBytes: BigInt(dto.sizeBytes),
          visibility: dto.visibility || 'PUBLIC',
          authorId: userId,
          soundId: dto.soundId || null,
        },
      });

      // 2. Parse + tạo Hashtags
      if (dto.hashtags && dto.hashtags.length > 0) {
        for (const tagName of dto.hashtags) {
          const normalizedName = tagName.toLowerCase().replace('#', '');

          // Upsert: tạo mới nếu chưa có, tăng useCount nếu đã có
          const hashtag = await tx.hashtag.upsert({
            where: { name: normalizedName },
            create: { name: normalizedName, useCount: 1 },
            update: { useCount: { increment: 1 } },
          });

          // Tạo junction record
          await tx.videoHashtag.create({
            data: { videoId: video.id, hashtagId: hashtag.id },
          });
        }
      }

      // 3. Update Sound useCount (nếu có)
      if (dto.soundId) {
        await tx.sound.update({
          where: { id: dto.soundId },
          data: { useCount: { increment: 1 } },
        });
      }

      return video;
    });
  }

  // === FEED FOR YOU ===
  async getFeedForYou(pagination: PaginationDto, userId?: string) {
    const { cursor, limit = 10 } = pagination;

    // MVP Feed Algorithm:
    // Sort bằng engagement score + recency
    // Chưa cần ML/AI, chỉ cần SQL đơn giản
    const videos = await this.prisma.video.findMany({
      where: {
        visibility: 'PUBLIC',
      },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: [
        // Ưu tiên video mới + engagement cao
        { createdAt: 'desc' },
      ],
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        sound: {
          select: { id: true, name: true, audioUrl: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    // Nếu user đã đăng nhập, check đã like/bookmark chưa
    let enrichedVideos = videos;
    if (userId) {
      const videoIds = videos.map((v) => v.id);

      const [likes, bookmarks] = await Promise.all([
        this.prisma.like.findMany({
          where: { userId, videoId: { in: videoIds } },
          select: { videoId: true },
        }),
        this.prisma.bookmark.findMany({
          where: { userId, videoId: { in: videoIds } },
          select: { videoId: true },
        }),
      ]);

      const likedSet = new Set(likes.map((l) => l.videoId));
      const bookmarkedSet = new Set(bookmarks.map((b) => b.videoId));

      enrichedVideos = videos.map((v) => ({
        ...v,
        isLiked: likedSet.has(v.id),
        isBookmarked: bookmarkedSet.has(v.id),
      }));
    }

    return {
      data: enrichedVideos,
      nextCursor: videos.length === limit ? videos[videos.length - 1].id : null,
    };
  }

  // === FEED FOLLOWING ===
  async getFeedFollowing(userId: string, pagination: PaginationDto) {
    const { cursor, limit = 10 } = pagination;

    // Lấy danh sách user đang follow
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return { data: [], nextCursor: null };
    }

    // Lấy videos từ những user đang follow
    const videos = await this.prisma.video.findMany({
      where: {
        authorId: { in: followingIds },
        visibility: 'PUBLIC',
      },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true, username: true, displayName: true,
            avatarUrl: true, isVerified: true,
          },
        },
        sound: { select: { id: true, name: true } },
      },
    });

    return {
      data: videos,
      nextCursor: videos.length === limit ? videos[videos.length - 1].id : null,
    };
  }

  // === RECORD VIEW (Redis) ===
  async recordView(videoId: string) {
    // INCR tăng counter trong Redis
    // Nhanh: O(1), ~0.1ms
    // Không query DB → không có bottleneck
    await this.redis.incr(`video:${videoId}:views`);
  }
}
```

---

## Bước 5.3: Tạo Tasks Module (CronJob — Batch Update)

```bash
nest generate module tasks
nest generate service tasks
```

### File `src/tasks/tasks.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // Chạy mỗi 5 phút: gom view count từ Redis → batch update DB
  // Tại sao không update DB mỗi view?
  // 1 triệu views/ngày = 1 triệu UPDATE queries = DB chết
  // Gom lại 5 phút/lần: 1 triệu views = 288 batch updates = nhẹ nhàng
  @Cron(CronExpression.EVERY_5_MINUTES)
  async batchUpdateViewCounts() {
    this.logger.log('⏰ Starting batch view count update...');

    try {
      // 1. Scan tất cả keys "video:*:views"
      const keys = await this.redis.scanKeys('video:*:views');

      if (keys.length === 0) {
        this.logger.log('No pending view counts');
        return;
      }

      // 2. Lấy giá trị từng key
      for (const key of keys) {
        const count = await this.redis.get(key);
        if (!count || parseInt(count) === 0) continue;

        // Parse videoId từ key: "video:abc-123:views" → "abc-123"
        const videoId = key.split(':')[1];

        // 3. Update DB
        await this.prisma.video.update({
          where: { id: videoId },
          data: { viewCount: { increment: parseInt(count) } },
        });

        // 4. Xóa key Redis (reset counter)
        await this.redis.del(key);
      }

      this.logger.log(`✅ Updated view counts for ${keys.length} videos`);
    } catch (error) {
      this.logger.error('❌ Batch view update failed:', error.message);
    }
  }

  // Cleanup: Xóa refresh tokens hết hạn (chạy mỗi ngày lúc 3h sáng)
  @Cron('0 3 * * *')
  async cleanupExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`🧹 Cleaned up ${result.count} expired refresh tokens`);
  }
}
```

---

## Bước 5.4: Sound & Hashtag Modules

### Sound Module (đơn giản):
```bash
nest generate module sound
nest generate controller sound
nest generate service sound
```

**Endpoints cần làm:**
- `GET /api/sounds/:id` — Chi tiết sound
- `GET /api/sounds/:id/videos` — Videos dùng sound này (cursor pagination)

### Hashtag Module:
```bash
nest generate module hashtag
nest generate controller hashtag
nest generate service hashtag
```

**Endpoints cần làm:**
- `GET /api/hashtags/trending` — Top hashtags sort by useCount
- `GET /api/hashtags/:name/videos` — Videos có hashtag này

---

## Bước 5.5: Video Controller

```typescript
// src/video/video.controller.ts
@Controller('videos')
export class VideoController {
  constructor(private videoService: VideoService) {}

  // GET /api/videos/presigned-url — Lấy URL upload
  @Get('presigned-url')
  @UseGuards(JwtAuthGuard)
  getPresignedUrl(@CurrentUser('id') userId: string) {
    return this.videoService.getPresignedUrl(userId);
  }

  // POST /api/videos — Confirm upload
  @Post()
  @UseGuards(JwtAuthGuard)
  createVideo(@CurrentUser('id') userId: string, @Body() dto: CreateVideoDto) {
    return this.videoService.createVideo(userId, dto);
  }

  // GET /api/videos/feed — Feed For You
  @Get('feed')
  getFeed(@Query() pagination: PaginationDto, @CurrentUser('id') userId?: string) {
    return this.videoService.getFeedForYou(pagination, userId);
  }

  // GET /api/videos/following — Feed Following
  @Get('following')
  @UseGuards(JwtAuthGuard)
  getFollowingFeed(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.videoService.getFeedFollowing(userId, pagination);
  }

  // GET /api/videos/:id — Chi tiết video
  @Get(':id')
  getVideo(@Param('id') id: string) {
    return this.videoService.getVideoById(id);
  }

  // POST /api/videos/:id/view — Ghi nhận view
  @Post(':id/view')
  recordView(@Param('id') id: string) {
    return this.videoService.recordView(id);
  }

  // DELETE /api/videos/:id — Xóa video (owner only)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteVideo(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.videoService.deleteVideo(userId, id);
  }
}
```

### ✅ Output Phase 5:
```
✅ StorageModule/Service — S3 pre-signed URL, public URL, delete
✅ GET /api/videos/presigned-url — Upload URL
✅ POST /api/videos — Confirm upload + hashtags + sound
✅ GET /api/videos/feed — Feed For You (cursor)
✅ GET /api/videos/following — Feed Following
✅ POST /api/videos/:id/view — Redis INCR
✅ CronJob batch update views mỗi 5 phút
✅ Sound + Hashtag basic endpoints
```

---

## ⏭️ Tiếp theo: [Phase 6 — Interaction & Realtime Comment](./13-phase6-interaction-realtime.md)
