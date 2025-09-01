import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { MonthsService } from './months.service'

@Controller('months')
@UseGuards(AuthGuard('jwt'))
export class MonthsController {
  constructor(private readonly monthsService: MonthsService) {}

  @Post()
  create(@Body() createMonthDto: any) {
    return this.monthsService.create(createMonthDto)
  }

  @Get()
  findAll() {
    return this.monthsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.monthsService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMonthDto: any) {
    return this.monthsService.update(id, updateMonthDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.monthsService.remove(id)
  }
}