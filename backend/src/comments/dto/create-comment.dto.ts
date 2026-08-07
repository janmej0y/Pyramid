import { IsOptional, IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @IsString({ message: 'body must be a string' })
  @Length(1, 5000, { message: 'body must be between 1 and 5000 characters' })
  body!: string;

  /** Set to post this comment as a reply within a thread. */
  @IsOptional()
  @IsString({ message: 'parentId must be a string' })
  parentId?: string;
}
