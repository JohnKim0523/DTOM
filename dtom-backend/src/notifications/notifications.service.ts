import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    message: string,
    actorId?: string,
    referenceId?: string,
  ): Promise<Notification> {
    const notif = this.notifRepo.create({
      userId,
      type,
      message,
      actorId: actorId || undefined,
      referenceId: referenceId || undefined,
    });
    return this.notifRepo.save(notif);
  }

  async list(userId: string, limit = 50): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { userId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.notifRepo.update({ id, userId }, { read: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ read: true })
      .where('userId = :userId AND read = false', { userId })
      .execute();
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notifRepo.count({ where: { userId, read: false } });
  }
}
