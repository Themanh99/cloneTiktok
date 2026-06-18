import { Controller, Get, Param, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { HashtagService } from './hashtag.service';

class TrendingHashtagsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

@Controller('hashtags')
export class HashtagController {
  constructor(private readonly hashtagService: HashtagService) {}

  @Get('trending')
  getTrending(@Query() query: TrendingHashtagsQueryDto) {
    return this.hashtagService.getTrending(query.limit);
  }

  @Get(':name/videos')
  getHashtagVideos(@Param('name') name: string, @Query() pagination: PaginationDto) {
    return this.hashtagService.getHashtagVideos(name, pagination);
  }
}
