import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Patch,
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

// Map method string to enum value
function mapMethodToEnum(method: string): 'InPerson' | 'VideoCall' | 'PhoneCall' {
  const methodMap: Record<string, 'InPerson' | 'VideoCall' | 'PhoneCall'> = {
    'In Person': 'InPerson',
    'Video Call': 'VideoCall',
    'Phone Call': 'PhoneCall'
  };
  return methodMap[method] || 'InPerson';
}

// Map enum value back to display string
function mapEnumToMethod(enumValue: string): string {
  const methodMap: Record<string, string> = {
    'InPerson': 'In Person',
    'VideoCall': 'Video Call',
    'PhoneCall': 'Phone Call'
  };
  return methodMap[enumValue] || 'In Person';
}

@Controller('pharmacist-appointments')
export class PharmacistAppointmentsController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() body: any) {
    try {
      const { pharmacistId, pharmacistData, appointmentDate, purpose, method, notes } = body;

      if (!pharmacistId && !pharmacistData) {
        throw new HttpException('Pharmacist information is required', HttpStatus.BAD_REQUEST);
      }

      if (!appointmentDate) {
        throw new HttpException('Appointment date is required', HttpStatus.BAD_REQUEST);
      }

      // Check if pharmacistId is a valid ID
      const isValidPharmacistId = pharmacistId && typeof pharmacistId === 'string' && pharmacistId.length > 5;

      if (!isValidPharmacistId) {
        // Create appointment without pharmacist reference, just with pharmacistDetails
        const appointment = await this.prisma.pharmacistAppointment.create({
          data: {
            pharmacistDetails: pharmacistData || { name: 'Unknown Pharmacist', speciality: 'General Pharmacy' },
            userId: req.user.id,
            appointmentDate: new Date(appointmentDate),
            purpose: purpose || 'Medication Consultation',
            method: mapMethodToEnum(method || 'In Person'),
            notes: notes || null,
            status: 'pending'
          }
        });

        return {
          message: 'Pharmacist appointment created successfully',
          appointment: {
            id: appointment.id,
            pharmacistName: pharmacistData?.name || 'Unknown Pharmacist',
            appointmentDate: appointment.appointmentDate,
            status: appointment.status
          }
        };
      }

      // Create appointment with pharmacist reference
      const appointment = await this.prisma.pharmacistAppointment.create({
        data: {
          pharmacistId: pharmacistId,
          pharmacistDetails: pharmacistData || { name: 'Unknown Pharmacist', speciality: 'General Pharmacy' },
          userId: req.user.id,
          appointmentDate: new Date(appointmentDate),
          purpose: purpose || 'Medication Consultation',
          method: mapMethodToEnum(method || 'In Person'),
          notes: notes || null,
          status: 'pending'
        }
      });

      return {
        message: 'Pharmacist appointment created successfully',
        appointment: {
          id: appointment.id,
          pharmacistName: pharmacistData?.name || 'Unknown Pharmacist',
          appointmentDate: appointment.appointmentDate,
          status: appointment.status
        }
      };
    } catch (error: any) {
      console.error('Create pharmacist appointment error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('patient')
  async getPatientAppointments(@Request() req: any) {
    try {
      const appointments = await this.prisma.pharmacistAppointment.findMany({
        where: { userId: req.user.id },
        include: {
          pharmacist: {
            select: {
              id: true,
              name: true,
              speciality: true,
              image: true,
              email: true,
              degree: true,
              experience: true,
              fees: true
            }
          }
        },
        orderBy: { appointmentDate: 'desc' }
      });

      const processedAppointments = appointments.map(appointment => {
        const appointmentObj: any = {
          ...appointment,
          _id: appointment.id,
          method: mapEnumToMethod(appointment.method)
        };

        if (!appointmentObj.pharmacist && appointmentObj.pharmacistDetails) {
          appointmentObj.pharmacist = appointmentObj.pharmacistDetails;
        } else if (appointmentObj.pharmacist) {
          appointmentObj.pharmacist = { ...appointmentObj.pharmacist, _id: appointmentObj.pharmacist.id };
        }

        return appointmentObj;
      });

      return processedAppointments;
    } catch (error) {
      console.error('Get patient pharmacist appointments error:', error);
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('all')
  async getAll(@Request() req: any) {
    try {
      const appointments = await this.prisma.pharmacistAppointment.findMany({
        include: {
          pharmacist: {
            select: {
              id: true,
              name: true,
              speciality: true,
              image: true,
              email: true,
              degree: true,
              experience: true,
              fees: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        },
        orderBy: { appointmentDate: 'desc' }
      });

      const processedAppointments = appointments.map(appointment => {
        const appointmentObj: any = {
          ...appointment,
          _id: appointment.id,
          method: mapEnumToMethod(appointment.method)
        };

        if (!appointmentObj.pharmacist && appointmentObj.pharmacistDetails) {
          appointmentObj.pharmacist = appointmentObj.pharmacistDetails;
        } else if (appointmentObj.pharmacist) {
          appointmentObj.pharmacist = { ...appointmentObj.pharmacist, _id: appointmentObj.pharmacist.id };
        }

        if (appointmentObj.user) {
          appointmentObj.user = { ...appointmentObj.user, _id: appointmentObj.user.id };
        }

        return appointmentObj;
      });

      return processedAppointments;
    } catch (error) {
      console.error('Get all pharmacist appointments error:', error);
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    try {
      const appointment = await this.prisma.pharmacistAppointment.findUnique({
        where: { id },
        include: {
          pharmacist: {
            select: {
              id: true,
              name: true,
              speciality: true,
              image: true,
              email: true,
              degree: true,
              experience: true,
              fees: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      if (!appointment) {
        throw new HttpException('Pharmacist appointment not found', HttpStatus.NOT_FOUND);
      }

      // Verify user owns this appointment or is admin
      if (appointment.userId !== req.user.id && req.user.role !== 'admin') {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      const appointmentObj: any = {
        ...appointment,
        _id: appointment.id,
        method: mapEnumToMethod(appointment.method)
      };

      if (!appointmentObj.pharmacist && appointmentObj.pharmacistDetails) {
        appointmentObj.pharmacist = appointmentObj.pharmacistDetails;
      } else if (appointmentObj.pharmacist) {
        appointmentObj.pharmacist = { ...appointmentObj.pharmacist, _id: appointmentObj.pharmacist.id };
      }

      if (appointmentObj.user) {
        appointmentObj.user = { ...appointmentObj.user, _id: appointmentObj.user.id };
      }

      return appointmentObj;
    } catch (error: any) {
      console.error('Get pharmacist appointment by ID error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/cancel')
  async cancel(@Request() req: any, @Param('id') id: string) {
    try {
      const appointment = await this.prisma.pharmacistAppointment.findUnique({
        where: { id }
      });

      if (!appointment) {
        throw new HttpException('Pharmacist appointment not found', HttpStatus.NOT_FOUND);
      }

      // Verify user owns this appointment
      if (appointment.userId !== req.user.id) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Only allow cancellation if not already cancelled or completed
      if (appointment.status === 'cancelled') {
        throw new HttpException('Appointment is already cancelled', HttpStatus.BAD_REQUEST);
      }

      if (appointment.status === 'completed') {
        throw new HttpException('Cannot cancel a completed appointment', HttpStatus.BAD_REQUEST);
      }

      const updatedAppointment = await this.prisma.pharmacistAppointment.update({
        where: { id },
        data: { status: 'cancelled' },
        include: {
          pharmacist: {
            select: {
              id: true,
              name: true,
              speciality: true
            }
          }
        }
      });

      return {
        message: 'Pharmacist appointment cancelled successfully',
        appointment: {
          ...updatedAppointment,
          _id: updatedAppointment.id,
          pharmacist: updatedAppointment.pharmacist ?
            { ...updatedAppointment.pharmacist, _id: updatedAppointment.pharmacist.id } :
            updatedAppointment.pharmacistDetails
        }
      };
    } catch (error: any) {
      console.error('Cancel pharmacist appointment error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/status')
  async updateStatus(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    try {
      const { status } = body;

      if (!status) {
        throw new HttpException('Status is required', HttpStatus.BAD_REQUEST);
      }

      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'];
      if (!validStatuses.includes(status)) {
        throw new HttpException('Invalid status value', HttpStatus.BAD_REQUEST);
      }

      const appointment = await this.prisma.pharmacistAppointment.findUnique({
        where: { id }
      });

      if (!appointment) {
        throw new HttpException('Pharmacist appointment not found', HttpStatus.NOT_FOUND);
      }

      const updatedAppointment = await this.prisma.pharmacistAppointment.update({
        where: { id },
        data: { status },
        include: {
          pharmacist: {
            select: {
              id: true,
              name: true,
              speciality: true,
              image: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return {
        message: `Pharmacist appointment status updated to ${status}`,
        appointment: {
          ...updatedAppointment,
          _id: updatedAppointment.id,
          pharmacist: updatedAppointment.pharmacist ?
            { ...updatedAppointment.pharmacist, _id: updatedAppointment.pharmacist.id } :
            updatedAppointment.pharmacistDetails,
          user: updatedAppointment.user ?
            { ...updatedAppointment.user, _id: updatedAppointment.user.id } :
            null
        }
      };
    } catch (error: any) {
      console.error('Update pharmacist appointment status error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

