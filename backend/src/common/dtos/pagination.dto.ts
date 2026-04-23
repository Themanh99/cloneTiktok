import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// DTO for Cursor-based Pagination
// Why cursor instead of offset/limit?
// - Video feeds are constantly being updated with new content
// - Offset: load page 2 → new video inserted → page 2 repeats items from page 1
// - Cursor: "give me 10 videos AFTER video id=xxx" → never duplicates
export class PaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number) // Auto-cast query string → number
  limit?: number = 10;
}
