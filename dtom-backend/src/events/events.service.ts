import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  async create(dto: CreateEventDto, organizerId: string): Promise<Event> {
    const event = this.eventsRepository.create({ ...dto, organizerId });
    return this.eventsRepository.save(event);
  }

  async findAll(page = 1, limit = 20): Promise<{ data: Event[]; total: number }> {
    const [data, total] = await this.eventsRepository.findAndCount({
      relations: ['organizer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findByOrganizer(userId: string): Promise<Event[]> {
    return this.eventsRepository.find({
      where: { organizerId: userId },
      relations: ['organizer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findJoined(userId: string): Promise<Event[]> {
    return this.eventsRepository
      .createQueryBuilder('event')
      .innerJoin('event_members', 'em', 'em.eventId = event.id')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .where('em.userId = :userId', { userId })
      .orderBy('event.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['organizer'],
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(
    id: string,
    dto: UpdateEventDto,
    userId: string,
  ): Promise<Event> {
    const event = await this.findOne(id);
    if (event.organizerId !== userId)
      throw new ForbiddenException('Only the organizer can update this event');
    await this.eventsRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const event = await this.findOne(id);
    if (event.organizerId !== userId)
      throw new ForbiddenException('Only the organizer can delete this event');
    await this.eventsRepository.remove(event);
  }

  async search(query: string): Promise<Event[]> {
    return this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .where('LOWER(event.title) LIKE LOWER(:q)', { q: `%${query}%` })
      .orWhere('LOWER(event.description) LIKE LOWER(:q)', { q: `%${query}%` })
      .orderBy('event.createdAt', 'DESC')
      .limit(20)
      .getMany();
  }
}
