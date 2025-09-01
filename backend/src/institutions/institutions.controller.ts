import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { InstitutionsService } from './institutions.service'

@Controller('institutions')
@UseGuards(AuthGuard('jwt'))
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  create(@Body() createInstitutionDto: any) {
    return this.institutionsService.create(createInstitutionDto)
  }

  @Get()
  findAll() {
    return this.institutionsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInstitutionDto: any) {
    return this.institutionsService.update(id, updateInstitutionDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.institutionsService.remove(id)
  }
}