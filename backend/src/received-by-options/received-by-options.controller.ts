import { Controller, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ReceivedByOptionsService } from './received-by-options.service'

@Controller('received-by-options')
@UseGuards(AuthGuard('jwt'))
export class ReceivedByOptionsController {
  constructor(private readonly receivedByOptionsService: ReceivedByOptionsService) {}

  @Post()
  create(@Body() createReceivedByOptionDto: any) {
    return this.receivedByOptionsService.create(createReceivedByOptionDto)
  }

  @Get()
  findAll() {
    return this.receivedByOptionsService.findAll()
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.receivedByOptionsService.remove(id)
  }
}