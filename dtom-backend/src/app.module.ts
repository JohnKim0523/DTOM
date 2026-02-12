import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { EventMembersModule } from './event-members/event-members.module';
import { ThreadsModule } from './threads/threads.module';
import { FriendsModule } from './friends/friends.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FundraisingModule } from './fundraising/fundraising.module';
import { FollowsModule } from './follows/follows.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    AuthModule,
    UsersModule,
    EventsModule,
    EventMembersModule,
    ThreadsModule,
    FriendsModule,
    MessagesModule,
    NotificationsModule,
    FundraisingModule,
    FollowsModule,
    AdminModule,
  ],
})
export class AppModule {}
