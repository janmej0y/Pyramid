import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { CommentsModule } from './comments/comments.module';
import { HealthController } from './health/health.controller';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('DATABASE_URL'),
        // Fail fast on an unreachable cluster rather than hanging the request
        // that happens to arrive first.
        serverSelectionTimeoutMS: 10000,
        // A paused/idle Atlas free-tier cluster takes ~20s to accept its first
        // connection, which is longer than the default 30s socket timeout
        // leaves room for once TLS and auth are added on top. Retrying writes
        // covers the primary election that follows a cluster waking up.
        retryWrites: true,
        // Keep the pool small: the free tier caps total connections, and a
        // single web instance never needs the default 100.
        maxPoolSize: 10,
      }),
    }),
    AuthModule,
    UsersModule,
    TasksModule,
    ProjectsModule,
    CommentsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Applied to every route; individual endpoints opt out with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
