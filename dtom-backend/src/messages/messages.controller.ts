import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post(':receiverId')
  async send(
    @Param('receiverId') receiverId: string,
    @Body('content') content: string,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.send(user.id, receiverId, content);
  }

  @Get()
  async listConversations(@CurrentUser() user: User) {
    return this.messagesService.listConversations(user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.messagesService.getUnreadCount(user.id);
    return { count };
  }

  @Get(':userId')
  async getConversation(
    @Param('userId') userId: string,
    @Query('before') before: string,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.getConversation(user.id, userId, 50, before || undefined);
  }

  @Patch(':userId/read')
  async markRead(
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    await this.messagesService.markConversationRead(user.id, userId);
    return { success: true };
  }
}
