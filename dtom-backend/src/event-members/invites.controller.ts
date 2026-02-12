import { Controller, Get, UseGuards } from '@nestjs/common';
import { EventMembersService } from './event-members.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('invites')
export class InvitesController {
  constructor(private readonly membersService: EventMembersService) {}

  @Get()
  async listMyInvites(@CurrentUser() user: User) {
    return this.membersService.listInvites(user.id);
  }
}
