import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { CreateVideoDto } from './dto/create-video.dto';
import { PresignedUploadQueryDto } from './dto/presigned-upload-query.dto';
import { VideoService } from './video.service';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get('presigned-url')
  @UseGuards(JwtAuthGuard)
  getPresignedUrl(@CurrentUser('id') userId: string, @Query() query: PresignedUploadQueryDto) {
    return this.videoService.getPresignedUrl(userId, query.contentType);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createVideo(@CurrentUser('id') userId: string, @Body() dto: CreateVideoDto) {
    return this.videoService.createVideo(userId, dto);
  }

  @Get('feed')
  @UseGuards(OptionalJwtAuthGuard)
  getFeed(@Query() pagination: PaginationDto, @CurrentUser('id') userId?: string) {
    return this.videoService.getFeedForYou(pagination, userId);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  getFollowingFeed(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.videoService.getFeedFollowing(userId, pagination);
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  searchVideos(
    @Query('q') query: string,
    @Query() pagination: PaginationDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.videoService.searchVideos(query || '', pagination, userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getVideo(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.videoService.getVideoById(id, userId);
  }

  @Post(':id/view')
  recordView(@Param('id') id: string) {
    return this.videoService.recordView(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteVideo(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.videoService.deleteVideo(userId, id);
  }
}
