import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { BatchesService } from './batches.service'

@Controller('batches')
@UseGuards(AuthGuard('jwt'))
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  create(@Body() createBatchDto: any) {
    return this.batchesService.create(createBatchDto)
  }

  @Get()
  findAll() {
    return this.batchesService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.batchesService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBatchDto: any) {
    return this.batchesService.update(id, updateBatchDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.batchesService.remove(id)
  }
}