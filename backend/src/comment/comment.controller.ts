import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CommentGateway } from './comment.gateway';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller()
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly commentGateway: CommentGateway,
  ) {}

  @Post('videos/:videoId/comments')
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser('id') userId: string,
    @Param('videoId') videoId: string,
    @Body() dto: CreateCommentDto,
  ) {
    const comment = await this.commentService.createComment(userId, videoId, dto);
    this.commentGateway.emitNewComment(videoId, comment);
    return comment;
  }

  @Get('videos/:videoId/comments')
  getComments(@Param('videoId') videoId: string, @Query() pagination: PaginationDto) {
    return this.commentService.getComments(videoId, pagination);
  }

  @Get('comments/:commentId/replies')
  getReplies(@Param('commentId') commentId: string, @Query() pagination: PaginationDto) {
    return this.commentService.getReplies(commentId, pagination);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser('id') userId: string, @Param('commentId') commentId: string) {
    const result = await this.commentService.deleteComment(userId, commentId);
    this.commentGateway.emitDeletedComment(result.videoId, commentId);
    return result;
  }
}
