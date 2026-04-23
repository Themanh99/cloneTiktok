import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient // Inherits all Prisma methods: findMany, create, update...
  implements OnModuleInit, OnModuleDestroy
{
  // OnModuleInit: Automatically connects to the database when NestJS starts
  async onModuleInit() {
    await this.$connect();
  }

  // OnModuleDestroy: Disconnects when NestJS shuts down
  // Important for graceful shutdown — prevents connection leaks
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// Usage in other services:
// constructor(private prisma: PrismaService) {}
// const users = await this.prisma.user.findMany();
