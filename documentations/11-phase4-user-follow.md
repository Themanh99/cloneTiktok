# 👤 Phase 4: User & Follow Module (Chi tiết từng bước)

> **Thời gian ước tính:** 3 ngày
> **Mục tiêu:** Profile CRUD, Avatar, Follow/Unfollow với counter đồng bộ, Search
> **Điều kiện:** Phase 3 hoàn thành, Auth + JWT Guard hoạt động

---

## Bước 4.1: Tạo User Module (NestJS CLI)

```bash
nest generate module user
nest generate controller user
nest generate service user
```

---

## Bước 4.2: DTOs

### File `src/user/dto/update-profile.dto.ts`

```typescript
import {
  IsOptional, IsString, MaxLength, IsInt, Min, Max, IsDateString,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
  // Client upload avatar lên Cloudinary/S3 trước
  // Rồi gửi URL string xuống đây
  // Backend KHÔNG nhận file avatar trực tiếp

  @IsOptional()
  @IsDateString()
  dob?: string; // ISO date string: "2000-01-15"

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  gender?: number; // 0: Khác, 1: Nam, 2: Nữ
}
```

---

## Bước 4.3: User Service

### File `src/user/user.service.ts`

```typescript
import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // ==================== GET PROFILE ====================

  // Lấy profile của chính mình (có thêm email, settings)
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        dob: true,
        gender: true,
        isVerified: true,
        followerCount: true,
        followingCount: true,
        totalLikes: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User không tồn tại');
    return user;
  }

  // Lấy profile public (bất kỳ ai, kèm check đã follow chưa)
  async getPublicProfile(targetUserId: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        followerCount: true,
        followingCount: true,
        totalLikes: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User không tồn tại');

    // Check xem currentUser đã follow targetUser chưa
    let isFollowing = false;
    if (currentUserId) {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });
      isFollowing = !!follow;
    }

    return { ...user, isFollowing };
  }

  // ==================== UPDATE PROFILE ====================
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        dob: dto.dob ? new Date(dto.dob) : undefined,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        dob: true,
        gender: true,
      },
    });
  }

  // ==================== FOLLOW / UNFOLLOW ====================

  async follow(followerId: string, followingId: string) {
    // 1. Không thể follow chính mình
    if (followerId === followingId) {
      throw new ForbiddenException('Không thể follow chính mình');
    }

    // 2. Check target user tồn tại
    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });
    if (!targetUser) throw new NotFoundException('User không tồn tại');

    // 3. Check đã follow chưa
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    if (existing) throw new ConflictException('Đã follow user này rồi');

    // 4. Transaction: Tạo follow + cập nhật 2 counters CÙNG LÚC
    // Tại sao Transaction?
    // Nếu tạo follow thành công nhưng update counter thất bại
    // → Data inconsistent (có follow record nhưng counter sai)
    // Transaction đảm bảo: TẤT CẢ thành công hoặc TẤT CẢ rollback
    await this.prisma.$transaction([
      this.prisma.follow.create({
        data: { followerId, followingId },
      }),
      this.prisma.user.update({
        where: { id: followingId },
        data: { followerCount: { increment: 1 } },
      }),
      this.prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      }),
    ]);

    return { message: 'Follow thành công' };
  }

  async unfollow(followerId: string, followingId: string) {
    // Check tồn tại
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    if (!existing) throw new NotFoundException('Chưa follow user này');

    // Transaction: Xóa follow + giảm 2 counters
    await this.prisma.$transaction([
      this.prisma.follow.delete({
        where: {
          followerId_followingId: { followerId, followingId },
        },
      }),
      this.prisma.user.update({
        where: { id: followingId },
        data: { followerCount: { decrement: 1 } },
      }),
      this.prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      }),
    ]);

    return { message: 'Unfollow thành công' };
  }

  // ==================== FOLLOWERS / FOLLOWING LIST ====================

  async getFollowers(userId: string, pagination: PaginationDto) {
    const { cursor, limit = 10 } = pagination;

    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          followerId_followingId: {
            followerId: cursor,
            followingId: userId,
          },
        },
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    return {
      data: follows.map((f) => f.follower),
      nextCursor: follows.length === limit
        ? follows[follows.length - 1].followerId
        : null,
    };
  }

  async getFollowing(userId: string, pagination: PaginationDto) {
    const { cursor, limit = 10 } = pagination;

    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          followerId_followingId: {
            followerId: userId,
            followingId: cursor,
          },
        },
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    return {
      data: follows.map((f) => f.following),
      nextCursor: follows.length === limit
        ? follows[follows.length - 1].followingId
        : null,
    };
  }

  // ==================== SEARCH ====================
  async searchUsers(query: string, pagination: PaginationDto) {
    const { cursor, limit = 10 } = pagination;

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
        status: 'ACTIVE',
      },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { followerCount: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        followerCount: true,
      },
    });

    return {
      data: users,
      nextCursor: users.length === limit
        ? users[users.length - 1].id
        : null,
    };
  }
}
```

