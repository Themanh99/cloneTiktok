import { Controller, Get, Param, Query } from '@nestjs/common';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { SoundService } from './sound.service';

@Controller('sounds')
export class SoundController {
  constructor(private readonly soundService: SoundService) {}

  @Get(':id')
  getSoundById(@Param('id') id: string) {
    return this.soundService.getSoundById(id);
  }

  @Get(':id/videos')
  getSoundVideos(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.soundService.getSoundVideos(id, pagination);
  }
}
