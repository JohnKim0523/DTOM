import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from './entities/topic.entity';
import { TopicComment } from './entities/topic-comment.entity';
import { Vote } from './entities/vote.entity';
import { Thread } from '../threads/entities/thread.entity';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { EventMembersModule } from '../event-members/event-members.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Topic, TopicComment, Vote, Thread]),
    EventMembersModule,
    EventsModule,
    NotificationsModule,
  ],
  controllers: [TopicsController],
  providers: [TopicsService],
})
export class TopicsModule {}
