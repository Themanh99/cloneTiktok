import { Injectable, NotFoundException } from '@nestjs/common';
import { VideoVisibility } from '@prisma/client';
import { MessageCode } from '../common/constants/message-codes';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SoundService {
  constructor(private readonly prisma: PrismaService) {}

  async getSoundById(id: string) {
    const sound = await this.prisma.sound.findUnique({
      where: { id },
      include: {
        uploader: {
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

    if (!sound) {
      throw new NotFoundException({
        message: 'Sound not found',
        messageCode: MessageCode.SOUND_NOT_FOUND,
      });
    }

    return sound;
  }

  async getSoundVideos(soundId: string, pagination: PaginationDto) {
    await this.getSoundById(soundId);

    const { cursor, limit = 10 } = pagination;
    const videos = await this.prisma.video.findMany({
      where: {
        soundId,
        visibility: VideoVisibility.PUBLIC,
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
      data: videos.map((video) => ({
        ...video,
        sizeBytes: video.sizeBytes.toString(),
      })),
      nextCursor: videos.length === limit ? videos[videos.length - 1].id : null,
    };
  }
}
