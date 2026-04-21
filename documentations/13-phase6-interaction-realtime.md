# 💬 Phase 6: Interaction & Realtime Comment (Chi tiết từng bước)

> **Thời gian ước tính:** 5 ngày
> **Mục tiêu:** Like/Bookmark, Comment (WebSocket realtime), Notification, Rate Limiting
> **Điều kiện:** Phase 5 hoàn thành

---

## Bước 6.1: Interaction Module (Like, Bookmark)

```bash
nest generate module interaction
nest generate controller interaction
nest generate service interaction
```

### Interaction Service — Like Logic

```typescript
// src/interaction/interaction.service.ts
@Injectable()
export class InteractionService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async likeVideo(userId: string, videoId: string) {
    // Check video tồn tại
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video không tồn tại');

    // Check đã like chưa
    const existing = await this.prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (existing) throw new ConflictException('Đã like video này rồi');

    // Transaction: tạo like + tăng counters
    await this.prisma.$transaction([
      this.prisma.like.create({ data: { userId, videoId } }),
      this.prisma.video.update({
        where: { id: videoId },
        data: { likeCount: { increment: 1 } },
      }),
      // Tăng totalLikes của author
      this.prisma.user.update({
        where: { id: video.authorId },
        data: { totalLikes: { increment: 1 } },
      }),
    ]);

    // Cache like status vào Redis (để check nhanh ở feed)
    await this.redis.set(`like:${userId}:${videoId}`, '1', 3600);
    // TTL 1 giờ — cache ngắn, nếu miss thì query DB

    return { message: 'Like thành công' };
  }

  async unlikeVideo(userId: string, videoId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (!existing) throw new NotFoundException('Chưa like video này');

    const video = await this.prisma.video.findUnique({ where: { id: videoId } });

    await this.prisma.$transaction([
      this.prisma.like.delete({
        where: { userId_videoId: { userId, videoId } },
      }),
      this.prisma.video.update({
        where: { id: videoId },
        data: { likeCount: { decrement: 1 } },
      }),
      this.prisma.user.update({
        where: { id: video.authorId },
        data: { totalLikes: { decrement: 1 } },
      }),
    ]);

    // Xóa cache
    await this.redis.del(`like:${userId}:${videoId}`);

    return { message: 'Unlike thành công' };
  }

  // Bookmark tương tự Like nhưng đơn giản hơn (chỉ tăng bookmarkCount video)
  async bookmarkVideo(userId: string, videoId: string) {
    // ... tương tự like, chỉ thay Like → Bookmark, likeCount → bookmarkCount
  }

  async removeBookmark(userId: string, videoId: string) {
    // ... tương tự unlike
  }

  async getUserBookmarks(userId: string, pagination: PaginationDto) {
    // Lấy danh sách video đã bookmark, sort mới nhất
    // Include video + author info
  }
}
```

---

## Bước 6.2: Comment Module + WebSocket Gateway

```bash
nest generate module comment
nest generate controller comment
nest generate service comment
nest generate gateway comment
# gateway = WebSocket Gateway
```

### Comment Service

```typescript
// src/comment/comment.service.ts
@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async createComment(
    userId: string,
    videoId: string,
    content: string,
    parentId?: string,
  ) {
    // 1. Rate Limiting (Redis)
    const rateLimitKey = `rate:comment:${userId}`;
    const count = await this.redis.incr(rateLimitKey);

    // Lần đầu tiên → set TTL 60 giây
    if (count === 1) {
      await this.redis.expire(rateLimitKey, 60);
    }

    // Quá 5 comments trong 1 phút → reject
    if (count > 5) {
      throw new HttpException(
        'Bạn comment quá nhanh, vui lòng đợi 1 phút',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Check video tồn tại + cho phép comment
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video) throw new NotFoundException('Video không tồn tại');
    if (!video.allowComments) {
      throw new ForbiddenException('Video này đã tắt comment');
    }

    // 3. Parse mentions (@username → userId)
    const mentionUsernames = this.parseMentions(content);
    let mentionUserIds: string[] = [];
    if (mentionUsernames.length > 0) {
      const mentionedUsers = await this.prisma.user.findMany({
        where: { username: { in: mentionUsernames } },
        select: { id: true },
      });
      mentionUserIds = mentionedUsers.map((u) => u.id);
    }

    // 4. Transaction: tạo comment + tăng commentCount
    const comment = await this.prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content,
          videoId,
          authorId: userId,
          parentId: parentId || null,
          mentions: mentionUserIds,
        },
        include: {
          author: {
            select: {
              id: true, username: true, displayName: true,
              avatarUrl: true, isVerified: true,
            },
          },
        },
      });

      await tx.video.update({
        where: { id: videoId },
        data: { commentCount: { increment: 1 } },
      });

      return newComment;
    });

    return comment;
    // Controller sẽ gọi CommentGateway.emitNewComment() sau khi nhận comment
  }

  // Parse @username từ content
  private parseMentions(content: string): string[] {
    const regex = /@([a-zA-Z0-9._]+)/g;
    const matches = content.matchAll(regex);
    return [...matches].map((m) => m[1]);
  }

  async getComments(videoId: string, pagination: PaginationDto) {
    const { cursor, limit = 20 } = pagination;

    // Chỉ lấy top-level comments (parentId = null)
    const comments = await this.prisma.comment.findMany({
      where: { videoId, parentId: null },
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
        _count: { select: { replies: true } },
        // Lấy 3 replies đầu tiên (preview)
        replies: {
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true, username: true, displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      data: comments,
      nextCursor: comments.length === limit
        ? comments[comments.length - 1].id
        : null,
    };
  }

  // Lấy tất cả replies của 1 comment
  async getReplies(commentId: string, pagination: PaginationDto) {
    // Tương tự getComments nhưng where: { parentId: commentId }
  }
}
```

