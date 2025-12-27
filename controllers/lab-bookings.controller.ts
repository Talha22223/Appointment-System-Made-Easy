import { 
  Controller, 
  Get, 
  Post, 
  Put,
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

@Controller('lab-bookings')
export class LabBookingsController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() body: any) {
    try {
      const { labTechniqueId, labTechniqueData, bookingDate, notes } = body;

      if (!labTechniqueId && !labTechniqueData) {
        throw new HttpException('Lab technique information is required', HttpStatus.BAD_REQUEST);
      }

      if (!bookingDate) {
        throw new HttpException('Booking date is required', HttpStatus.BAD_REQUEST);
      }

      // Check if labTechniqueId is a valid ID
      const isValidLabTechniqueId = labTechniqueId && typeof labTechniqueId === 'string' && labTechniqueId.length > 5;

      if (!isValidLabTechniqueId) {
        // Create booking without lab technique reference, just with labTechniqueDetails
        const labBooking = await this.prisma.labBooking.create({
          data: {
            labTechniqueDetails: labTechniqueData || { name: 'Unknown Test', category: 'Not specified' },
            userId: req.user.id,
            bookingDate: new Date(bookingDate),
            notes: notes || null,
            status: 'pending'
          }
        });

        return {
          message: 'Lab test booking created successfully',
          labBooking: {
            id: labBooking.id,
            labTechniqueName: labTechniqueData?.name || 'Unknown Test',
            bookingDate: labBooking.bookingDate,
            status: labBooking.status
          }
        };
      }

      // Create booking with lab technique reference
      const labBooking = await this.prisma.labBooking.create({
        data: {
          labTechniqueId: labTechniqueId,
          labTechniqueDetails: labTechniqueData || { name: 'Unknown Test', category: 'Not specified' },
          userId: req.user.id,
          bookingDate: new Date(bookingDate),
          notes: notes || null,
          status: 'pending'
        }
      });

      return {
        message: 'Lab test booking created successfully',
        labBooking: {
          id: labBooking.id,
          labTechniqueName: labTechniqueData?.name || 'Unknown Test',
          bookingDate: labBooking.bookingDate,
          status: labBooking.status
        }
      };
    } catch (error: any) {
      console.error('Error creating lab booking:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error while creating lab booking', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('patient')
  async getPatientLabBookings(@Request() req: any) {
    try {
      const labBookings = await this.prisma.labBooking.findMany({
        where: { userId: req.user.id },
        include: {
          labTechnique: {
            select: {
              id: true,
              name: true,
              category: true,
              image: true,
              duration: true,
              price: true
            }
          }
        },
        orderBy: { bookingDate: 'desc' }
      });

      const processedLabBookings = labBookings.map(booking => {
        const bookingObj: any = {
          ...booking,
          _id: booking.id
        };

        if (!bookingObj.labTechnique || !bookingObj.labTechnique.name) {
          bookingObj.labTechnique = bookingObj.labTechniqueDetails || {
            name: 'Unknown Test',
            category: 'Not specified'
          };
        } else {
          bookingObj.labTechnique = {
            ...bookingObj.labTechnique,
            _id: bookingObj.labTechnique.id
          };
        }

        return bookingObj;
      });

      return processedLabBookings;
    } catch (error) {
      console.error('Error fetching patient lab bookings:', error);
      throw new HttpException('Server error while fetching lab bookings', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async findAll(@Request() req: any) {
    try {
      const labBookings = await this.prisma.labBooking.findMany({
        include: {
          labTechnique: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { bookingDate: 'desc' }
      });

      const processedLabBookings = labBookings.map(booking => {
        const bookingObj: any = {
          ...booking,
          _id: booking.id
        };

        if (bookingObj.labTechnique) {
          bookingObj.labTechnique = {
            ...bookingObj.labTechnique,
            _id: bookingObj.labTechnique.id
          };
        }

        if (bookingObj.user) {
          bookingObj.user = {
            ...bookingObj.user,
            _id: bookingObj.user.id
          };
        }

        return bookingObj;
      });

      return processedLabBookings;
    } catch (error) {
      throw new HttpException('Server error while fetching lab bookings', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/cancel')
  async cancel(@Request() req: any, @Param('id') id: string) {
    try {
      const labBooking = await this.prisma.labBooking.findUnique({
        where: { id }
      });

      if (!labBooking) {
        throw new HttpException('Lab booking not found', HttpStatus.NOT_FOUND);
      }

      if (labBooking.userId !== req.user.id) {
        throw new HttpException('Not authorized to cancel this lab booking', HttpStatus.FORBIDDEN);
      }

      if (labBooking.status === 'cancelled') {
        throw new HttpException('This lab booking is already cancelled', HttpStatus.BAD_REQUEST);
      }

      if (new Date(labBooking.bookingDate) < new Date()) {
        throw new HttpException('Cannot cancel past lab bookings', HttpStatus.BAD_REQUEST);
      }

      await this.prisma.labBooking.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      return { message: 'Lab booking cancelled successfully' };
    } catch (error: any) {
      console.error('Error cancelling lab booking:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error while cancelling lab booking', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/status')
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

      const labBooking = await this.prisma.labBooking.findUnique({
        where: { id }
      });

      if (!labBooking) {
        throw new HttpException('Lab booking not found', HttpStatus.NOT_FOUND);
      }

      // Allow users to manage their own bookings, or admins to manage any booking
      if (req.user.role !== 'admin' && labBooking.userId !== req.user.id) {
        throw new HttpException('Access denied. You can only manage your own bookings.', HttpStatus.FORBIDDEN);
      }

      const updatedLabBooking = await this.prisma.labBooking.update({
        where: { id },
        data: { status }
      });

      return {
        message: 'Lab booking status updated successfully',
        labBooking: { ...updatedLabBooking, _id: updatedLabBooking.id }
      };
    } catch (error: any) {
      console.error('Error updating lab booking status:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error while updating lab booking status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    try {
      const labBooking = await this.prisma.labBooking.findUnique({
        where: { id },
        include: {
          labTechnique: {
            select: {
              id: true,
              name: true,
              category: true,
              image: true,
              duration: true,
              price: true
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

      if (!labBooking) {
        throw new HttpException('Lab booking not found', HttpStatus.NOT_FOUND);
      }

      // Check authorization
      if (labBooking.userId !== req.user.id && req.user.role !== 'admin') {
        throw new HttpException('Not authorized to view this lab booking', HttpStatus.FORBIDDEN);
      }

      const bookingObj: any = {
        ...labBooking,
        _id: labBooking.id
      };

      if (!bookingObj.labTechnique && bookingObj.labTechniqueDetails) {
        bookingObj.labTechnique = bookingObj.labTechniqueDetails;
      } else if (bookingObj.labTechnique) {
        bookingObj.labTechnique = {
          ...bookingObj.labTechnique,
          _id: bookingObj.labTechnique.id
        };
      }

      if (bookingObj.user) {
        bookingObj.user = { ...bookingObj.user, _id: bookingObj.user.id };
      }

      return bookingObj;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error while fetching lab booking details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
