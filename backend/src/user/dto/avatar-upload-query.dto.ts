import { IsIn } from 'class-validator';

export class AvatarUploadQueryDto {
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType: string;
}
