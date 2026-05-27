import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MetadataController } from './metadata.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MetadataController],
})
export class MetadataModule {}
