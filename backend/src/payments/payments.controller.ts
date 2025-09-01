import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { PaymentsService } from './payments.service'

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: any) {
    return this.paymentsService.create(createPaymentDto)
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id)
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.paymentsService.findByStudent(studentId)
  }
}