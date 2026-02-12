import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: User) {
    return this.notificationsService.list(user.id);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.unreadCount(user.id);
    return { count };
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllRead(user.id);
    return { success: true };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: User) {
    await this.notificationsService.markRead(id, user.id);
    return { success: true };
  }
}
