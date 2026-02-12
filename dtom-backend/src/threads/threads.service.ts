import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { EventMembersService } from '../event-members/event-members.service';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ThreadsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    private readonly membersService: EventMembersService,
    private readonly eventsService: EventsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    eventId: string,
    dto: CreateCommentDto,
    userId: string,
  ): Promise<Comment> {
    await this.assertMember(eventId, userId);
    const comment = this.commentsRepository.create({
      ...dto,
      eventId,
      authorId: userId,
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

  async findByEvent(eventId: string, userId: string): Promise<Comment[]> {
    await this.assertMember(eventId, userId);
    return this.commentsRepository.find({
      where: { eventId },
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
