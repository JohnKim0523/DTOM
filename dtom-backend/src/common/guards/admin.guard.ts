import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException('Admin access required');
    }
    try {
      const token = authHeader.split(' ')[1];
      const payload = this.jwtService.verify(token);
      if (payload.role !== 'admin') throw new Error();
      return true;
    } catch {
      throw new ForbiddenException('Admin access required');
    }
  }
}
