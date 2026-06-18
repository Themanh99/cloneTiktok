import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/comments',
  cors: { origin: true, credentials: true },
})
export class CommentGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join_video_room')
  joinVideoRoom(@ConnectedSocket() client: Socket, @MessageBody() body: { videoId: string }) {
    if (body?.videoId) {
      client.join(`video:${body.videoId}`);
    }
  }

  @SubscribeMessage('leave_video_room')
  leaveVideoRoom(@ConnectedSocket() client: Socket, @MessageBody() body: { videoId: string }) {
    if (body?.videoId) {
      client.leave(`video:${body.videoId}`);
    }
  }

  emitNewComment(videoId: string, comment: unknown) {
    this.server.to(`video:${videoId}`).emit('new_comment', comment);
  }

  emitDeletedComment(videoId: string, commentId: string) {
    this.server.to(`video:${videoId}`).emit('comment_deleted', { commentId });
  }
}
