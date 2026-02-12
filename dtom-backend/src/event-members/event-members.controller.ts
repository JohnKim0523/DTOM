import {
  Controller,
  Post,
  Delete,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EventMembersService } from './event-members.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/members')
export class EventMembersController {
  constructor(private readonly membersService: EventMembersService) {}

  @Post()
  async join(@Param('eventId') eventId: string, @CurrentUser() user: User) {
    return this.membersService.join(eventId, user.id);
  }

  @Delete()
  async leave(@Param('eventId') eventId: string, @CurrentUser() user: User) {
    await this.membersService.leave(eventId, user.id);
    return { left: true };
  }

  @Get()
  async findAll(@Param('eventId') eventId: string) {
    return this.membersService.findByEvent(eventId);
  }

  @Patch(':userId/promote')
  async promote(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    return this.membersService.promote(eventId, userId, user.id);
  }

  @Patch(':userId/demote')
  async demote(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    return this.membersService.demote(eventId, userId, user.id);
  }

  @Delete(':userId/kick')
  async kick(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    await this.membersService.kick(eventId, userId, user.id);
    return { kicked: true };
  }

  @Post(':userId/invite')
  async invite(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    return this.membersService.invite(eventId, userId, user.id);
  }

  @Patch('accept-invite')
  async acceptInvite(
    @Param('eventId') eventId: string,
    @CurrentUser() user: User,
  ) {
    return this.membersService.acceptInvite(eventId, user.id);
  }

  @Delete('decline-invite')
  async declineInvite(
    @Param('eventId') eventId: string,
    @CurrentUser() user: User,
  ) {
    await this.membersService.declineInvite(eventId, user.id);
    return { declined: true };
  }
}
