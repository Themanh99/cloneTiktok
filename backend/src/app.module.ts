import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // 1. Config Module cần đặt ở đầu để load trước , nếu đặt sau có thằng nào dùng sẽ bị crash
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Throttler Module
    // ttl: 60000ms = 1 phut
    // limit: 100 request per minute per IP / 1 phut

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // 3. Schedule Module

    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    UserModule,
  ],
})
export class AppModule {}