---

## Bước 4.4: User Controller

### File `src/user/user.controller.ts`

```typescript
import {
  Controller, Get, Patch, Post, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  // GET /api/users/me — Profile chính mình (cần đăng nhập)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.userService.getMyProfile(userId);
  }

  // PATCH /api/users/me — Cập nhật profile
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  // GET /api/users/search?q=keyword
  @Get('search')
  searchUsers(@Query('q') query: string, @Query() pagination: PaginationDto) {
    return this.userService.searchUsers(query || '', pagination);
  }

  // GET /api/users/:id — Profile public
  @Get(':id')
  getPublicProfile(
    @Param('id') targetUserId: string,
    @CurrentUser('id') currentUserId?: string,
    // currentUserId sẽ undefined nếu chưa đăng nhập
    // Cần tạo optional auth guard cho case này
  ) {
    return this.userService.getPublicProfile(targetUserId, currentUserId);
  }

  // POST /api/users/:id/follow
  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  follow(
    @CurrentUser('id') followerId: string,
    @Param('id') followingId: string,
  ) {
    return this.userService.follow(followerId, followingId);
  }

  // DELETE /api/users/:id/follow
  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(
    @CurrentUser('id') followerId: string,
    @Param('id') followingId: string,
  ) {
    return this.userService.unfollow(followerId, followingId);
  }

  // GET /api/users/:id/followers
  @Get(':id/followers')
  getFollowers(@Param('id') userId: string, @Query() pagination: PaginationDto) {
    return this.userService.getFollowers(userId, pagination);
  }

  // GET /api/users/:id/following
  @Get(':id/following')
  getFollowing(@Param('id') userId: string, @Query() pagination: PaginationDto) {
    return this.userService.getFollowing(userId, pagination);
  }
}
```

---

## Bước 4.5: Test Phase 4

```bash
# 1. Register 2 users để test follow
# User A
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@test.com","password":"Test1234","username":"usera","displayName":"User A"}'
# Lưu accessToken của User A

# User B
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"b@test.com","password":"Test1234","username":"userb","displayName":"User B"}'
# Lưu id của User B

# 2. User A follow User B
curl -X POST http://localhost:3000/api/users/<USER_B_ID>/follow \
  -H "Authorization: Bearer <USER_A_TOKEN>"

# 3. Kiểm tra counters
curl http://localhost:3000/api/users/<USER_B_ID>
# → followerCount: 1

curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <USER_A_TOKEN>"
# → followingCount: 1

# 4. Unfollow
curl -X DELETE http://localhost:3000/api/users/<USER_B_ID>/follow \
  -H "Authorization: Bearer <USER_A_TOKEN>"
# → counters về 0
```

### ✅ Output Phase 4:
```
✅ GET /api/users/me — Profile chính mình
✅ GET /api/users/:id — Profile public + isFollowing flag
✅ PATCH /api/users/me — Update profile
✅ POST /api/users/:id/follow — Follow + Transaction counter
✅ DELETE /api/users/:id/follow — Unfollow + Transaction counter
✅ GET /api/users/:id/followers — Danh sách followers (cursor)
✅ GET /api/users/:id/following — Danh sách following (cursor)
✅ GET /api/users/search?q= — Tìm kiếm user
```

---

## ⏭️ Tiếp theo: [Phase 5 — Video, Feed & Sound](./12-phase5-video-feed.md)
