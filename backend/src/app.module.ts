import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { VideoModule } from './video/video.module';
import { TasksModule } from './tasks/tasks.module';
import { SoundModule } from './sound/sound.module';
import { HashtagModule } from './hashtag/hashtag.module';
import { InteractionModule } from './interaction/interaction.module';
import { CommentModule } from './comment/comment.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    // 1. ConfigModule must be loaded first — other modules depend on env vars.
    // If placed after a module that uses ConfigService, the app will crash.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Rate limiting: 100 requests per minute per IP
    // ttl: 60000ms = 1 minute
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // 3. Task scheduling (cron jobs, intervals, timeouts)
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    StorageModule,
    UserModule,
    AuthModule,
    VideoModule,
    TasksModule,
    SoundModule,
    HashtagModule,
    InteractionModule,
    CommentModule,
    MetricsModule,
  ],
})
export class AppModule {}
