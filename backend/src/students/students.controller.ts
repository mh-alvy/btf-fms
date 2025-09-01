import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { StudentsService } from './students.service'

@Controller('students')
@UseGuards(AuthGuard('jwt'))
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() createStudentDto: any) {
    return this.studentsService.create(createStudentDto)
  }

  @Get()
  findAll() {
    return this.studentsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: any) {
    return this.studentsService.update(id, updateStudentDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id)
  }
}