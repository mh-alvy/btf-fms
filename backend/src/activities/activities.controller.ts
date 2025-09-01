import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ActivitiesService } from './activities.service'

@Controller('activities')
@UseGuards(AuthGuard('jwt'))
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Body() createActivityDto: any) {
    return this.activitiesService.create(createActivityDto)
  }

  @Get()
  findAll() {
    return this.activitiesService.findAll()
  }
}