import { Controller, Post, Body, Get, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';

class RegisterDto {
  name!: string;
  email!: string;
  password!: string;
  phone?: string;
  role?: string;
}

class LoginDto {
  email!: string;
  password!: string;
}
import { AuthService } from '../../services/auth.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto): Promise<{ token: string; user: any }> {
    try {
      const { name, email, password, phone, role } = body;

      if (!name || !email || !password) {
        throw new HttpException('Name, email, and password are required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.authService.register({
        name,
        email: email.toLowerCase(),
        password,
        phone,
        role: role || 'patient',
      });

      // Generate token for the newly registered user
      const loginResult = await this.authService.login(user);

      return {
        token: loginResult.token,
        user: loginResult.user,
      };
    } catch (error: any) {
      if (error && error.code === 'P2002') {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(error?.message || 'Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
  async login(@Body() body: LoginDto): Promise<{ token: string; user: any }> {
    try {
      const { email, password } = body;

      if (!email || !password) {
        throw new HttpException('Email and password are required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.authService.validateUser(email.toLowerCase(), password);
      if (!user) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const loginResult = await this.authService.login(user);
      return {
        token: loginResult.token,
        user: loginResult.user,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any): Promise<any> {
    try {
      const user = await this.authService.getProfile(req.user.id);
      // Add _id for backward compatibility
      return {
        ...user,
        _id: user.id
      };
    } catch (error) {
      throw new HttpException('Failed to get profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}