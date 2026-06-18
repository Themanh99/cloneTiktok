import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dtos/pagination.dto';

export class GetUserVideosDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE', 'ALL'])
  visibility?: string;
}
