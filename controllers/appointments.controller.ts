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
import { AdminGuard } from '../guards/admin.guard';
import { PrismaService } from '../services/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { DoctorGuard } from '../guards/doctor.guard';

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

@Controller('appointments')
export class AppointmentsController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() body: any) {
    try {
      const { doctorId, doctorData, appointmentDate, purpose, method, notes } = body;

      if (!doctorId && !doctorData) {
        throw new HttpException('Doctor information is required', HttpStatus.BAD_REQUEST);
      }

      if (!appointmentDate) {
        throw new HttpException('Appointment date is required', HttpStatus.BAD_REQUEST);
      }

      // Check if doctorId is a valid ID
      const isValidDoctorId = doctorId && typeof doctorId === 'string' && doctorId.length > 5;

      if (!isValidDoctorId) {
        // Create appointment without doctor reference, just with doctorDetails
        const appointment = await this.prisma.appointment.create({
          data: {
            doctorDetails: doctorData || { name: 'Unknown Doctor', speciality: 'Not specified' },
            userId: req.user.id,
            appointmentDate: new Date(appointmentDate),
            purpose: purpose || 'General Checkup',
            method: mapMethodToEnum(method || 'In Person'),
            notes: notes || null,
            status: 'pending'
          }
        });

        return {
          message: 'Appointment created successfully',
          appointment: {
            id: appointment.id,
            doctorName: doctorData?.name || 'Unknown Doctor',
            appointmentDate: appointment.appointmentDate,
            status: appointment.status
          }
        };
      }

      // Create appointment with doctor reference
      const appointment = await this.prisma.appointment.create({
        data: {
          doctorId: doctorId,
          doctorDetails: doctorData || { name: 'Unknown Doctor', speciality: 'Not specified' },
          userId: req.user.id,
          appointmentDate: new Date(appointmentDate),
          purpose: purpose || 'General Checkup',
          method: mapMethodToEnum(method || 'In Person'),
          notes: notes || null,
          status: 'pending'
        }
      });

      return {
        message: 'Appointment created successfully',
        appointment: {
          id: appointment.id,
          doctorName: doctorData?.name || 'Unknown Doctor',
          appointmentDate: appointment.appointmentDate,
          status: appointment.status
        }
      };
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error while creating appointment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('patient')
  async getPatientAppointments(@Request() req: any) {
    try {
      const appointments = await this.prisma.appointment.findMany({
        where: { userId: req.user.id },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              speciality: true,
              image: true,
              degree: true,
              experience: true
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

        if (!appointmentObj.doctor || !appointmentObj.doctor.name) {
          appointmentObj.doctor = appointmentObj.doctorDetails || {
            name: 'Unknown Doctor',
            speciality: 'Not specified'
          };
        } else {
          appointmentObj.doctor = {
            ...appointmentObj.doctor,
            _id: appointmentObj.doctor.id
          };
        }

        return appointmentObj;
      });

      return processedAppointments;
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      throw new HttpException('Server error while fetching appointments', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, DoctorGuard)
  @Get('doctor')
  async getDoctorAppointments(@Request() req: any) {
    try {
      const appointments = await this.prisma.appointment.findMany({
        where: { doctorId: req.user.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { appointmentDate: 'desc' }
      });

      // Process appointments for backward compatibility
      const processedAppointments = appointments.map(appt => ({
        ...appt,
        _id: appt.id,
        method: mapEnumToMethod(appt.method),
        user: appt.user ? { ...appt.user, _id: appt.user.id } : null
      }));

      return processedAppointments;
    } catch (error) {
      throw new HttpException('Server error while fetching appointments', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('all')
  async getAll(@Request() req: any) {
    try {
      const appointments = await this.prisma.appointment.findMany({
        include: {
          doctor: {
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

        if (!appointmentObj.doctor && appointmentObj.doctorDetails) {
          appointmentObj.doctor = appointmentObj.doctorDetails;
        } else if (appointmentObj.doctor) {
          appointmentObj.doctor = { ...appointmentObj.doctor, _id: appointmentObj.doctor.id };
        }

        if (appointmentObj.user) {
          appointmentObj.user = { ...appointmentObj.user, _id: appointmentObj.user.id };
        }

        return appointmentObj;
      });

      return processedAppointments;
    } catch (error) {
      console.error('Error fetching all appointments:', error);
      throw new HttpException('Server error while fetching appointments', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              speciality: true,
              image: true,
              email: true
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

      if (!appointment) {
        throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
      }

      const userIsPatient = appointment.userId === req.user.id;
      const userIsDoctor = appointment.doctorId === req.user.id;

      if (!userIsPatient && !userIsDoctor && req.user.role !== 'admin') {
        throw new HttpException('Not authorized to view this appointment', HttpStatus.FORBIDDEN);
      }

      // Build response object
      const appointmentObj: any = {
        ...appointment,
        _id: appointment.id,
        method: mapEnumToMethod(appointment.method)
      };

      if (appointment.user) {
        appointmentObj.user = { ...appointment.user, _id: appointment.user.id };
      }

      if (!appointment.doctor && appointment.doctorDetails) {
        appointmentObj.doctor = appointment.doctorDetails;
      } else if (appointment.doctor) {
        appointmentObj.doctor = { ...appointment.doctor, _id: appointment.doctor.id };
      }

      return appointmentObj;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error while fetching appointment details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    try {
      const { status } = body;

      if (!status || !['pending', 'confirmed', 'cancelled', 'completed', 'rejected'].includes(status)) {
        throw new HttpException('Invalid status value', HttpStatus.BAD_REQUEST);
      }

      const appointment = await this.prisma.appointment.findUnique({
        where: { id }
      });

      if (!appointment) {
        throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
      }

      // Allow users to manage their own appointments, or admins to manage any appointment
      if (req.user.role !== 'admin' && appointment.userId !== req.user.id) {
        throw new HttpException('Access denied. You can only manage your own appointments.', HttpStatus.FORBIDDEN);
      }

      await this.prisma.appointment.update({
        where: { id },
        data: { status }
      });

      return { message: 'Appointment status updated successfully', status };
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error while updating appointment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/cancel')
  async cancel(@Request() req: any, @Param('id') id: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id }
      });

      if (!appointment) {
        throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
      }

      if (appointment.userId !== req.user.id) {
        throw new HttpException('Not authorized to cancel this appointment', HttpStatus.FORBIDDEN);
      }

      if (appointment.status === 'cancelled') {
        throw new HttpException('This appointment is already cancelled', HttpStatus.BAD_REQUEST);
      }

      if (new Date(appointment.appointmentDate) < new Date()) {
        throw new HttpException('Cannot cancel past appointments', HttpStatus.BAD_REQUEST);
      }

      await this.prisma.appointment.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      return { message: 'Appointment cancelled successfully' };
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error while cancelling appointment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

