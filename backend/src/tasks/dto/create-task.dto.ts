import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { PRIORITIES, STATUSES } from '../../common/constants';

export class CreateTaskDto {
  @IsString({ message: 'title must be a string' })
  @Length(1, 200, { message: 'title must be between 1 and 200 characters' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @Length(0, 5000, { message: 'description cannot exceed 5000 characters' })
  description?: string;

  @IsOptional()
  @IsIn(STATUSES, {
    message: `status must be one of: ${STATUSES.join(', ')}`,
  })
  status?: string;

  @IsOptional()
  @IsIn(PRIORITIES, {
    message: `priority must be one of: ${PRIORITIES.join(', ')}`,
  })
  priority?: string;

  @IsOptional()
  @IsDateString({}, { message: 'dueDate must be an ISO 8601 date string' })
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'position must be an integer' })
  @Min(0, { message: 'position cannot be negative' })
  position?: number;

  @IsOptional()
  @IsString({ message: 'projectId must be a string' })
  projectId?: string;

  /** Set to nest this task as a subtask of another. */
  @IsOptional()
  @IsString({ message: 'parentId must be a string' })
  parentId?: string;

  @IsOptional()
  @IsArray({ message: 'assigneeIds must be an array' })
  @ArrayMaxSize(20, { message: 'a task cannot have more than 20 assignees' })
  @IsString({ each: true, message: 'each assignee id must be a string' })
  assigneeIds?: string[];

  /** Label names; unknown names are created on demand. */
  @IsOptional()
  @IsArray({ message: 'labels must be an array' })
  @ArrayMaxSize(20, { message: 'a task cannot have more than 20 labels' })
  @IsString({ each: true, message: 'each label must be a string' })
  @Length(1, 40, {
    each: true,
    message: 'each label must be between 1 and 40 characters',
  })
  labels?: string[];
}
