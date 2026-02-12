import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { Message } from '../messages/entities/message.entity';
import { Comment } from '../threads/entities/comment.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
  ) {}

  async getStats() {
    const [users, events, messages, comments] = await Promise.all([
      this.usersRepo.count(),
      this.eventsRepo.count(),
      this.messagesRepo.count(),
      this.commentsRepo.count(),
    ]);
    return { users, events, messages, comments };
  }

  // --- Users ---

  async listUsers(page = 1, limit = 20) {
    const [data, total] = await this.usersRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateUser(id: string, dto: Partial<User>) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepo.update(id, dto);
    return this.usersRepo.findOne({ where: { id } });
  }

  async deleteUser(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepo.delete(id);
    return { deleted: true };
  }

  // --- Events ---

  async listEvents(page = 1, limit = 20) {
    const [data, total] = await this.eventsRepo.findAndCount({
      relations: ['organizer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateEvent(id: string, dto: Partial<Event>) {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    await this.eventsRepo.update(id, dto);
    return this.eventsRepo.findOne({ where: { id }, relations: ['organizer'] });
  }

  async deleteEvent(id: string) {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    await this.eventsRepo.delete(id);
    return { deleted: true };
  }

  // --- Messages ---

  async listMessages(page = 1, limit = 20) {
    const [data, total] = await this.messagesRepo.findAndCount({
      relations: ['sender', 'receiver'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  // --- Comments ---

  async listComments(page = 1, limit = 20) {
    const [data, total] = await this.commentsRepo.findAndCount({
      relations: ['author', 'event'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async deleteComment(id: string) {
    const comment = await this.commentsRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.commentsRepo.delete(id);
    return { deleted: true };
  }
}
