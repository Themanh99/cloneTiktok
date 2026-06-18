import { Injectable, NotFoundException } from '@nestjs/common';
import { VideoVisibility } from '@prisma/client';
import { MessageCode } from '../common/constants/message-codes';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HashtagService {
  constructor(private readonly prisma: PrismaService) {}

  getTrending(limit = 20) {
    return this.prisma.hashtag.findMany({
      take: limit,
      orderBy: [{ useCount: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        useCount: true,
      },
    });
  }

  async getHashtagVideos(name: string, pagination: PaginationDto) {
    const normalizedName = this.normalizeName(name);
    const hashtag = await this.prisma.hashtag.findUnique({
      where: { name: normalizedName },
      select: { id: true, name: true, useCount: true },
    });

    if (!hashtag) {
      throw new NotFoundException({
        message: 'Hashtag not found',
        messageCode: MessageCode.HASHTAG_NOT_FOUND,
      });
    }

    const { cursor, limit = 10 } = pagination;
    const videos = await this.prisma.video.findMany({
      where: {
        visibility: VideoVisibility.PUBLIC,
        hashtags: {
          some: { hashtagId: hashtag.id },
        },
      },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
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
      },
    });

    return {
      hashtag,
      data: videos.map((video) => ({
        ...video,
        sizeBytes: video.sizeBytes.toString(),
      })),
      nextCursor: videos.length === limit ? videos[videos.length - 1].id : null,
    };
  }

  private normalizeName(name: string) {
    return name.replace(/^#/, '').toLowerCase();
  }
}
