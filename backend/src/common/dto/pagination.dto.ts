import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Shared list-query parameters. Query strings arrive as text, so @Type coerces
 * before the numeric constraints run.
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'skip must be an integer' })
  @Min(0, { message: 'skip cannot be negative' })
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'take must be an integer' })
  @Min(1, { message: 'take must be at least 1' })
  @Max(100, { message: 'take cannot exceed 100' })
  take?: number = 50;
}
