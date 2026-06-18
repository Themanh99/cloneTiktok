import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async batchUpdateViewCounts() {
    const keys = await this.redis.scanKeys('video:*:views');
    if (keys.length === 0) {
      return;
    }

    for (const key of keys) {
      const count = await this.redis.get(key);
      const incrementBy = Number(count || 0);

      if (!Number.isInteger(incrementBy) || incrementBy <= 0) {
        await this.redis.del(key);
        continue;
      }

      const videoId = key.replace(/^video:/, '').replace(/:views$/, '');

      try {
        await this.prisma.video.update({
          where: { id: videoId },
          data: { viewCount: { increment: incrementBy } },
        });
        await this.redis.del(key);
      } catch (error) {
        this.logger.warn(`Failed to sync view count for video ${videoId}: ${this.getErrorMessage(error)}`);
      }
    }

    this.logger.log(`Synced pending view counts for ${keys.length} video keys`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
