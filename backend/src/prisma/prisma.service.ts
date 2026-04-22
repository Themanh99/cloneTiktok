import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient // Kế thừa tất cả methods: findMany, create, update...
  implements OnModuleInit, OnModuleDestroy
{
  // OnModuleInit: Tự động kết nối DB khi NestJS khởi động
  async onModuleInit() {
    await this.$connect();
  }

  // OnModuleDestroy: Ngắt kết nối khi NestJS shutdown
  // Quan trọng cho graceful shutdown — tránh connection leak
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// Cách sử dụng trong Service khác:
// constructor(private prisma: PrismaService) {}
// const users = await this.prisma.user.findMany();
