import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventMember, MemberRole } from './entities/event-member.entity';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class EventMembersService {
  constructor(
    @InjectRepository(EventMember)
    private readonly membersRepository: Repository<EventMember>,
    private readonly eventsService: EventsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async join(eventId: string, userId: string): Promise<EventMember> {
    const event = await this.eventsService.findOne(eventId);

    if (event.maxAttendees) {
      const count = await this.membersRepository.count({ where: { eventId } });
      if (count >= event.maxAttendees)
        throw new BadRequestException('Event is full');
    }

    const existing = await this.membersRepository.findOne({
      where: { eventId, userId },
    });
    if (existing) throw new ConflictException('Already a member of this event');

    const member = this.membersRepository.create({ eventId, userId });
    const saved = await this.membersRepository.save(member);
    if (event.organizerId !== userId) {
      await this.notificationsService.create(
        event.organizerId,
        NotificationType.EVENT_JOINED,
        `joined your event "${event.title}"`,
        userId,
        eventId,
      );
    }
    return saved;
  }

  async leave(eventId: string, userId: string): Promise<void> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId },
    });
    if (!member) throw new NotFoundException('Not a member of this event');
    await this.membersRepository.remove(member);
  }

  async findByEvent(eventId: string): Promise<EventMember[]> {
    return this.membersRepository.find({
      where: { eventId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async isMember(eventId: string, userId: string): Promise<boolean> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId },
    });
    return !!member;
  }

  async promote(eventId: string, targetUserId: string, requesterId: string): Promise<EventMember> {
    const event = await this.eventsService.findOne(eventId);
    if (event.organizerId !== requesterId) {
      throw new BadRequestException('Only the organizer can promote members');
    }
    const member = await this.membersRepository.findOne({
      where: { eventId, userId: targetUserId },
    });
    if (!member) throw new NotFoundException('Member not found');
    member.role = MemberRole.MODERATOR;
    return this.membersRepository.save(member);
  }

  async demote(eventId: string, targetUserId: string, requesterId: string): Promise<EventMember> {
    const event = await this.eventsService.findOne(eventId);
    if (event.organizerId !== requesterId) {
      throw new BadRequestException('Only the organizer can demote members');
    }
    const member = await this.membersRepository.findOne({
      where: { eventId, userId: targetUserId },
    });
    if (!member) throw new NotFoundException('Member not found');
    member.role = MemberRole.ATTENDEE;
    return this.membersRepository.save(member);
  }

  async kick(eventId: string, targetUserId: string, requesterId: string): Promise<void> {
    const event = await this.eventsService.findOne(eventId);
    const isOrganizer = event.organizerId === requesterId;
    if (!isOrganizer) {
      const requesterMember = await this.membersRepository.findOne({
        where: { eventId, userId: requesterId },
      });
      if (!requesterMember || requesterMember.role !== MemberRole.MODERATOR) {
        throw new BadRequestException('Only organizers and moderators can kick members');
      }
    }
    if (targetUserId === event.organizerId) {
      throw new BadRequestException('Cannot kick the organizer');
    }
    const member = await this.membersRepository.findOne({
      where: { eventId, userId: targetUserId },
    });
    if (!member) throw new NotFoundException('Member not found');
    await this.membersRepository.remove(member);
  }

  async getMemberRole(eventId: string, userId: string): Promise<string | null> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId },
    });
    return member ? member.role : null;
  }

  async invite(eventId: string, targetUserId: string, inviterId: string): Promise<EventMember> {
    const event = await this.eventsService.findOne(eventId);
    const isOrganizer = event.organizerId === inviterId;
    if (!isOrganizer) {
      const inviterMember = await this.membersRepository.findOne({
        where: { eventId, userId: inviterId },
      });
      if (!inviterMember || inviterMember.role !== MemberRole.MODERATOR) {
        throw new BadRequestException('Only organizers and moderators can invite');
      }
    }

    const existing = await this.membersRepository.findOne({
      where: { eventId, userId: targetUserId },
    });
    if (existing) throw new ConflictException('User is already a member or has a pending invite');

    const member = this.membersRepository.create({
      eventId,
      userId: targetUserId,
      role: MemberRole.INVITED,
    });
    const saved = await this.membersRepository.save(member);
    await this.notificationsService.create(
      targetUserId,
      NotificationType.EVENT_INVITATION,
      `invited you to "${event.title}"`,
      inviterId,
      eventId,
    );
    return saved;
  }

  async acceptInvite(eventId: string, userId: string): Promise<EventMember> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId, role: MemberRole.INVITED },
    });
    if (!member) throw new NotFoundException('No pending invitation found');
    member.role = MemberRole.ATTENDEE;
    const saved = await this.membersRepository.save(member);

    const event = await this.eventsService.findOne(eventId);
    await this.notificationsService.create(
      event.organizerId,
      NotificationType.EVENT_INVITE_ACCEPTED,
      `accepted your invitation to "${event.title}"`,
      userId,
      eventId,
    );
    return saved;
  }

  async declineInvite(eventId: string, userId: string): Promise<void> {
    const member = await this.membersRepository.findOne({
      where: { eventId, userId, role: MemberRole.INVITED },
    });
    if (!member) throw new NotFoundException('No pending invitation found');
    await this.membersRepository.remove(member);
  }

  async listInvites(userId: string): Promise<EventMember[]> {
    return this.membersRepository.find({
      where: { userId, role: MemberRole.INVITED },
      relations: ['event', 'event.organizer'],
      order: { joinedAt: 'DESC' },
    });
  }
}
