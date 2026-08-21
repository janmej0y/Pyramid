import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { PRIORITIES } from '../../common/constants';

export class CreateProjectDto {
  @IsString({ message: 'name must be a string' })
  @Length(1, 120, { message: 'name must be between 1 and 120 characters' })
  name!: string;

  @IsOptional()
  @IsIn(PRIORITIES, {
    message: `priority must be one of: ${PRIORITIES.join(', ')}`,
  })
  priority?: string;

  @IsOptional()
  @IsDateString({}, { message: 'dueDate must be an ISO 8601 date string' })
  dueDate?: string;

  /**
   * `null` explicitly unassigns the lead. `@IsOptional()` already permits it —
   * it skips validation for both null and undefined — so the union type is
   * what makes the intent visible to callers.
   */
  @IsOptional()
  @IsString({ message: 'leadId must be a string' })
  leadId?: string | null;
}
