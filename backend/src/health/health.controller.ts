import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import { Public } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  /** Liveness probe that also confirms the database is reachable. */
  @Public()
  @Get()
  async check() {
    // Pinging confirms the server actually answers, not merely that a socket
    // exists.
    if (
      this.connection.readyState !== ConnectionStates.connected ||
      !this.connection.db
    ) {
      throw new ServiceUnavailableException('Database not connected');
    }

    await this.connection.db.admin().ping();

    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
