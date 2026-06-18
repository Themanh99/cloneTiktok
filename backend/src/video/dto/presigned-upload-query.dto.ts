import { IsIn, IsOptional } from 'class-validator';

const VIDEO_CONTENT_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export class PresignedUploadQueryDto {
  @IsOptional()
  @IsIn(VIDEO_CONTENT_TYPES)
  contentType?: string = 'video/mp4';
}
