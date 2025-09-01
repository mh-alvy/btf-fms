import { Module } from '@nestjs/common'
import { ReceivedByOptionsService } from './received-by-options.service'
import { ReceivedByOptionsController } from './received-by-options.controller'

@Module({
  controllers: [ReceivedByOptionsController],
  providers: [ReceivedByOptionsService],
  exports: [ReceivedByOptionsService],
})
export class ReceivedByOptionsModule {}