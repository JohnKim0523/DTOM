import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventMember } from './entities/event-member.entity';
import { EventMembersService } from './event-members.service';
import { EventMembersController } from './event-members.controller';
import { InvitesController } from './invites.controller';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([EventMember]), EventsModule, NotificationsModule],
  controllers: [EventMembersController, InvitesController],
  providers: [EventMembersService],
  exports: [EventMembersService],
})
export class EventMembersModule {}
