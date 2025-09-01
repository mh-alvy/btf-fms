import { Module } from '@nestjs/common'
import { MonthsService } from './months.service'
import { MonthsController } from './months.controller'

@Module({
  controllers: [MonthsController],
  providers: [MonthsService],
  exports: [MonthsService],
})
export class MonthsModule {}