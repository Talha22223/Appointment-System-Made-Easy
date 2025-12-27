import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { DoctorsController } from './controllers/doctors.controller';
import { LabTechniquesController } from './controllers/lab-techniques.controller';
import { PharmacistsController } from './controllers/pharmacists.controller';
import { LabBookingsController } from './controllers/lab-bookings.controller';
import { AppointmentsController } from './controllers/appointments.controller';
import { PrescriptionsController } from './controllers/prescriptions.controller';
import { ChatbotController } from './controllers/chatbot.controller';
import { PharmacistAppointmentsController } from './controllers/pharmacist-appointments.controller';
import { PrismaService } from './services/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
  ],
  controllers: [
    DoctorsController, 
    LabTechniquesController, 
    PharmacistsController, 
    LabBookingsController,
    AppointmentsController,
    PrescriptionsController,
    ChatbotController,
    PharmacistAppointmentsController
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}