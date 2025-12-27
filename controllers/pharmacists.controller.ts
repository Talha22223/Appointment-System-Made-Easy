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
import * as bcrypt from 'bcryptjs';

@Controller('pharmacists')
export class PharmacistsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    try {
      const pharmacists = await this.prisma.pharmacist.findMany({
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
      const pharmacistsWithId = pharmacists.map(p => ({ ...p, _id: p.id }));
      return pharmacistsWithId;
    } catch (error) {
      console.error('GET /api/pharmacists error:', error);
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

      if (!name || !email || !password) {
        throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
      }

      const existingPharmacist = await this.prisma.pharmacist.findUnique({
        where: { email }
      });

      if (existingPharmacist) {
        throw new HttpException('Pharmacist with this email already exists', HttpStatus.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const pharmacist = await this.prisma.pharmacist.create({
        data: {
          name,
          email,
          password: hashedPassword,
          speciality: speciality || 'General Pharmacy',
          degree: degree || 'B.Pharm',
          experience: experience || '1 Year',
          fees: Number(fees) || 30,
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
        message: 'Pharmacist added successfully',
        pharmacist: { ...pharmacist, _id: pharmacist.id }
      };
    } catch (error: any) {
      console.error('POST /api/pharmacists error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const pharmacist = await this.prisma.pharmacist.findUnique({
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

      if (!pharmacist) {
        throw new HttpException('Pharmacist not found', HttpStatus.NOT_FOUND);
      }

      return { ...pharmacist, _id: pharmacist.id };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
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

      const pharmacist = await this.prisma.pharmacist.update({
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
        message: 'Pharmacist updated successfully',
        pharmacist: { ...pharmacist, _id: pharmacist.id }
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpException('Pharmacist not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.prisma.pharmacist.delete({
        where: { id }
      });

      return { message: 'Pharmacist deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpException('Pharmacist not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
