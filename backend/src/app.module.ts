import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { InstitutionsModule } from './institutions/institutions.module'
import { BatchesModule } from './batches/batches.module'
import { CoursesModule } from './courses/courses.module'
import { MonthsModule } from './months/months.module'
import { StudentsModule } from './students/students.module'
import { PaymentsModule } from './payments/payments.module'
import { ActivitiesModule } from './activities/activities.module'
import { ReferenceOptionsModule } from './reference-options/reference-options.module'
import { ReceivedByOptionsModule } from './received-by-options/received-by-options.module'
import { SupabaseModule } from './supabase/supabase.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    InstitutionsModule,
    BatchesModule,
    CoursesModule,
    MonthsModule,
    StudentsModule,
    PaymentsModule,
    ActivitiesModule,
    ReferenceOptionsModule,
    ReceivedByOptionsModule,
  ],
})
export class AppModule {}