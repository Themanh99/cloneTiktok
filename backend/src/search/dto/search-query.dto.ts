import { Type } from 'class-transformer';
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  @MinLength(1)
  q: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit = 8;
}
