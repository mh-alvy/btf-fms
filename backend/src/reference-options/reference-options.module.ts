import { Module } from '@nestjs/common'
import { ReferenceOptionsService } from './reference-options.service'
import { ReferenceOptionsController } from './reference-options.controller'

@Module({
  controllers: [ReferenceOptionsController],
  providers: [ReferenceOptionsService],
  exports: [ReferenceOptionsService],
})
export class ReferenceOptionsModule {}