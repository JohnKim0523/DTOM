import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Thread, ThreadPermission, ThreadType } from './entities/thread.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { EventMembersService } from '../event-members/event-members.service';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ThreadsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Thread)
    private readonly threadsRepository: Repository<Thread>,
    private readonly membersService: EventMembersService,
    private readonly eventsService: EventsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // --- Thread CRUD ---

  async createThread(
    eventId: string,
    dto: CreateThreadDto,
    userId: string,
  ): Promise<Thread> {
    const event = await this.eventsService.findOne(eventId);
    if (event.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can create threads');
    }
    const thread = this.threadsRepository.create({
      title: dto.title,
      permission: dto.permission || ThreadPermission.OPEN,
      type: dto.type || ThreadType.CHANNEL,
      eventId,
      createdBy: userId,
    });
    return this.threadsRepository.save(thread);
  }

  async findThreadsByEvent(eventId: string, userId: string): Promise<Thread[]> {
    await this.assertMember(eventId, userId);
    return this.threadsRepository.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateThreadPermission(
    threadId: string,
    permission: ThreadPermission,
    userId: string,
  ): Promise<Thread> {
    const thread = await this.threadsRepository.findOne({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Thread not found');
    const event = await this.eventsService.findOne(thread.eventId);
    if (event.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can update thread permissions');
    }
    thread.permission = permission;
    return this.threadsRepository.save(thread);
  }

  async deleteThread(threadId: string, userId: string): Promise<void> {
    const thread = await this.threadsRepository.findOne({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Thread not found');
    const event = await this.eventsService.findOne(thread.eventId);
    if (event.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can delete threads');
    }
    await this.threadsRepository.remove(thread);
  }

  // --- Comment CRUD ---

  async create(
    eventId: string,
    dto: CreateCommentDto,
    userId: string,
    imageUrl?: string,
  ): Promise<Comment> {
    await this.assertMember(eventId, userId);

    if (dto.threadId) {
      const thread = await this.threadsRepository.findOne({ where: { id: dto.threadId } });
      if (!thread) throw new NotFoundException('Thread not found');
      if (thread.eventId !== eventId) {
        throw new ForbiddenException('Thread does not belong to this event');
      }
      if (thread.permission === ThreadPermission.LOCKED) {
        throw new ForbiddenException('This thread is locked');
      }
      if (thread.permission === ThreadPermission.READONLY) {
        const event = await this.eventsService.findOne(eventId);
        const isOrganizer = event.organizerId === userId;
        const memberRole = await this.membersService.getMemberRole(eventId, userId);
        const isModerator = memberRole === 'moderator';
        if (!isOrganizer && !isModerator) {
          throw new ForbiddenException('Only organizers and moderators can post in readonly threads');
        }
      }
    }

    const comment = this.commentsRepository.create({
      content: dto.content,
      eventId,
      authorId: userId,
      threadId: dto.threadId || null,
      imageUrl: imageUrl || null,
    });
    const saved = await this.commentsRepository.save(comment);

    const event = await this.eventsService.findOne(eventId);
    if (event.organizerId !== userId) {
      await this.notificationsService.create(
        event.organizerId,
        NotificationType.EVENT_COMMENT,
        `commented on your event "${event.title}"`,
        userId,
        eventId,
      );
    }

    return saved;
  }

  async findByEvent(eventId: string, userId: string, threadId?: string): Promise<Comment[]> {
    await this.assertMember(eventId, userId);
    const where: any = { eventId };
    if (threadId !== undefined) {
      where.threadId = threadId || null;
    }
    return this.commentsRepository.find({
      where,
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const event = await this.eventsService.findOne(comment.eventId);
    const isOrganizer = event.organizerId === userId;
    const isAuthor = comment.authorId === userId;
    const memberRole = await this.membersService.getMemberRole(comment.eventId, userId);
    const isModerator = memberRole === 'moderator';

    if (!isAuthor && !isOrganizer && !isModerator)
      throw new ForbiddenException(
        'Only the author, organizer, or a moderator can delete this comment',
      );

    await this.commentsRepository.remove(comment);
  }

  private async assertMember(
    eventId: string,
    userId: string,
  ): Promise<void> {
    const event = await this.eventsService.findOne(eventId);
    if (event.organizerId === userId) return;
    const isMember = await this.membersService.isMember(eventId, userId);
    if (!isMember)
      throw new ForbiddenException('You must be a member of this event');
  }
}
