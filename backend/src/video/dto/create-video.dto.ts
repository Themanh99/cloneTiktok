import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { VideoVisibility } from '@prisma/client';

export class CreateVideoDto {
  @IsString()
  fileKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  duration: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  width: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  height: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  sizeBytes: number;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  hlsUrl?: string;

  @IsOptional()
  @IsEnum(VideoVisibility)
  visibility?: VideoVisibility;

  @IsOptional()
  @IsString()
  soundId?: string;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDuet?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;
}
