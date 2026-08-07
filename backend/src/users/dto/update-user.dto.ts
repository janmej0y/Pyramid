import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @Length(1, 40, { message: 'name must be between 1 and 40 characters' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'title must be a string' })
  @Length(0, 60, { message: 'title cannot exceed 60 characters' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'username must be a string' })
  @Length(1, 30, { message: 'username must be between 1 and 30 characters' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'username may only contain letters, numbers, dot, underscore, hyphen',
  })
  username?: string;

  @IsOptional()
  @IsString({ message: 'avatar must be a string' })
  @Length(0, 2000, { message: 'avatar cannot exceed 2000 characters' })
  avatar?: string;
}
