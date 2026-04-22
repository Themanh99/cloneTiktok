import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// DTO cho Cursor-based Pagination
// Tại sao cursor thay vì offset/limit?
// - Feed video thêm mới liên tục
// - Offset: load page 2 → video mới insert → page 2 bị lặp video page 1
// - Cursor: "cho tôi 10 video SAU video có id=xxx" → không bao giờ lặp
export class PaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number) // Chuyển query string → number tự động
  limit?: number = 10;
}
