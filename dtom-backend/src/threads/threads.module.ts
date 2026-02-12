import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { ThreadsService } from './threads.service';
import { ThreadsController } from './threads.controller';
import { EventMembersModule } from '../event-members/event-members.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    EventMembersModule,
    EventsModule,
    NotificationsModule,
  ],
  controllers: [ThreadsController],
  providers: [ThreadsService],
})
export class ThreadsModule {}
