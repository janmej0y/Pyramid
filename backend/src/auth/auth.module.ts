import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from '../schemas/user.schema';

/** The `expiresIn` format accepted by jsonwebtoken, e.g. "7d" / "3600s". */
type ExpiresIn = NonNullable<
  NonNullable<JwtModuleOptions['signOptions']>['expiresIn']
>;

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // jsonwebtoken types expiresIn as a `${number}${unit}` template
          // literal ("7d", "60s"). An env string can't satisfy that
          // structurally, so the cast asserts a format env.validation
          // cannot express. An invalid value fails loudly on first sign.
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') as ExpiresIn,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  // JwtModule is re-exported so the global JwtAuthGuard can verify tokens.
  exports: [JwtModule],
})
export class AuthModule {}
