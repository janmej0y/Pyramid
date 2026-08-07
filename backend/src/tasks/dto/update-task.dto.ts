import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

/**
 * Every create field, all optional — PATCH semantics. Validation rules carry
 * over, so a partial update still cannot set an invalid priority.
 */
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
