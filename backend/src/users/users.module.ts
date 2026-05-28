import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) throw new Error('JWT_SECRET must be configured');

        return {
          secret: jwtSecret,
          signOptions: { expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ?? '7d') as any },
        };
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtAuthGuard, CloudinaryService],
})
export class UsersModule {}
