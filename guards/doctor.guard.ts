import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class DoctorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role !== 'doctor' && user.role !== 'admin') {
      throw new ForbiddenException('Access denied. Doctor or Admin role required.');
    }
    
    return true;
  }
}

