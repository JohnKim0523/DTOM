import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) throw new ConflictException('Email already in use');

    const existingUsername = await this.usersService.findByUsername(
      dto.username,
    );
    if (existingUsername)
      throw new ConflictException('Username already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      displayName: dto.username,
    });

    const { password: _, ...userWithoutPassword } = user;
    const token = this.generateToken(user.id, user.email);
    return { user: userWithoutPassword, token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid)
      throw new UnauthorizedException('Invalid credentials');

    const { password, ...userWithoutPassword } = user;
    const token = this.generateToken(user.id, user.email);
    return { user: userWithoutPassword, token };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    const userWithPassword = await this.usersService.findByEmailWithPassword(user.email);
    if (!userWithPassword) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(oldPassword, userWithPassword.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashed);
    return { success: true };
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
