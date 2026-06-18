import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @IsOptional()
  @IsString()
  avatarFileKey?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  gender?: number;

  @IsOptional()
  @IsIn(['vi', 'en'])
  languageCode?: 'vi' | 'en';
}
