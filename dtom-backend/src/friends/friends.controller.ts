import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':userId')
  async sendRequest(@Param('userId') userId: string, @CurrentUser() user: User) {
    return this.friendsService.sendRequest(user.id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/accept')
  async acceptRequest(@Param('id') id: string, @CurrentUser() user: User) {
    return this.friendsService.acceptRequest(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.friendsService.remove(id, user.id);
    return { deleted: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async listFriends(@CurrentUser() user: User) {
    return this.friendsService.listFriends(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('requests')
  async listPendingRequests(@CurrentUser() user: User) {
    return this.friendsService.listPendingRequests(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/:userId')
  async getStatus(@Param('userId') userId: string, @CurrentUser() user: User) {
    return this.friendsService.getStatus(user.id, userId);
  }
}
