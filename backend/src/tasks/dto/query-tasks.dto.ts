import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PRIORITIES, STATUSES } from '../../common/constants';

export class QueryTasksDto extends PaginationDto {
  /** Free-text match against the title, backing the toolbar search. */
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  @Length(1, 200, { message: 'search must be between 1 and 200 characters' })
  search?: string;

  @IsOptional()
  @IsIn(STATUSES, { message: `status must be one of: ${STATUSES.join(', ')}` })
  status?: string;

  @IsOptional()
  @IsIn(PRIORITIES, {
    message: `priority must be one of: ${PRIORITIES.join(', ')}`,
  })
  priority?: string;

  @IsOptional()
  @IsString({ message: 'projectId must be a string' })
  projectId?: string;

  /** Returns only the subtasks of this task. */
  @IsOptional()
  @IsString({ message: 'parentId must be a string' })
  parentId?: string;

  /**
   * Top-level tasks only by default; subtasks are returned nested under their
   * parent. Pass includeSubtasks=true to get them as flat rows too.
   */
  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === 'true' || value === true,
  )
  @IsBoolean({ message: 'includeSubtasks must be a boolean' })
  includeSubtasks?: boolean = false;
}
