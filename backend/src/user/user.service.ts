import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { MessageCode } from '../common/constants/message-codes';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
        status: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        messageCode: MessageCode.USER_NOT_FOUND,
      });
    }

    return user;
  }

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

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        messageCode: MessageCode.USER_NOT_FOUND,
      });
    }

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
    // 1. Cannot follow yourself
    if (followerId === followingId) {
      throw new ForbiddenException({
        message: 'Cannot follow yourself',
        messageCode: MessageCode.USER_CANNOT_FOLLOW_SELF,
      });
    }

    // 2. Check that target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });
    if (!targetUser) {
      throw new NotFoundException({
        message: 'User not found',
        messageCode: MessageCode.USER_NOT_FOUND,
      });
    }

    // 3. Check if already following
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    if (existing) {
      throw new ConflictException({
        message: 'You already followed this user',
        messageCode: MessageCode.USER_ALREADY_FOLLOWED,
      });
    }

    // 4. Transaction: create follow + update both counters atomically
    // Why Transaction?
    // If creating the follow record succeeds but updating the counter fails
    // → data becomes inconsistent (follow record exists but counter is wrong).
    // Transaction ensures: ALL succeed or ALL rollback.
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

    return { messageCode: MessageCode.USER_FOLLOWED };
  }

  async unfollow(followerId: string, followingId: string) {
    // Check that follow relationship exists
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'You did not follow this user',
        messageCode: MessageCode.USER_NOT_FOLLOWED,
      });
    }

    // Transaction: delete follow + decrement both counters
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

    return { messageCode: MessageCode.USER_UNFOLLOWED };
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
      nextCursor: follows.length === limit ? follows[follows.length - 1].followerId : null,
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
      nextCursor: follows.length === limit ? follows[follows.length - 1].followingId : null,
    };
  }

  // ==================== SEARCH ====================
  async searchUsers(query: string, pagination: PaginationDto) {
    const { cursor, limit = 10 } = pagination;

    const users = await this.prisma.user.findMany({
      where: {
        OR: [{ username: { contains: query, mode: 'insensitive' } }, { displayName: { contains: query, mode: 'insensitive' } }],
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
      nextCursor: users.length === limit ? users[users.length - 1].id : null,
    };
  }
}
