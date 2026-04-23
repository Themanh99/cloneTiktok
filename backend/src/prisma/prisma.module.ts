import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global(): This module only needs to be imported once in AppModule.
// All other modules can automatically use PrismaService.
// No need to import PrismaModule in AuthModule, UserModule, VideoModule, etc.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export so other modules can inject it
})
export class PrismaModule {}
