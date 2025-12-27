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

@Controller('lab-techniques')
export class LabTechniquesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    try {
      const labTechniques = await this.prisma.labTechnique.findMany({
        where: { available: true },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          duration: true,
          price: true,
          image: true,
          requirements: true,
          preparation: true,
          available: true,
          slotsBooked: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      // Add _id for backward compatibility
      const labTechniquesWithId = labTechniques.map(lt => ({ ...lt, _id: lt.id }));
      return labTechniquesWithId;
    } catch (error) {
      console.error('GET /api/lab-techniques error:', error);
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  async create(@Body() body: any) {
    try {
      const {
        name,
        description,
        category,
        duration,
        price,
        image,
        requirements,
        preparation,
        available,
      } = body;

      if (!name || !category || !price) {
        throw new HttpException('Missing required fields (name, category, price)', HttpStatus.BAD_REQUEST);
      }

      const existingLabTechnique = await this.prisma.labTechnique.findFirst({
        where: { name }
      });

      if (existingLabTechnique) {
        throw new HttpException('Lab technique with this name already exists', HttpStatus.BAD_REQUEST);
      }

      const labTechnique = await this.prisma.labTechnique.create({
        data: {
          name,
          description: description || '',
          category,
          duration: duration || '30 mins',
          price: Number(price),
          image: image || '',
          requirements: requirements || '',
          preparation: preparation || '',
          available: available !== undefined ? available : true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          duration: true,
          price: true,
          image: true,
          requirements: true,
          preparation: true,
          available: true,
          slotsBooked: true,
          createdAt: true
        }
      });

      return {
        message: 'Lab technique added successfully',
        labTechnique: { ...labTechnique, _id: labTechnique.id }
      };
    } catch (error: any) {
      console.error('POST /api/lab-techniques error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const labTechnique = await this.prisma.labTechnique.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          duration: true,
          price: true,
          image: true,
          requirements: true,
          preparation: true,
          available: true,
          slotsBooked: true,
          createdAt: true
        }
      });

      if (!labTechnique) {
        throw new HttpException('Lab technique not found', HttpStatus.NOT_FOUND);
      }

      return { ...labTechnique, _id: labTechnique.id };
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

      // Build update data object
      const data: any = {};
      if (updates.name !== undefined) data.name = updates.name;
      if (updates.description !== undefined) data.description = updates.description;
      if (updates.category !== undefined) data.category = updates.category;
      if (updates.duration !== undefined) data.duration = updates.duration;
      if (updates.price !== undefined) data.price = Number(updates.price);
      if (updates.image !== undefined) data.image = updates.image;
      if (updates.requirements !== undefined) data.requirements = updates.requirements;
      if (updates.preparation !== undefined) data.preparation = updates.preparation;
      if (updates.available !== undefined) data.available = updates.available;

      const labTechnique = await this.prisma.labTechnique.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          duration: true,
          price: true,
          image: true,
          requirements: true,
          preparation: true,
          available: true,
          slotsBooked: true,
          createdAt: true
        }
      });

      return {
        message: 'Lab technique updated successfully',
        labTechnique: { ...labTechnique, _id: labTechnique.id }
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpException('Lab technique not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.prisma.labTechnique.delete({
        where: { id }
      });

      return { message: 'Lab technique deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpException('Lab technique not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
