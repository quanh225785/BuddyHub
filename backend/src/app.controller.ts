import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      ok: true,
      env: {
        databaseUrl: Boolean(process.env.DATABASE_URL),
        jwtSecret: Boolean(process.env.JWT_SECRET),
        frontendUrl: process.env.FRONTEND_URL,
      },
    };
  }

  @Get('health/db')
  async getDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error';
      return { ok: false, error: message };
    }
  }
}
