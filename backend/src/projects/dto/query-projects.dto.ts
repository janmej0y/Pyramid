import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PRIORITIES } from '../../common/constants';

export class QueryProjectsDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  @Length(1, 120, { message: 'search must be between 1 and 120 characters' })
  search?: string;

  @IsOptional()
  @IsIn(PRIORITIES, {
    message: `priority must be one of: ${PRIORITIES.join(', ')}`,
  })
  priority?: string;
}
