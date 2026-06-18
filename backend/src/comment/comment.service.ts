import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageCode } from '../common/constants/message-codes';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Prisma } from '@prisma/client';

const commentInclude = {
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isVerified: true,
    },
  },
  _count: { select: { replies: true } },
} as const;

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async createComment(userId: string, videoId: string, dto: CreateCommentDto) {
    await this.enforceRateLimit(userId);
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, allowComments: true },
    });
    if (!video) {
      throw new NotFoundException({
        message: 'Video not found',
        messageCode: MessageCode.VIDEO_NOT_FOUND,
      });
    }
    if (!video.allowComments) {
      throw new ForbiddenException({
        message: 'Comments are disabled for this video',
        messageCode: MessageCode.COMMENT_DISABLED,
      });
    }

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { videoId: true },
      });
      if (!parent || parent.videoId !== videoId) {
        throw new NotFoundException({
          message: 'Parent comment not found',
          messageCode: MessageCode.COMMENT_NOT_FOUND,
        });
      }
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          content: dto.content.trim(),
          videoId,
          authorId: userId,
          parentId: dto.parentId,
          mentions: dto.mentions || [],
        },
        include: commentInclude,
      });
      await tx.video.update({
        where: { id: videoId },
        data: { commentCount: { increment: 1 } },
      });
      return created;
    });

    return {
      ...comment,
      replyCount: comment._count.replies,
      replies: [],
      messageCode: MessageCode.COMMENT_CREATED,
    };
  }

  getComments(videoId: string, pagination: PaginationDto) {
    return this.findComments({ videoId, parentId: null }, pagination);
  }

  async getReplies(commentId: string, pagination: PaginationDto) {
    const parent = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });
    if (!parent) {
      throw new NotFoundException({
        message: 'Comment not found',
        messageCode: MessageCode.COMMENT_NOT_FOUND,
      });
    }
    const maxItems = Math.min(pagination.limit || 50, 100);
    const collected: Prisma.CommentGetPayload<{ include: typeof commentInclude }>[] = [];
    let parentIds = [commentId];

    while (parentIds.length > 0 && collected.length < maxItems) {
      const level = await this.prisma.comment.findMany({
        where: { parentId: { in: parentIds } },
        orderBy: { createdAt: 'asc' },
        include: commentInclude,
      });
      if (level.length === 0) break;
      collected.push(...level);
      parentIds = level.map((comment) => comment.id);
    }

    const nodes = new Map<
      string,
      Prisma.CommentGetPayload<{ include: typeof commentInclude }> & {
        replyCount: number;
        replies: unknown[];
      }
    >();

    for (const comment of collected.slice(0, maxItems)) {
      nodes.set(comment.id, {
        ...comment,
        replyCount: comment._count.replies,
        replies: [],
      });
    }

    const roots: Array<(typeof nodes extends Map<string, infer T> ? T : never)> = [];
    for (const node of nodes.values()) {
      if (node.parentId === commentId) {
        roots.push(node);
        continue;
      }
      const parentNode = node.parentId ? nodes.get(node.parentId) : undefined;
      if (parentNode) parentNode.replies.push(node);
    }

    return { data: roots, nextCursor: null };
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, videoId: true },
    });
    if (!comment) {
      throw new NotFoundException({
        message: 'Comment not found',
        messageCode: MessageCode.COMMENT_NOT_FOUND,
      });
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException({
        message: 'Only the author can delete this comment',
        messageCode: MessageCode.COMMENT_FORBIDDEN,
      });
    }

    const deletedCount = await this.countCommentTree(commentId);
    await this.prisma.$transaction([
      this.prisma.comment.delete({ where: { id: commentId } }),
      this.prisma.video.update({
        where: { id: comment.videoId },
        data: { commentCount: { decrement: deletedCount } },
      }),
    ]);
    return {
      videoId: comment.videoId,
      messageCode: MessageCode.COMMENT_DELETED,
    };
  }

  private async findComments(
    where: { videoId?: string; parentId: string | null },
    pagination: PaginationDto,
  ) {
    const { cursor, limit = 20 } = pagination;
    const comments = await this.prisma.comment.findMany({
      where,
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: commentInclude,
    });
    return {
      data: comments.map((comment) => ({
        ...comment,
        replyCount: comment._count.replies,
        replies: [],
      })),
      nextCursor: comments.length === limit ? comments[comments.length - 1].id : null,
    };
  }

  private async countCommentTree(commentId: string) {
    let count = 1;
    let parentIds = [commentId];

    while (parentIds.length > 0) {
      const children = await this.prisma.comment.findMany({
        where: { parentId: { in: parentIds } },
        select: { id: true },
      });
      count += children.length;
      parentIds = children.map((child) => child.id);
    }

    return count;
  }

  private async enforceRateLimit(userId: string) {
    const key = `rate:comment:${userId}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(
        key,
        this.config.get<number>('COMMENT_RATE_WINDOW_SECONDS') || 60,
      );
    }
    if (count > (this.config.get<number>('COMMENT_RATE_LIMIT') || 5)) {
      throw new HttpException(
        {
          message: 'You are commenting too quickly',
          messageCode: MessageCode.COMMENT_RATE_LIMITED,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
