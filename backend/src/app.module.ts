import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';

@Module({
  imports: [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }), 
  
  // 2. Throttler Module
  // ttl: 60000ms = 1 phut
  // limit: 100 request per minute per IP / 1 phut

  ThrottlerModule.forRoot([
    {ttl: 60000, limit: 100},
  ]),

  // 3. Schedule Module

  ScheduleModule.forRoot(),
  UserModule
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
