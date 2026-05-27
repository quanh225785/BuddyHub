import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class MetadataController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/interests
  @Get('interests')
  async getInterests() {
    const items = await this.prisma.interestTag.findMany({
      select: { id: true, name: true, key: true },
      orderBy: { name: 'asc' },
    });

    return {
      message: 'OK',
      interests: items.map((item) => item.name),
      items,
    };
  }

  // GET /api/categories
  @Get('categories')
  async getCategories() {
    const items = await this.prisma.activityCategory.findMany({
      select: { id: true, name: true, key: true, description: true },
      orderBy: { name: 'asc' },
    });

    return {
      message: 'OK',
      categories: items.map((item) => item.name),
      items,
    };
  }
}
