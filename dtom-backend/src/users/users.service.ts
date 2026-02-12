import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { EventMember } from '../event-members/entities/event-member.entity';
import { Comment } from '../threads/entities/comment.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(EventMember)
    private readonly membersRepository: Repository<EventMember>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.usersRepository.update(id, dto);
    return this.findById(id);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.usersRepository.update(id, { password: hashedPassword });
  }

  async deleteAccount(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async getActivity(userId: string) {
    const [createdEvents, joinedMemberships, recentComments] = await Promise.all([
      this.eventsRepository.find({
        where: { organizerId: userId },
        relations: ['organizer'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.membersRepository.find({
        where: { userId },
        relations: ['event', 'event.organizer'],
        order: { joinedAt: 'DESC' },
        take: 10,
      }),
      this.commentsRepository.find({
        where: { authorId: userId },
        relations: ['event', 'author'],
        order: { createdAt: 'DESC' },
        take: 20,
      }),
    ]);

    const joinedEvents = joinedMemberships.map(m => m.event).filter(Boolean);

    return { createdEvents, joinedEvents, recentComments };
  }

  async search(query: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) LIKE LOWER(:q)', { q: `%${query}%` })
      .orWhere('LOWER(user.displayName) LIKE LOWER(:q)', { q: `%${query}%` })
      .limit(20)
      .getMany();
  }
}
