import { Module } from '@nestjs/common';
import { SoundController } from './sound.controller';
import { SoundService } from './sound.service';

@Module({
  controllers: [SoundController],
  providers: [SoundService],
})
export class SoundModule {}
