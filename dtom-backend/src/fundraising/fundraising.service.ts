import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contribution } from './entities/contribution.entity';
import { Event } from '../events/entities/event.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class FundraisingService {
  constructor(
    @InjectRepository(Contribution)
    private readonly contribRepo: Repository<Contribution>,
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async contribute(eventId: string, userId: string, amount: number): Promise<Contribution> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) throw new BadRequestException('Event not found');
    if (!event.hasFundraising) throw new BadRequestException('This event does not have fundraising enabled');

    const contribution = this.contribRepo.create({ eventId, userId, amount });
    const saved = await this.contribRepo.save(contribution);

    // Update the event's fundraising current total
    await this.eventsRepo
      .createQueryBuilder()
      .update(Event)
      .set({ fundraisingCurrent: () => `fundraisingCurrent + ${amount}` })
      .where('id = :id', { id: eventId })
      .execute();

    if (event.organizerId !== userId) {
      await this.notificationsService.create(
        event.organizerId,
        NotificationType.FUNDRAISING_CONTRIBUTION,
        `contributed $${amount} to "${event.title}"`,
        userId,
        eventId,
      );
    }

    return saved;
  }

  async listByEvent(eventId: string): Promise<Contribution[]> {
    return this.contribRepo.find({
      where: { eventId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getEventTotal(eventId: string): Promise<number> {
    const result = await this.contribRepo
      .createQueryBuilder('c')
      .select('SUM(c.amount)', 'total')
      .where('c.eventId = :eventId', { eventId })
      .getRawOne();
    return parseFloat(result?.total) || 0;
  }
}
