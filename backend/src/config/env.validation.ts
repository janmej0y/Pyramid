import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Fails fast at boot on missing or malformed configuration, rather than at the
 * first request that happens to need it.
 */
class EnvironmentVariables {
  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL is required' })
  @Matches(/^mongodb(\+srv)?:\/\//, {
    message:
      'DATABASE_URL must be a MongoDB connection string (mongodb:// or mongodb+srv://)',
  })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(16, {
    message: 'JWT_SECRET must be at least 16 characters',
  })
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  /**
   * Google OAuth credentials. Optional as a set — when they are absent the
   * sign-in endpoints return 503 and the UI hides the button, so the app still
   * runs guest-only. Validation of the pairing happens in validateEnv below,
   * since class-validator cannot express "all or none" across fields.
   */
  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  /**
   * Absolute callback URL registered in the Google Cloud console, e.g.
   * https://api.example.com/api/auth/google/callback — it must match byte for
   * byte or Google rejects the exchange with redirect_uri_mismatch.
   */
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\//, {
    message: 'GOOGLE_CALLBACK_URL must be an absolute http(s) URL',
  })
  GOOGLE_CALLBACK_URL?: string;

  /** Where the API sends the browser after a successful sign-in. */
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\//, {
    message: 'OAUTH_SUCCESS_REDIRECT must be an absolute http(s) URL',
  })
  OAUTH_SUCCESS_REDIRECT?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const parsed = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(parsed, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  // Google OAuth is all-or-nothing. A partial setup would pass field-level
  // validation and then fail at the first sign-in attempt, which is a much
  // worse place to discover a missing secret than at boot.
  const googleKeys = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
  ] as const;
  const present = googleKeys.filter((key) => Boolean(parsed[key]));

  if (present.length > 0 && present.length < googleKeys.length) {
    const missing = googleKeys.filter((key) => !parsed[key]);
    throw new Error(
      `Invalid environment configuration: Google sign-in needs ${googleKeys.join(
        ', ',
      )} — missing ${missing.join(', ')}. Unset them all to run guest-only.`,
    );
  }

  return parsed;
}
