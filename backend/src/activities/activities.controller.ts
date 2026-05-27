import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../common/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { GetActivitiesQueryDto } from './dto/get-activities-query.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // GET /api/activities
  @Get()
  findAll(@Query() query: GetActivitiesQueryDto) {
    return this.activitiesService.findAll(query);
  }

  // GET /api/activities/:id
  @Get(':id')
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => new BadRequestException('ID hoạt động không hợp lệ'),
      }),
    )
    id: string,
  ) {
    return this.activitiesService.findOne(id);
  }

  // POST /api/activities/:id/join
  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  join(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => new BadRequestException('ID hoạt động không hợp lệ'),
      }),
    )
    id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.activitiesService.join(id, req.user.id);
  }

  // POST /api/activities
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateActivityDto) {
    return this.activitiesService.create(req.user.id, dto);
  }
}
