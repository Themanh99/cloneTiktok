import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { MessageCode } from '../common/constants/message-codes';

@Injectable()
export class InteractionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async likeVideo(userId: string, videoId: string) {
    const video = await this.requireVideo(videoId);
    const existing = await this.prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (existing) {
      throw new ConflictException({
        message: 'Video is already liked',
        messageCode: MessageCode.VIDEO_ALREADY_LIKED,
      });
    }

    await this.prisma.$transaction([
      this.prisma.like.create({ data: { userId, videoId } }),
      this.prisma.video.update({
        where: { id: videoId },
        data: { likeCount: { increment: 1 } },
      }),
      this.prisma.user.update({
        where: { id: video.authorId },
        data: { totalLikes: { increment: 1 } },
      }),
    ]);
    await this.redis.set(`like:${userId}:${videoId}`, '1', 3600);
    return { messageCode: MessageCode.VIDEO_LIKED };
  }

  async unlikeVideo(userId: string, videoId: string) {
    const video = await this.requireVideo(videoId);
    const existing = await this.prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'Video is not liked',
        messageCode: MessageCode.VIDEO_NOT_LIKED,
      });
    }

    await this.prisma.$transaction([
      this.prisma.like.delete({ where: { userId_videoId: { userId, videoId } } }),
      this.prisma.video.update({
        where: { id: videoId },
        data: { likeCount: { decrement: 1 } },
      }),
      this.prisma.user.update({
        where: { id: video.authorId },
        data: { totalLikes: { decrement: 1 } },
      }),
    ]);
    await this.redis.del(`like:${userId}:${videoId}`);
    return { messageCode: MessageCode.VIDEO_UNLIKED };
  }

  async bookmarkVideo(userId: string, videoId: string) {
    await this.requireVideo(videoId);
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (existing) {
      throw new ConflictException({
        message: 'Video is already bookmarked',
        messageCode: MessageCode.VIDEO_ALREADY_BOOKMARKED,
      });
    }

    await this.prisma.$transaction([
      this.prisma.bookmark.create({ data: { userId, videoId } }),
      this.prisma.video.update({
        where: { id: videoId },
        data: { bookmarkCount: { increment: 1 } },
      }),
    ]);
    return { messageCode: MessageCode.VIDEO_BOOKMARKED };
  }

  async removeBookmark(userId: string, videoId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (!existing) {
      throw new NotFoundException({
        message: 'Video is not bookmarked',
        messageCode: MessageCode.VIDEO_NOT_BOOKMARKED,
      });
    }

    await this.prisma.$transaction([
      this.prisma.bookmark.delete({ where: { userId_videoId: { userId, videoId } } }),
      this.prisma.video.update({
        where: { id: videoId },
        data: { bookmarkCount: { decrement: 1 } },
      }),
    ]);
    return { messageCode: MessageCode.VIDEO_BOOKMARK_REMOVED };
  }

  async getBookmarks(userId: string, pagination: PaginationDto) {
    const { cursor, limit = 10 } = pagination;
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      take: limit,
      ...(cursor
        ? {
            skip: 1,
            cursor: { userId_videoId: { userId, videoId: cursor } },
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        video: {
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
            sound: true,
            hashtags: { include: { hashtag: true } },
            _count: { select: { comments: true } },
          },
        },
      },
    });

    return {
      data: bookmarks.map(({ video }) => ({
        ...video,
        sizeBytes: video.sizeBytes.toString(),
        hashtags: video.hashtags.map((item) => item.hashtag),
        commentCount: video.commentCount || video._count.comments,
        isLiked: false,
        isBookmarked: true,
      })),
      nextCursor: bookmarks.length === limit ? bookmarks[bookmarks.length - 1].videoId : null,
    };
  }

  private async requireVideo(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, authorId: true },
    });
    if (!video) {
      throw new NotFoundException({
        message: 'Video not found',
        messageCode: MessageCode.VIDEO_NOT_FOUND,
      });
    }
    return video;
  }
}
