import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // POST /api/activities
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateActivityDto) {
    return this.activitiesService.create(req.user.id, dto);
  }
}
