import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contribution } from './entities/contribution.entity';
import { Event } from '../events/entities/event.entity';
import { FundraisingService } from './fundraising.service';
import { FundraisingController } from './fundraising.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contribution, Event]),
    NotificationsModule,
  ],
  controllers: [FundraisingController],
  providers: [FundraisingService],
  exports: [FundraisingService],
})
export class FundraisingModule {}
