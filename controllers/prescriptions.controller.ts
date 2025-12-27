import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { DoctorGuard } from '../guards/doctor.guard';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard, DoctorGuard)
  @Post()
  async create(@Request() req: any, @Body() body: any) {
    try {
      const { patientId, appointmentId, medicines, diagnosis, advice, followUp } = body;

      // Find doctor by userId (the logged-in user's ID)
      const doctor = await this.prisma.doctor.findFirst({
        where: { id: req.user.id }
      });

      if (!doctor) {
        throw new HttpException('Doctor profile not found', HttpStatus.NOT_FOUND);
      }

      if (appointmentId) {
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: appointmentId }
        });

        if (!appointment) {
          throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
        }

        await this.prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: 'completed' }
        });
      }

      const prescription = await this.prisma.prescription.create({
        data: {
          patientId,
          doctorId: doctor.id,
          appointmentId: appointmentId || null,
          medicines: medicines || [],
          diagnosis: diagnosis || null,
          advice: advice || null,
          followUp: followUp ? new Date(followUp) : null
        }
      });

      return { ...prescription, _id: prescription.id };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('patient')
  async getPatientPrescriptions(@Request() req: any) {
    try {
      const prescriptions = await this.prisma.prescription.findMany({
        where: { patientId: req.user.id },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              speciality: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Map for backward compatibility
      const mappedPrescriptions = prescriptions.map(p => ({
        ...p,
        _id: p.id,
        doctorId: p.doctor ? { ...p.doctor, _id: p.doctor.id } : null
      }));

      return mappedPrescriptions;
    } catch (error) {
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, DoctorGuard)
  @Get('doctor')
  async getDoctorPrescriptions(@Request() req: any) {
    try {
      // Find doctor - the logged-in user is the doctor
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: req.user.id }
      });

      if (!doctor) {
        throw new HttpException('Doctor profile not found', HttpStatus.NOT_FOUND);
      }

      const prescriptions = await this.prisma.prescription.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Map for backward compatibility
      const mappedPrescriptions = prescriptions.map(p => ({
        ...p,
        _id: p.id,
        patientId: p.patient ? { ...p.patient, _id: p.patient.id } : null
      }));

      return mappedPrescriptions;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const prescription = await this.prisma.prescription.findUnique({
        where: { id },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              speciality: true,
              degree: true
            }
          },
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!prescription) {
        throw new HttpException('Prescription not found', HttpStatus.NOT_FOUND);
      }

      // Map for backward compatibility
      const mappedPrescription = {
        ...prescription,
        _id: prescription.id,
        doctorId: prescription.doctor ? { ...prescription.doctor, _id: prescription.doctor.id } : null,
        patientId: prescription.patient ? { ...prescription.patient, _id: prescription.patient.id } : null
      };

      return mappedPrescription;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

