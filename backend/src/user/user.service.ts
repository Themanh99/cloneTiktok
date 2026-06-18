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

  async getPublicProfile(targetUserIdOrUsername: string, currentUserId?: string) {
    let user = await this.prisma.user.findUnique({
      where: { id: targetUserIdOrUsername },
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
      user = await this.prisma.user.findUnique({
        where: { username: targetUserIdOrUsername },
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
    }

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
            followingId: user.id,
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

  async resolveUserId(idOrUsername: string): Promise<string> {
    // Check UUID pattern first to avoid database errors if possible, or just query.
    // In PostgreSQL, querying UUID column with non-UUID string throws error.
    // So let's validate if idOrUsername is a valid UUID, otherwise query by username.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrUsername);
    if (isUuid) {
      const user = await this.prisma.user.findUnique({
        where: { id: idOrUsername },
        select: { id: true },
      });
      if (user) return user.id;
    }

    const user = await this.prisma.user.findUnique({
      where: { username: idOrUsername },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        messageCode: MessageCode.USER_NOT_FOUND,
      });
    }

    return user.id;
  }

  // ==================== FOLLOWERS / FOLLOWING LIST ====================

  async getFollowers(userIdOrUsername: string, pagination: PaginationDto) {
    const userId = await this.resolveUserId(userIdOrUsername);
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

  async getFollowing(userIdOrUsername: string, pagination: PaginationDto) {
    const userId = await this.resolveUserId(userIdOrUsername);
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


  // ==================== USER VIDEOS ====================
  async getUserVideos(
    userIdOrUsername: string,
    pagination: PaginationDto,
    currentUserId?: string,
    visibility?: string,
  ) {
    const userId = await this.resolveUserId(userIdOrUsername);

    // Check if the current user is the owner of the videos
    const isOwner = currentUserId === userId;

    // Determine target visibility filter
    let visibilityFilter: any = 'PUBLIC';
    if (isOwner && visibility) {
      if (['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'].includes(visibility)) {
        visibilityFilter = visibility;
      } else if (visibility === 'ALL') {
        visibilityFilter = { in: ['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'] };
      }
    }

    const { cursor, limit = 10 } = pagination;
    const videos = await this.prisma.video.findMany({
      where: {
        authorId: userId,
        visibility: visibilityFilter,
      },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      include: {
        sound: {
          select: {
            id: true,
            name: true,
            audioUrl: true,
            coverUrl: true,
          },
        },
        hashtags: {
          include: {
            hashtag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      data: videos.map((video) => ({
        ...video,
        sizeBytes: video.sizeBytes.toString(),
        hashtags: video.hashtags.map((item) => item.hashtag),
      })),
      nextCursor: videos.length === limit ? videos[videos.length - 1].id : null,
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
