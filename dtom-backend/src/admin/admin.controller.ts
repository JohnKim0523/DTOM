import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    if (body.username !== 'admin' || body.password !== 'admin') {
      throw new UnauthorizedException('Invalid admin credentials');
    }
    const token = this.jwtService.sign({ role: 'admin' });
    return { token };
  }

  @UseGuards(AdminGuard)
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // --- Users ---

  @UseGuards(AdminGuard)
  @Get('users')
  listUsers(@Query('page') page?: string) {
    return this.adminService.listUsers(page ? parseInt(page, 10) : 1);
  }

  @UseGuards(AdminGuard)
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateUser(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // --- Events ---

  @UseGuards(AdminGuard)
  @Get('events')
  listEvents(@Query('page') page?: string) {
    return this.adminService.listEvents(page ? parseInt(page, 10) : 1);
  }

  @UseGuards(AdminGuard)
  @Patch('events/:id')
  updateEvent(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateEvent(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('events/:id')
  deleteEvent(@Param('id') id: string) {
    return this.adminService.deleteEvent(id);
  }

  // --- Messages ---

  @UseGuards(AdminGuard)
  @Get('messages')
  listMessages(@Query('page') page?: string) {
    return this.adminService.listMessages(page ? parseInt(page, 10) : 1);
  }

  // --- Comments ---

  @UseGuards(AdminGuard)
  @Get('comments')
  listComments(@Query('page') page?: string) {
    return this.adminService.listComments(page ? parseInt(page, 10) : 1);
  }

  @UseGuards(AdminGuard)
  @Delete('comments/:id')
  deleteComment(@Param('id') id: string) {
    return this.adminService.deleteComment(id);
  }
}
