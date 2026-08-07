import { IsString, Length } from 'class-validator';

export class UpdateCommentDto {
  @IsString({ message: 'body must be a string' })
  @Length(1, 5000, { message: 'body must be between 1 and 5000 characters' })
  body!: string;
}
