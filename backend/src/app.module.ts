import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';

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
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
