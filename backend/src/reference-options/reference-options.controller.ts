import { Controller, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ReferenceOptionsService } from './reference-options.service'

@Controller('reference-options')
@UseGuards(AuthGuard('jwt'))
export class ReferenceOptionsController {
  constructor(private readonly referenceOptionsService: ReferenceOptionsService) {}

  @Post()
  create(@Body() createReferenceOptionDto: any) {
    return this.referenceOptionsService.create(createReferenceOptionDto)
  }

  @Get()
  findAll() {
    return this.referenceOptionsService.findAll()
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.referenceOptionsService.remove(id)
  }
}