### Comment WebSocket Gateway

```typescript
// src/comment/comment.gateway.ts
import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// WebSocket Gateway giải thích:
// HTTP = request-response (client hỏi → server trả lời)
// WebSocket = bi-directional (server có thể "đẩy" data xuống client bất kỳ lúc nào)
// Dùng cho comment realtime: User A comment → User B,C,D đang xem video tự nhận được

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  },
  // Namespace: /comments (tách biệt với các WebSocket khác nếu có)
  namespace: 'comments',
})
export class CommentGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommentGateway.name);

  // Client gọi: socket.emit('join_video_room', { videoId: 'abc' })
  // → Server thêm client vào room "video:abc"
  @SubscribeMessage('join_video_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { videoId: string },
  ) {
    const room = `video:${data.videoId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  // Client gọi: socket.emit('leave_video_room', { videoId: 'abc' })
  @SubscribeMessage('leave_video_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { videoId: string },
  ) {
    const room = `video:${data.videoId}`;
    client.leave(room);
  }

  // Method được gọi từ CommentController (KHÔNG phải từ client)
  // Khi comment mới được tạo → broadcast cho tất cả user đang xem video đó
  emitNewComment(videoId: string, comment: any) {
    this.server.to(`video:${videoId}`).emit('new_comment', comment);
  }

  emitDeletedComment(videoId: string, commentId: string) {
    this.server.to(`video:${videoId}`).emit('comment_deleted', { commentId });
  }
}
```

### Comment Controller — kết nối HTTP + WebSocket

```typescript
// src/comment/comment.controller.ts
@Controller()
export class CommentController {
  constructor(
    private commentService: CommentService,
    private commentGateway: CommentGateway, // Inject gateway
  ) {}

  // POST /api/videos/:videoId/comments
  @Post('videos/:videoId/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @CurrentUser('id') userId: string,
    @Param('videoId') videoId: string,
    @Body() dto: CreateCommentDto,
  ) {
    // 1. Lưu comment vào DB
    const comment = await this.commentService.createComment(
      userId, videoId, dto.content, dto.parentId,
    );

    // 2. Broadcast qua WebSocket cho mọi người đang xem video
    this.commentGateway.emitNewComment(videoId, comment);

    return comment;
  }

  // GET /api/videos/:videoId/comments
  @Get('videos/:videoId/comments')
  getComments(
    @Param('videoId') videoId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.commentService.getComments(videoId, pagination);
  }
}
```

---

## Bước 6.3: Notification Module (Cơ bản)

```bash
nest generate module notification
nest generate controller notification
nest generate service notification
```

**Logic:** Khi có event (like, comment, follow, mention), tạo Notification record.

```typescript
// src/notification/notification.service.ts — snippet
async createNotification(data: {
  type: NotificationType;
  senderId: string;
  receiverId: string;
  videoId?: string;
  commentId?: string;
}) {
  // Không gửi notification cho chính mình
  if (data.senderId === data.receiverId) return;

  const notification = await this.prisma.notification.create({
    data,
    include: {
      sender: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  // TODO: Emit qua WebSocket cho receiver (nếu đang online)
  return notification;
}
```

**Endpoints:**
- `GET /api/notifications` — Danh sách thông báo (cursor, cần auth)
- `PATCH /api/notifications/read` — Đánh dấu đã đọc

---

## Bước 6.4: Setup Redis Adapter cho Socket.io

Trong `comment.module.ts` hoặc `app.module.ts`, setup Redis Adapter:

```typescript
// src/comment/comment.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisService } from '../redis/redis.service';
import { CommentGateway } from './comment.gateway';

@Module({
  providers: [CommentService, CommentGateway],
  controllers: [CommentController],
})
export class CommentModule implements OnModuleInit {
  constructor(
    private commentGateway: CommentGateway,
    private redisService: RedisService,
  ) {}

  async onModuleInit() {
    // Setup Redis Adapter cho Socket.io
    // Tạo 2 Redis connections: 1 pub + 1 sub
    const pubClient = this.redisService.getClient();
    const subClient = pubClient.duplicate();

    const adapter = createAdapter(pubClient, subClient);
    this.commentGateway.server?.adapter(adapter);
  }
}
```

---

## Bước 6.5: Test Phase 6

```bash
# 1. Like video
curl -X POST http://localhost:3000/api/videos/<VIDEO_ID>/like \
  -H "Authorization: Bearer <TOKEN>"

# 2. Unlike
curl -X DELETE http://localhost:3000/api/videos/<VIDEO_ID>/like \
  -H "Authorization: Bearer <TOKEN>"

# 3. Create comment
curl -X POST http://localhost:3000/api/videos/<VIDEO_ID>/comments \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Video hay quá! @testuser"}'

# 4. Test WebSocket (dùng tool hoặc viết script)
# Mở 2 tab browser, cả 2 join room cùng video
# 1 tab gửi comment → tab kia phải nhận được realtime

# 5. Test rate limiting
# Gửi 6 comments liên tiếp trong 1 phút
# Comment thứ 6 phải bị reject: 429 Too Many Requests
```

### ✅ Output Phase 6:
```
✅ Like/Unlike + Transaction counter + Redis cache
✅ Bookmark/Remove bookmark
✅ Comment CRUD + nested replies
✅ Rate limiting: 5 comments/phút/user
✅ WebSocket Gateway: join room, realtime broadcast
✅ Redis Adapter cho Socket.io (scale ready)
✅ Notification cơ bản (DB + API)
✅ @mention parsing
```

---

## ⏭️ Tiếp theo: [Phase 7 — Frontend Next.js](./14-phase7-frontend.md)
