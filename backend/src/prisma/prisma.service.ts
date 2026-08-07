import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/client';

/**
 * Wraps the generated Prisma client so Nest owns its lifecycle: the connection
 * opens with the module and closes cleanly on shutdown.
 *
 * Prisma 7 ships no bundled query engine, so the database is reached through a
 * driver adapter. Swapping SQLite for Postgres means changing this adapter and
 * the schema's datasource provider — nothing else in the app.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({
      adapter: new PrismaBetterSqlite3({
        url: config.getOrThrow<string>('DATABASE_URL'),
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
