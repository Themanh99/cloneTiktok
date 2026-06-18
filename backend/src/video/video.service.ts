import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VideoVisibility } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { MessageCode } from '../common/constants/message-codes';
import { CreateVideoDto } from './dto/create-video.dto';

const videoInclude = {
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
  _count: {
    select: {
      comments: true,
    },
  },
} satisfies Prisma.VideoInclude;

type VideoWithRelations = Prisma.VideoGetPayload<{ include: typeof videoInclude }>;

@Injectable()
export class VideoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}

  async getPresignedUrl(userId: string, contentType = 'video/mp4') {
    const extension = this.getExtensionFromContentType(contentType);
    const fileKey = `videos/${userId}/${Date.now()}-${randomUUID()}.${extension}`;

    return this.storage.generatePresignedUploadUrl(fileKey, contentType);
  }

  async createVideo(userId: string, dto: CreateVideoDto) {
    if (dto.soundId) {
      const sound = await this.prisma.sound.findUnique({
        where: { id: dto.soundId },
        select: { id: true },
      });

      if (!sound) {
        throw new NotFoundException({
          message: 'Sound not found',
          messageCode: MessageCode.SOUND_NOT_FOUND,
        });
      }
    }

    const videoUrl = this.storage.getPublicUrl(dto.fileKey);
    const hashtags = this.extractHashtags(dto.title);

    const video = await this.prisma.$transaction(async (tx) => {
      const createdVideo = await tx.video.create({
        data: {
          title: dto.title,
          originalUrl: videoUrl,
          hlsUrl: dto.hlsUrl,
          thumbnailUrl: dto.thumbnailUrl,
          coverUrl: dto.coverUrl,
          duration: dto.duration,
          width: dto.width,
          height: dto.height,
          sizeBytes: BigInt(Math.trunc(dto.sizeBytes)),
          visibility: dto.visibility || VideoVisibility.PUBLIC,
          allowComments: dto.allowComments ?? true,
          allowDuet: dto.allowDuet ?? true,
          allowDownload: dto.allowDownload ?? true,
          authorId: userId,
          soundId: dto.soundId || null,
        },
        include: videoInclude,
      });

      for (const tagName of hashtags) {
        const hashtag = await tx.hashtag.upsert({
          where: { name: tagName },
          create: { name: tagName, useCount: 1 },
          update: { useCount: { increment: 1 } },
        });

        await tx.videoHashtag.create({
          data: { videoId: createdVideo.id, hashtagId: hashtag.id },
        });
      }

      if (dto.soundId) {
        await tx.sound.update({
          where: { id: dto.soundId },
          data: { useCount: { increment: 1 } },
        });
      }

      return createdVideo;
    });

    return this.toVideoResponse(video);
  }

  async getFeedForYou(pagination: PaginationDto, userId?: string) {
    const { cursor, limit = 10 } = pagination;
    const videos = await this.prisma.video.findMany({
      where: { visibility: VideoVisibility.PUBLIC },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: 'desc' }],
      include: videoInclude,
    });

    return this.toPaginatedVideoResponse(videos, limit, userId);
  }

  async getFeedFollowing(userId: string, pagination: PaginationDto) {
    const { cursor, limit = 10 } = pagination;
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((item) => item.followingId);
    if (followingIds.length === 0) {
      return { data: [], nextCursor: null };
    }

    const videos = await this.prisma.video.findMany({
      where: {
        authorId: { in: followingIds },
        visibility: VideoVisibility.PUBLIC,
      },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: videoInclude,
    });

    return this.toPaginatedVideoResponse(videos, limit, userId);
  }

  async getVideoById(videoId: string, userId?: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: videoInclude,
    });

    if (!video) {
      throw new NotFoundException({
        message: 'Video not found',
        messageCode: MessageCode.VIDEO_NOT_FOUND,
      });
    }

    if (video.visibility === VideoVisibility.PRIVATE && video.authorId !== userId) {
      throw new ForbiddenException({
        message: 'You cannot view this video',
        messageCode: MessageCode.VIDEO_FORBIDDEN,
      });
    }

    const [response] = await this.attachViewerState([video], userId);
    return response;
  }

  async recordView(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true },
    });

    if (!video) {
      throw new NotFoundException({
        message: 'Video not found',
        messageCode: MessageCode.VIDEO_NOT_FOUND,
      });
    }

    await this.redis.incr(`video:${videoId}:views`);

    return { messageCode: MessageCode.VIDEO_VIEW_RECORDED };
  }

  async deleteVideo(userId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        authorId: true,
        soundId: true,
        hashtags: { select: { hashtagId: true } },
      },
    });

    if (!video) {
      throw new NotFoundException({
        message: 'Video not found',
        messageCode: MessageCode.VIDEO_NOT_FOUND,
      });
    }

    if (video.authorId !== userId) {
      throw new ForbiddenException({
        message: 'Only the owner can delete this video',
        messageCode: MessageCode.VIDEO_FORBIDDEN,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.video.delete({ where: { id: videoId } });

      if (video.soundId) {
        await tx.sound.update({
          where: { id: video.soundId },
          data: { useCount: { decrement: 1 } },
        });
      }

      for (const item of video.hashtags) {
        await tx.hashtag.update({
          where: { id: item.hashtagId },
          data: { useCount: { decrement: 1 } },
        });
      }
    });

    await this.redis.del(`video:${videoId}:views`);

    return { messageCode: MessageCode.VIDEO_DELETED };
  }

  private async toPaginatedVideoResponse(videos: VideoWithRelations[], limit: number, userId?: string) {
    const data = await this.attachViewerState(videos, userId);

    return {
      data,
      nextCursor: videos.length === limit ? videos[videos.length - 1].id : null,
    };
  }

  private async attachViewerState(videos: VideoWithRelations[], userId?: string) {
    const videoResponses = videos.map((video) => this.toVideoResponse(video));

    if (!userId || videos.length === 0) {
      return videoResponses.map((video) => ({
        ...video,
        isLiked: false,
        isBookmarked: false,
        isFollowing: false,
      }));
    }

    const videoIds = videos.map((video) => video.id);
    const authorIds = [...new Set(videos.map((video) => video.authorId))];
    const [likes, bookmarks, follows] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId, videoId: { in: videoIds } },
        select: { videoId: true },
      }),
      this.prisma.bookmark.findMany({
        where: { userId, videoId: { in: videoIds } },
        select: { videoId: true },
      }),
      this.prisma.follow.findMany({
        where: { followerId: userId, followingId: { in: authorIds } },
        select: { followingId: true },
      }),
    ]);

    const likedSet = new Set(likes.map((like) => like.videoId));
    const bookmarkedSet = new Set(bookmarks.map((bookmark) => bookmark.videoId));
    const followedSet = new Set(follows.map((follow) => follow.followingId));

    return videoResponses.map((video) => ({
      ...video,
      isLiked: likedSet.has(video.id),
      isBookmarked: bookmarkedSet.has(video.id),
      isFollowing: followedSet.has(video.authorId),
    }));
  }

  private toVideoResponse(video: VideoWithRelations) {
    return {
      ...video,
      sizeBytes: video.sizeBytes.toString(),
      hashtags: video.hashtags.map((item) => item.hashtag),
      commentCount: video.commentCount || video._count.comments,
    };
  }

  private extractHashtags(title?: string): string[] {
    if (!title) {
      return [];
    }

    const matches = title.match(/#[\p{L}\p{N}_]+/gu) || [];
    return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
  }

  private getExtensionFromContentType(contentType: string): string {
    if (contentType === 'video/webm') {
      return 'webm';
    }

    if (contentType === 'video/quicktime') {
      return 'mov';
    }

    return 'mp4';
  }
}
