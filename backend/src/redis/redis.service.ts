import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.client = new Redis(redisUrl);

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      this.logger.error('❌ Redis error:', err.message);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // === Wrapper methods ===
  // Why wrap instead of exposing the client directly?
  // 1. Easier to test (mock RedisService instead of mocking the Redis client)
  // 2. Easier to swap implementations (switch from ioredis to redis — only edit this file)
  // 3. Simple to add logging/metrics later

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  // Scan pattern — used for batch view count updates
  // SCAN instead of KEYS because KEYS blocks Redis when the dataset is large
  async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, foundKeys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');
    return keys;
  }

  // Expose raw client for Socket.io Adapter
  getClient(): Redis {
    return this.client;
  }
}
