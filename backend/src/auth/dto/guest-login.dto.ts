import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class GuestLoginDto {
  /**
   * Optional display name. Omitted by the "Continue as Guest" button, which
   * lets the server assign one.
   */
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @Length(1, 40, { message: 'name must be between 1 and 40 characters' })
  @Matches(/^[\p{L}\p{N} '._-]+$/u, {
    message: 'name contains unsupported characters',
  })
  name?: string;
}
