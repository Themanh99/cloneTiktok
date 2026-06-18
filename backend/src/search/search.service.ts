import { Injectable } from '@nestjs/common';
import { VideoVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search({ q, limit }: SearchQueryDto) {
    const query = q.trim().replace(/^#/, '');
    const [users, videos] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { followerCount: 'desc' },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
          followerCount: true,
        },
      }),
      this.prisma.video.findMany({
        where: {
          visibility: VideoVisibility.PUBLIC,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            {
              hashtags: {
                some: {
                  hashtag: {
                    name: { contains: query, mode: 'insensitive' },
                  },
                },
              },
            },
            {
              author: {
                OR: [
                  { username: { contains: query, mode: 'insensitive' } },
                  { displayName: { contains: query, mode: 'insensitive' } },
                ],
              },
            },
          ],
        },
        take: limit,
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          originalUrl: true,
          coverUrl: true,
          thumbnailUrl: true,
          viewCount: true,
          likeCount: true,
          createdAt: true,
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
      }),
    ]);

    const suggestions = [
      ...users.map((user) => ({
        type: 'user' as const,
        value: user.username,
        label: user.displayName,
      })),
      ...videos
        .filter((video) => video.title)
        .map((video) => ({
          type: 'video' as const,
          value: video.title!,
          label: `@${video.author.username}`,
        })),
    ].slice(0, limit);

    return { query, suggestions, users, videos };
  }
}
