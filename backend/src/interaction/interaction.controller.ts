import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InteractionService } from './interaction.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Post('videos/:videoId/like')
  like(@CurrentUser('id') userId: string, @Param('videoId') videoId: string) {
    return this.interactionService.likeVideo(userId, videoId);
  }

  @Delete('videos/:videoId/like')
  unlike(@CurrentUser('id') userId: string, @Param('videoId') videoId: string) {
    return this.interactionService.unlikeVideo(userId, videoId);
  }

  @Post('videos/:videoId/bookmark')
  bookmark(@CurrentUser('id') userId: string, @Param('videoId') videoId: string) {
    return this.interactionService.bookmarkVideo(userId, videoId);
  }

  @Delete('videos/:videoId/bookmark')
  removeBookmark(@CurrentUser('id') userId: string, @Param('videoId') videoId: string) {
    return this.interactionService.removeBookmark(userId, videoId);
  }

  @Get('users/me/bookmarks')
  getBookmarks(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.interactionService.getBookmarks(userId, pagination);
  }
}
