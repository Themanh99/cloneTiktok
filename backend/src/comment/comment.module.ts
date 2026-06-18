import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentGateway } from './comment.gateway';
import { CommentService } from './comment.service';

@Module({
  controllers: [CommentController],
  providers: [CommentService, CommentGateway],
})
export class CommentModule {}
