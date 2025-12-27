import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { DoctorGuard } from '../guards/doctor.guard';
import * as bcrypt from 'bcryptjs';

@Controller('doctors')
export class DoctorsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    try {
      const doctors = await this.prisma.doctor.findMany({
        where: { available: true },
        select: {
          id: true,
          name: true,
          email: true,
          speciality: true,
          degree: true,
          experience: true,
          fees: true,
          image: true,
          about: true,
          available: true,
          address: true,
          slotsBooked: true,
          role: true,
          createdAt: true
        }
      });
      // Add _id for backward compatibility
      const doctorsWithId = doctors.map(d => ({ ...d, _id: d.id }));
      return doctorsWithId;
    } catch (error) {
      console.error('GET /api/doctors error:', error);
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  async create(@Body() body: any) {
    try {
      const {
        name,
        email,
        password,
        speciality,
        degree,
        experience,
        fees,
        about,
        image,
        available,
      } = body;

      if (!name || !email || !password || !speciality) {
        throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
      }

      const existingDoctor = await this.prisma.doctor.findUnique({
        where: { email }
      });

      if (existingDoctor) {
        throw new HttpException('Doctor with this email already exists', HttpStatus.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const doctor = await this.prisma.doctor.create({
        data: {
          name,
          email,
          password: hashedPassword,
          speciality,
          degree,
          experience,
          fees: Number(fees),
          about: about || '',
          image: image || '',
          available: available !== undefined ? available : true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          speciality: true,
          degree: true,
          experience: true,
          fees: true,
          image: true,
          about: true,
          available: true,
          address: true,
          slotsBooked: true,
          role: true,
          createdAt: true
        }
      });

      return {
        message: 'Doctor added successfully',
        doctor: { ...doctor, _id: doctor.id }
      };
    } catch (error: any) {
      console.error('POST /api/doctors error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          speciality: true,
          degree: true,
          experience: true,
          fees: true,
          image: true,
          about: true,
          available: true,
          address: true,
          slotsBooked: true,
          role: true,
          createdAt: true
        }
      });

      if (!doctor) {
        throw new HttpException('Doctor not found', HttpStatus.NOT_FOUND);
      }

      return { ...doctor, _id: doctor.id };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, DoctorGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    try {
      const updates = { ...body };
      delete updates.password;

      // Build update data object
      const data: any = {};
      if (updates.name !== undefined) data.name = updates.name;
      if (updates.email !== undefined) data.email = updates.email;
      if (updates.speciality !== undefined) data.speciality = updates.speciality;
      if (updates.degree !== undefined) data.degree = updates.degree;
      if (updates.experience !== undefined) data.experience = updates.experience;
      if (updates.fees !== undefined) data.fees = Number(updates.fees);
      if (updates.image !== undefined) data.image = updates.image;
      if (updates.about !== undefined) data.about = updates.about;
      if (updates.available !== undefined) data.available = updates.available;
      if (updates.address !== undefined) data.address = updates.address;

      const doctor = await this.prisma.doctor.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          speciality: true,
          degree: true,
          experience: true,
          fees: true,
          image: true,
          about: true,
          available: true,
          address: true,
          slotsBooked: true,
          role: true,
          createdAt: true
        }
      });

      return {
        message: 'Doctor updated successfully',
        doctor: { ...doctor, _id: doctor.id }
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpException('Doctor not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.prisma.doctor.delete({
        where: { id }
      });

      return { message: 'Doctor deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpException('Doctor not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
