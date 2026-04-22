import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global(): Module này chỉ cần import 1 lần ở AppModule
// Tất cả module khác tự động dùng được PrismaService
// Không cần import PrismaModule ở AuthModule, UserModule, VideoModule...
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export để module khác inject được
})
export class PrismaModule {}
